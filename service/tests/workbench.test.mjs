import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase } from "../sqlite.mjs";
import { api } from "../api.mjs";
import { checklist } from "../catalog.mjs";
const catalog = {
  cg_ref: "test",
  cg_commit: "test",
  packs: [
    {
      name: "delivery-data-app",
      version: "0.1.0",
      sha256: "a".repeat(64),
      zip: "/downloads/delivery-data-app.zip",
    },
  ],
};
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "cg-api-"));
  const path = join(dir, "db.sqlite");
  let db = openDatabase(path);
  return {
    get db() {
      return db;
    },
    reopen() {
      db.close();
      db = openDatabase(path);
    },
    close() {
      db.close();
      rmSync(dir, { recursive: true, force: true });
    },
    async call(path, body, options = {}) {
      const headers = {
        "content-type": "application/json",
        ...(options.user === null
          ? {}
          : { "oai-authenticated-user-id": options.user || "alice" }),
        ...options.headers,
      };
      if (options.token) {
        delete headers["oai-authenticated-user-id"];
        headers.authorization = "Bearer " + options.token;
      }
      const r = await api(
        new Request("https://cg.example" + path, {
          method: body ? "POST" : "GET",
          headers,
          ...(body ? { body: JSON.stringify(body) } : {}),
        }),
        { DB: db },
        catalog,
      );
      return { status: r.status, ...(await r.json()) };
    },
  };
}
const solution = (extra = {}) => ({
  project: "sample",
  types: ["data-app", "retail-multistore"],
  answers: Object.fromEntries(checklist.questions.map((q) => [q.id, "给不出"])),
  client_request_id: crypto.randomUUID(),
  ...extra,
});

test("full loop: checklist, receipt, gap, processing, evidence, persistence, withdrawal and reopen", async () => {
  const f = fixture();
  try {
    assert.equal((await f.call("/v1/checklist")).questions.length, 6);
    const r = await f.call("/v1/requests", solution());
    assert.equal(r.status, 201);
    assert.equal(r.results.length, 2);
    assert.equal(r.results[0].status, "ready");
    assert.equal(r.results[1].status, "skeleton");
    const tid = r.results[1].ticket;
    let t = await f.call("/v1/tickets/" + tid);
    assert.equal(t.status, "open");
    assert.equal(t.events.length, 1);
    let changed = await f.call("/v1/tickets/" + tid, {
      action: "transition",
      status: "accepted",
      revision: 1,
      note: "维护者决定补齐",
    });
    assert.equal(changed.ticket.status, "accepted");
    assert.equal(
      (
        await f.call("/v1/tickets/" + tid, {
          action: "transition",
          status: "ready",
          revision: 2,
          packs: [],
          note: "不应允许",
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await f.call("/v1/tickets/" + tid, {
          action: "transition",
          status: "ready",
          revision: 2,
          packs: ["imaginary"],
          note: "不应允许",
        })
      ).status,
      409,
    );
    changed = await f.call("/v1/tickets/" + tid, {
      action: "transition",
      status: "ready",
      revision: 2,
      packs: ["delivery-data-app"],
      note: "只关联通用包，零售仍需项目材料",
    });
    assert.equal(changed.ticket.status, "ready");
    assert.equal(
      (
        await f.call("/v1/tickets/" + tid + "/evidence", {
          stage: "checked",
          detail: "独立运行检查，退出码 0；记录不代表服务代跑",
        })
      ).status,
      201,
    );
    f.reopen();
    t = await f.call("/v1/tickets/" + tid);
    assert.equal(t.events.length, 4);
    assert.equal(t.events[3].payload.reported, true);
    await f.call("/v1/tickets/" + tid, {
      action: "withdraw",
      revision: 3,
      note: "提交者撤回",
    });
    assert.equal((await f.call("/v1/tickets/" + tid)).status, "closed");
    await f.call("/v1/tickets/" + tid, {
      action: "transition",
      status: "open",
      revision: 4,
      note: "重新打开",
    });
    assert.equal((await f.call("/v1/tickets/" + tid)).revision, 5);
  } finally {
    f.close();
  }
});

test("response-loss retry and simultaneous retries create one receipt and one set of tickets", async () => {
  const f = fixture();
  try {
    const b = solution();
    const results = await Promise.all([
      f.call("/v1/requests", b),
      f.call("/v1/requests", b),
    ]);
    assert.equal(results[0].request_id, results[1].request_id);
    assert.equal((await f.call("/v1/tickets")).total, 2);
    assert.equal(
      (await f.call("/v1/requests", { ...b, project: "changed" })).status,
      409,
    );
  } finally {
    f.close();
  }
});

test("identity separation, project scope, token revocation and no maintenance via project token", async () => {
  const f = fixture();
  try {
    assert.equal(
      (await f.call("/v1/tickets", null, { user: null })).status,
      401,
    );
    const r = await f.call("/v1/requests", solution());
    const tid = r.results[1].ticket;
    assert.equal(
      (await f.call("/v1/tickets/" + tid, null, { user: "bob" })).status,
      404,
    );
    assert.equal((await f.call("/v1/tickets", null, { user: "bob" })).total, 0);
    const key = await f.call("/v1/tokens", { project: "sample" });
    assert.equal(
      (await f.call("/v1/tickets/" + tid, null, { token: key.token })).id,
      tid,
    );
    assert.equal(
      (
        await f.call("/v1/requests", solution({ project: "forbidden" }), {
          token: key.token,
        })
      ).status,
      403,
    );
    const other = await f.call("/v1/requests", solution({ project: "other" }));
    assert.equal(
      (
        await f.call("/v1/tickets/" + other.results[0].ticket, null, {
          token: key.token,
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await f.call(
          "/v1/tickets/" + tid,
          {
            action: "transition",
            status: "accepted",
            revision: 1,
            note: "不应允许",
          },
          { token: key.token },
        )
      ).status,
      403,
    );
    assert.equal(
      (await f.call("/v1/tokens", { project: "sample" }, { token: key.token }))
        .status,
      403,
    );
    assert.equal((await f.call("/v1/tokens")).items[0].token, undefined);
    await f.call("/v1/tokens/" + key.id + "/revoke", {});
    assert.equal(
      (await f.call("/v1/tickets/" + tid, null, { token: key.token })).status,
      401,
    );
  } finally {
    f.close();
  }
});

test("conflicting maintenance updates preserve a single committed transition", async () => {
  const f = fixture();
  try {
    const r = await f.call("/v1/requests", solution());
    const tid = r.results[1].ticket;
    const edits = await Promise.all(
      ["accepted", "declined"].map((status) =>
        f.call("/v1/tickets/" + tid, {
          action: "transition",
          status,
          revision: 1,
          note: "已审阅",
        }),
      ),
    );
    assert.equal(edits.filter((x) => x.event_id).length, 1);
    assert.equal(edits.filter((x) => x.status === 409).length, 1);
    const t = await f.call("/v1/tickets/" + tid);
    assert.equal(t.revision, 2);
    assert.equal(t.events.length, 2);
  } finally {
    f.close();
  }
});

test("feedback, search, pagination, invalid payloads and cross-origin requests", async () => {
  const f = fixture();
  try {
    for (let i = 0; i < 52; i++)
      await f.call("/v1/requests", {
        kind: "feedback",
        project: i % 2 ? "north" : "south",
        category: "validator",
        where: "page.html",
        text: "列表误报 " + i,
        client_request_id: crypto.randomUUID(),
      });
    assert.equal((await f.call("/v1/tickets")).items.length, 50);
    assert.equal((await f.call("/v1/tickets?offset=50")).items.length, 2);
    assert.equal((await f.call("/v1/tickets?project=north&q=误报")).total, 26);
    assert.equal((await f.call("/v1/tickets?q=不存在")).total, 0);
    assert.equal((await f.call("/v1/tickets?q=%25")).total, 0);
    assert.equal(
      (await f.call("/v1/requests", solution({ types: ["made-up"] }))).status,
      400,
    );
    assert.equal(
      (await f.call("/v1/requests", solution({ answers: {} }))).status,
      400,
    );
    assert.equal(
      (
        await f.call("/v1/requests", solution(), {
          headers: { origin: "https://evil.example" },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await f.call(
          "/v1/requests",
          solution({ answers: { systems: "x".repeat(70000) } }),
        )
      ).status,
      413,
    );
  } finally {
    f.close();
  }
});

test("page provides architecture, paired views, search, receipts and local assets", () => {
  const html = readFileSync(
    new URL("../../web/index.html", import.meta.url),
    "utf8",
  );
  assert.match(html, /<meta charset="utf-8"\s*\/?>(\s*)<meta name="viewport"/);
  for (const id of [
    "client-title",
    "provider-title",
    "filters",
    "request-form",
    "feedback-form",
    "notice",
    "detail",
    "connection",
  ])
    assert.ok(html.includes(`id="${id}"`));
  assert.doesNotMatch(html, /(?:src|href)="https?:\/\//);
});
