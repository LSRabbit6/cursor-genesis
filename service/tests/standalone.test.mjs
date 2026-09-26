import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  rmSync,
  readFileSync,
  writeFileSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { get } from "node:http";
import { createAccess, digest } from "../access.mjs";
import { createWorkbenchServer } from "../http.mjs";
import { openDatabase } from "../sqlite.mjs";
import { api } from "../api.mjs";
import worker from "../../dist/server/index.js";
const catalog = JSON.parse(readFileSync("dist/client/catalog.json", "utf8"));
const root = resolve(".");
const adminKey = "cg_admin_test_" + "a".repeat(43);
const config = { version: 1, owner: "local-owner", key_hash: digest(adminKey) };

test("independent CG login, multi-harness handoff, scope, revocation, CLI and restart", async () => {
  const dir = mkdtempSync(join(tmpdir(), "cg-independent-"));
  let db,
    server,
    origin,
    clock = Date.now();
  const start = async () => {
    db = openDatabase(join(dir, "db.sqlite"));
    server = createWorkbenchServer({
      db,
      catalog,
      worker,
      access: createAccess(config, () => clock),
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    origin = `http://127.0.0.1:${server.address().port}`;
  };
  const stop = async () => {
    await new Promise((ok) => server.close(ok));
    db.close();
  };
  const call = async (path, body, headers = {}) =>
    fetch(origin + path, {
      headers: { "Content-Type": "application/json", ...headers },
      ...(body !== undefined
        ? { method: "POST", body: JSON.stringify(body) }
        : {}),
      redirect: "manual",
    });
  let stopped = false;
  try {
    await start();
    assert.equal((await call("/")).headers.get("location"), "/login.html");
    assert.equal((await call("/login.html")).status, 200);
    assert.equal(
      (
        await call("/v1/tickets", undefined, {
          "oai-authenticated-user-id": "local-owner",
          "x-cg-owner": "local-owner",
          "sec-fetch-site": "same-origin",
        })
      ).status,
      401,
    );
    const badHost = await new Promise((ok, no) => {
      get(
        origin + "/v1/tickets",
        { headers: { host: "evil.example" } },
        (response) => {
          response.resume();
          ok(response.statusCode);
        },
      ).on("error", no);
    });
    assert.equal(badHost, 403);
    assert.equal((await call("/auth/login", { key: adminKey })).status, 403);
    assert.equal(
      (
        await call(
          "/auth/login",
          { key: adminKey },
          { origin: "https://evil.example" },
        )
      ).status,
      403,
    );
    assert.equal(
      (await call("/auth/login", { key: "wrong" }, { origin })).status,
      401,
    );
    const login = await call("/auth/login", { key: adminKey }, { origin });
    assert.equal(login.status, 200);
    assert.match(login.headers.get("set-cookie"), /HttpOnly; SameSite=Strict/);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    assert.equal((await call("/", undefined, { cookie })).status, 200);
    assert.equal(
      (await (await call("/v1/me", undefined, { cookie })).json()).mode,
      "standalone",
    );
    const a = await (
      await call(
        "/v1/tokens",
        { project: "shared", label: "Harness A" },
        { cookie, origin },
      )
    ).json();
    const b = await (
      await call(
        "/v1/tokens",
        { project: "shared", label: "Harness B" },
        { cookie, origin },
      )
    ).json();
    const other = await (
      await call(
        "/v1/tokens",
        { project: "other", label: "Harness C" },
        { cookie, origin },
      )
    ).json();
    assert.equal(a.label, "Harness A");
    const headersA = { authorization: "Bearer " + a.token };
    const headersB = { authorization: "Bearer " + b.token };
    assert.equal(
      (await call("/v1/tokens", { project: "shared" }, headersA)).status,
      403,
    );
    const receipt = await (
      await call(
        "/v1/requests",
        {
          project: "shared",
          kind: "feedback",
          category: "want",
          text: "接力任务",
          client_request_id: "handoff-1",
        },
        headersA,
      )
    ).json();
    assert.ok(receipt.ticket);
    assert.equal(
      (
        await call("/v1/tickets/" + receipt.ticket, undefined, {
          authorization: "Bearer " + other.token,
        })
      ).status,
      404,
    );
    assert.equal(
      (await call("/v1/requests", { project: "other" }, headersA)).status,
      403,
    );
    assert.equal(
      (await call("/v1/tickets/" + receipt.ticket, undefined, headersB)).status,
      200,
    );
    assert.equal(
      (
        await call(
          "/v1/tickets/" + receipt.ticket + "/evidence",
          { stage: "checked", detail: "Harness B 接续验证" },
          headersB,
        )
      ).status,
      201,
    );
    assert.equal(
      (
        await call(
          "/v1/tickets/" + receipt.ticket,
          {
            action: "transition",
            status: "accepted",
            revision: 1,
            note: "越权",
          },
          headersB,
        )
      ).status,
      403,
    );
    const record = await (
      await call("/v1/tickets/" + receipt.ticket, undefined, { cookie })
    ).json();
    assert.equal(record.events[0].actor, a.id);
    assert.equal(record.events[1].actor, b.id);
    assert.equal(
      (await call("/v1/tokens/" + a.id + "/revoke", {}, { cookie, origin }))
        .status,
      200,
    );
    assert.equal((await call("/v1/tickets", undefined, headersA)).status, 401);
    assert.equal((await call("/v1/tickets", undefined, headersB)).status, 200);
    const child = spawn(
      process.env.PYTHON || "python3",
      [join(root, "scripts/menu.py"), "status", receipt.ticket],
      {
        cwd: dir,
        env: {
          ...process.env,
          CG_MENU_URL: origin,
          CG_MENU_TOKEN: b.token,
          CG_MENU_CONFIG: join(dir, "config"),
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let output = "",
      errors = "";
    child.stdout.on("data", (c) => (output += c));
    child.stderr.on("data", (c) => (errors += c));
    const [code] = await once(child, "exit");
    assert.equal(code, 0, errors);
    assert.equal(JSON.parse(output).id, receipt.ticket);
    clock += 8 * 60 * 60 * 1000 + 1;
    assert.equal((await call("/v1/me", undefined, { cookie })).status, 401);
    const second = await call("/auth/login", { key: adminKey }, { origin });
    const secondCookie = second.headers.get("set-cookie").split(";")[0];
    assert.equal(
      (await call("/auth/logout", {}, { origin, cookie: secondCookie })).status,
      200,
    );
    assert.equal(
      (await call("/v1/me", undefined, { cookie: secondCookie })).status,
      401,
    );
    await stop();
    stopped = true;
    await start();
    stopped = false;
    assert.equal((await call("/v1/me", undefined, { cookie })).status, 401);
    assert.equal(
      (await call("/v1/tickets/" + receipt.ticket, undefined, headersB)).status,
      200,
    );
    assert.equal((await call("/v1/tickets", undefined, headersA)).status, 401);
  } finally {
    if (server && !stopped) await stop();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CG core rejects platform identity; sessions use secure cookies and login throttling", async () => {
  const db = openDatabase(":memory:");
  try {
    const response = await api(
      new Request("https://cg.example/v1/me", {
        headers: {
          "oai-authenticated-user-id": "owner",
          "x-cg-owner": "owner",
        },
      }),
      { DB: db },
      catalog,
    );
    assert.equal(response.status, 401);
    let time = 1;
    const access = createAccess(config, () => time);
    const login = (key) =>
      access.handle(
        new Request("https://cg.example/auth/login", {
          method: "POST",
          headers: {
            origin: "https://cg.example",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ key }),
        }),
      );
    for (let i = 0; i < 10; i++)
      assert.equal((await login("wrong")).status, 401);
    assert.equal((await login(adminKey)).status, 429);
    time += 60_001;
    assert.match((await login(adminKey)).headers.get("set-cookie"), /; Secure/);
  } finally {
    db.close();
  }
});

test("access initialization stores a hash only, refuses overwrite and external startup fails closed", () => {
  const dir = mkdtempSync(join(tmpdir(), "cg-access-"));
  try {
    const path = join(dir, "access.json");
    const result = spawnSync(
      process.execPath,
      ["scripts/init-access.mjs", path],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0);
    const key = result.stdout.match(/cg_admin_[A-Za-z0-9_-]{43}/)[0];
    const contents = readFileSync(path, "utf8");
    assert.equal(JSON.parse(contents).key_hash, digest(key));
    assert.ok(!contents.includes(key));
    assert.equal(statSync(path).mode & 0o777, 0o600);
    assert.equal(
      spawnSync(process.execPath, ["scripts/init-access.mjs", path]).status,
      1,
    );
    assert.equal(readFileSync(path, "utf8"), contents);
    const env = { ...process.env };
    delete env.CG_ACCESS_FILE;
    delete env.CG_ORIGIN;
    assert.notEqual(
      spawnSync(process.execPath, ["service/standalone.mjs"], { env }).status,
      0,
    );
    env.CG_ACCESS_FILE = path;
    env.CG_ORIGIN = "http://cg.example";
    assert.notEqual(
      spawnSync(process.execPath, ["service/standalone.mjs"], { env }).status,
      0,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
