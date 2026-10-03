import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  rmSync,
  readFileSync,
  writeFileSync,
  statSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { api } from "../api.mjs";
import { openDatabase } from "../sqlite.mjs";
import { hash } from "../db.mjs";
const python = process.env.PYTHON || "python3";
const catalog = { packs: [] };
const feedback = (project = "sample") => ({
  project,
  kind: "feedback",
  category: "validator",
  text: "private source text",
  where: "/private/path",
  client_request_id: crypto.randomUUID(),
});
const summary = {
  problem: "public problem",
  source: "reproduction",
  boundary: "sample only",
  proposal: "proposed rule",
  verification: "test command",
  limitations: "not released",
};
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "cg-maintenance-")),
    path = join(dir, "workbench.sqlite");
  const db = openDatabase(path);
  return {
    dir,
    path,
    db,
    close() {
      db.close();
      rmSync(dir, { recursive: true, force: true });
    },
    async call(path, body, token, owner = "owner") {
      const response = await api(
        new Request("https://cg.example" + path, {
          method: body ? "POST" : "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { authorization: "Bearer " + token } : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        }),
        {
          DB: db,
          ...(token ? {} : { CG_PRINCIPAL: { owner, role: "maintainer" } }),
        },
        catalog,
      );
      return { code: response.status, data: await response.json() };
    },
  };
}
test("legacy database migration preserves old token rights and data", async () => {
  const dir = mkdtempSync(join(tmpdir(), "cg-upgrade-")),
    path = join(dir, "legacy.sqlite");
  let db;
  try {
    const raw = new DatabaseSync(path);
    raw.exec("CREATE TABLE _local_migrations(name TEXT PRIMARY KEY)");
    for (const name of readdirSync("drizzle")
      .filter((n) => /^000[01]_.*\.sql$/.test(n))
      .sort()) {
      raw.exec(readFileSync("drizzle/" + name, "utf8"));
      raw.prepare("INSERT INTO _local_migrations VALUES(?)").run(name);
    }
    const token = "cg_" + "x".repeat(64);
    raw
      .prepare(
        "INSERT INTO tokens(id,hash,owner,project,label,created) VALUES(?,?,?,?,?,?)",
      )
      .run(
        "legacy",
        await hash(token),
        "owner",
        "sample",
        "old",
        "2026-01-01T00:00:00Z",
      );
    raw.close();
    db = openDatabase(path);
    const r = await api(
      new Request("https://cg.example/v1/me", {
        headers: { authorization: "Bearer " + token },
      }),
      { DB: db },
      catalog,
    );
    assert.equal(r.status, 200);
    const me = await r.json();
    assert.deepEqual(me.scopes, ["read", "submit", "evidence", "withdraw"]);
    assert.equal(me.expires_at, null);
    db.close();
    db = openDatabase(path);
    assert.equal(
      (await db.prepare("SELECT count(*) AS n FROM tokens").first()).n,
      1,
    );
  } finally {
    db?.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("scoped tokens deny unauthorized operations, record use, expire and revoke independently", async () => {
  const f = fixture();
  try {
    const tid = (await f.call("/v1/requests", feedback())).data.ticket;
    const readonly = (
      await f.call("/v1/tokens", {
        project: "sample",
        scopes: ["read"],
        expires_at: new Date(Date.now() + 60000).toISOString(),
      })
    ).data;
    assert.equal(
      (await f.call("/v1/tickets/" + tid, null, readonly.token)).code,
      200,
    );
    for (const [path, body] of [
      ["/v1/requests", feedback()],
      ["/v1/tickets/" + tid + "/evidence", { stage: "checked", detail: "x" }],
      ["/v1/tickets/" + tid, { action: "withdraw", revision: 1, note: "x" }],
      ["/v1/tokens", { project: "sample" }],
    ])
      assert.equal((await f.call(path, body, readonly.token)).code, 403);
    const submitter = (
      await f.call("/v1/tokens", { project: "sample", scopes: ["submit"] })
    ).data;
    assert.equal(
      (await f.call("/v1/requests", feedback(), submitter.token)).code,
      201,
    );
    assert.equal(
      (await f.call("/v1/tickets", null, submitter.token)).code,
      403,
    );
    assert.equal(
      (await f.call("/v1/requests", feedback("other"), submitter.token)).code,
      403,
    );
    const writer = (
      await f.call("/v1/tokens", {
        project: "sample",
        scopes: ["read", "evidence", "withdraw"],
      })
    ).data;
    assert.equal(
      (
        await f.call(
          "/v1/tickets/" + tid + "/evidence",
          { stage: "checked", detail: "test passed" },
          writer.token,
        )
      ).code,
      201,
    );
    assert.equal(
      (
        await f.call(
          "/v1/tickets/" + tid,
          { action: "transition", status: "resolved", revision: 1, note: "x" },
          writer.token,
        )
      ).code,
      403,
    );
    assert.equal(
      (
        await f.call(
          "/v1/tickets/" + tid,
          { action: "withdraw", revision: 1, note: "x" },
          writer.token,
        )
      ).code,
      200,
    );
    const withdrawOnly = (
      await f.call("/v1/tokens", { project: "sample", scopes: ["withdraw"] })
    ).data;
    const withdrawal = await f.call(
      "/v1/tickets/" + tid,
      { action: "withdraw", revision: 2, note: "retry" },
      withdrawOnly.token,
    );
    assert.equal(withdrawal.code, 200);
    assert.equal(
      withdrawal.data.ticket.body,
      undefined,
      "withdraw-only must not expose source text",
    );
    const fresh = (await f.call("/v1/requests", feedback())).data.ticket;
    const closed = await f.call(
      "/v1/tickets/" + fresh,
      { action: "withdraw", revision: 1, note: "close", packs: ["forbidden"] },
      withdrawOnly.token,
    );
    assert.equal(closed.code, 200);
    assert.equal(closed.data.ticket.body, undefined);
    const list = (await f.call("/v1/tokens")).data.items;
    assert.ok(list.find((t) => t.id === readonly.id).last_used);
    assert.ok(!("hash" in list[0]));
    assert.ok(!("token" in list[0]));
    assert.equal(
      (
        await f.call("/v1/tokens/" + writer.id + "/policy", {
          scopes: ["read"],
          expires_at: null,
        })
      ).code,
      200,
    );
    assert.equal(
      (
        await f.call(
          "/v1/tickets/" + tid + "/evidence",
          { stage: "checked", detail: "x" },
          writer.token,
        )
      ).code,
      403,
    );
    for (const scopes of [[], ["read", "read"], ["admin"], "read"])
      assert.equal(
        (await f.call("/v1/tokens", { project: "sample", scopes })).code,
        400,
      );
    for (const expires_at of ["bad", "2000-01-01T00:00:00Z", 42])
      assert.equal(
        (await f.call("/v1/tokens", { project: "sample", expires_at })).code,
        400,
      );
    await f.db
      .prepare("UPDATE tokens SET expires_at=? WHERE id=?")
      .bind("2000-01-01T00:00:00.000Z", readonly.id)
      .run();
    assert.equal((await f.call("/v1/me", null, readonly.token)).code, 401);
    await f.call("/v1/tokens/" + writer.id + "/revoke", {});
    assert.equal((await f.call("/v1/me", null, writer.token)).code, 401);
    assert.equal(
      (
        await f.call("/v1/tokens/" + writer.id + "/policy", {
          scopes: ["read"],
          expires_at: null,
        })
      ).code,
      409,
    );
    assert.equal((await f.call("/v1/me", null, submitter.token)).code, 200);
    assert.equal(
      (
        await f.call(
          "/v1/tokens/" + submitter.id + "/policy",
          { scopes: ["read"], expires_at: null },
          null,
          "other",
        )
      ).code,
      404,
    );
  } finally {
    f.close();
  }
});
test("backflow requires reviewed summaries, never exports raw data, supports retry and PR links", async () => {
  const f = fixture();
  try {
    const tid = (await f.call("/v1/requests", feedback("private-project"))).data
      .ticket;
    const path = "/v1/tickets/" + tid + "/backflow";
    const token = (await f.call("/v1/tokens", { project: "private-project" }))
      .data.token;
    assert.equal(
      (
        await f.call(
          path,
          { action: "export", reviewed: true, ...summary },
          token,
        )
      ).code,
      403,
    );
    assert.equal(
      (
        await f.call(
          path,
          { action: "export", reviewed: true, ...summary },
          null,
          "other",
        )
      ).code,
      404,
    );
    assert.equal(
      (await f.call(path, { action: "export", ...summary })).code,
      400,
    );
    assert.equal(
      (await f.call(path, { action: "export", reviewed: true })).code,
      400,
    );
    const result = (
      await f.call(path, { action: "export", reviewed: true, ...summary })
    ).data;
    assert.doesNotMatch(
      JSON.stringify(result.packet),
      /private-project|private source text|private\/path|owner/,
    );
    const retry = (
      await f.call(path, { action: "export", reviewed: true, ...summary })
    ).data;
    assert.equal(retry.event_id, result.event_id);
    assert.equal(retry.replayed, true);
    assert.equal(
      (await f.call(path, { action: "link", url: "javascript:alert(1)" })).code,
      400,
    );
    const link = {
      action: "link",
      url: "https://github.com/example/cg/pull/12",
    };
    assert.equal((await f.call(path, link)).code, 200);
    assert.equal((await f.call(path, link)).data.replayed, true);
    assert.equal((await f.call(path)).data.items.length, 2);
    const file = join(f.dir, "packet.json");
    writeFileSync(file, JSON.stringify(result.packet));
    const args = [
      "scripts/import-backflow.py",
      file,
      "--destination",
      join(f.dir, "pending"),
    ];
    let imported = spawnSync(python, args, { encoding: "utf8" });
    assert.equal(imported.status, 0, imported.stderr);
    assert.match(
      readFileSync(join(f.dir, "pending", tid, "SUBMISSION.md"), "utf8"),
      /public problem/,
    );
    assert.equal(
      spawnSync(python, args).status,
      1,
      "must not replace an existing review",
    );
    writeFileSync(
      file,
      JSON.stringify({ ...result.packet, ticket: "../../escape" }),
    );
    assert.equal(spawnSync(python, args).status, 1);
    writeFileSync(file, JSON.stringify({ ...result.packet, raw: "private" }));
    assert.equal(spawnSync(python, args).status, 1);
  } finally {
    f.close();
  }
});
test("online WAL backup restores data and credentials, rejects overwrite and corrupted backup", async () => {
  const f = fixture();
  let restored;
  try {
    const key = (
      await f.call("/v1/tokens", { project: "sample", scopes: ["read"] })
    ).data;
    const ticket = (await f.call("/v1/requests", feedback())).data.ticket;
    const access = join(f.dir, "access.json"),
      backup = join(f.dir, "backup"),
      output = join(f.dir, "restored");
    writeFileSync(
      access,
      JSON.stringify({ version: 1, owner: "owner", key_hash: "a".repeat(64) }),
    );
    const run = (...args) =>
      spawnSync(python, ["scripts/backup.py", ...args], { encoding: "utf8" });
    const b = run(
      "backup",
      "--db",
      f.path,
      "--access",
      access,
      "--output",
      backup,
    );
    assert.equal(b.status, 0, b.stderr);
    const r = run("restore", "--from", backup, "--output", output);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(statSync(join(output, "access.json")).mode & 0o777, 0o600);
    restored = openDatabase(join(output, "workbench.sqlite"));
    const result = await api(
      new Request("https://cg.example/v1/tickets/" + ticket, {
        headers: { authorization: "Bearer " + key.token },
      }),
      { DB: restored },
      catalog,
    );
    assert.equal(result.status, 200);
    assert.equal((await result.json()).id, ticket);
    assert.equal(
      run("restore", "--from", backup, "--output", output).status,
      1,
    );
    assert.equal(
      run("backup", "--db", f.path, "--access", access, "--output", backup)
        .status,
      1,
    );
    writeFileSync(join(backup, "access.json"), "tampered");
    assert.equal(
      run("restore", "--from", backup, "--output", join(f.dir, "bad")).status,
      1,
    );
  } finally {
    restored?.close();
    f.close();
  }
});
