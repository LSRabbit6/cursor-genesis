import {
  one,
  all,
  statement,
  hash,
  id,
  stamp,
  Fault,
  fail,
  string,
  object,
  canonical,
} from "./db.mjs";
import {
  checklist,
  types,
  skeleton,
  statusNames,
  evidenceNames,
} from "./catalog.mjs";
const json = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
const parseTicket = (t) => ({
  ...t,
  body: JSON.parse(t.body),
  packs: JSON.parse(t.packs),
});
async function identity(req, db) {
  const authorization = req.headers.get("authorization");
  if (authorization) {
    if (!/^Bearer [A-Za-z0-9_-]{30,}$/.test(authorization))
      fail(401, "项目令牌无效。");
    const t = await one(
      db,
      "SELECT * FROM tokens WHERE hash=? AND revoked=0",
      await hash(authorization.slice(7)),
    );
    if (!t) fail(401, "项目令牌无效或已撤销。");
    return { owner: t.owner, project: t.project, role: "client", actor: t.id };
  }
  const user = req.headers.get("oai-authenticated-user-id");
  if (!user) fail(401, "请先登录，再查看自己的协作记录。");
  return { owner: user, role: "maintainer", actor: "browser" };
}
function projectFor(actor, value) {
  const p = string(value, "项目名", 120);
  if (actor.project && p !== actor.project)
    fail(403, "令牌只能访问绑定的项目。");
  return p;
}
function maintain(a) {
  if (a.role !== "maintainer") fail(403, "只有维护视角可以处理请求。");
}
async function bodyOf(req) {
  if (!req.headers.get("content-type")?.startsWith("application/json"))
    fail(415, "请发送 JSON。");
  if (Number(req.headers.get("content-length") || 0) > 65536)
    fail(413, "提交内容不能超过 64 KB。");
  const reader = req.body?.getReader();
  let size = 0,
    chunks = [];
  if (!reader) fail(400, "缺少提交内容。");
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 65536) {
      await reader.cancel();
      fail(413, "提交内容不能超过 64 KB。");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.length;
  }
  try {
    return object(JSON.parse(new TextDecoder().decode(bytes)), "提交内容");
  } catch (e) {
    if (e instanceof Fault) throw e;
    fail(400, "JSON 格式不正确。");
  }
}
async function ticket(db, actor, ticketId) {
  const t = await one(
    db,
    "SELECT * FROM tickets WHERE id=? AND owner=?",
    ticketId,
    actor.owner,
  );
  if (!t || (actor.project && t.project !== actor.project))
    fail(404, "找不到这个编号，或它不属于当前项目。");
  return parseTicket(t);
}
function packInfo(catalog, name, installed) {
  const p = catalog.packs.find((x) => x.name === name);
  if (!p) fail(409, `包 ${name} 未在当前版本发布。`);
  return {
    ...p,
    installed: installed[name] ?? null,
    action:
      installed[name] === p.version
        ? "up-to-date"
        : installed[name]
          ? "update"
          : "install",
  };
}
async function submit(db, actor, b, catalog) {
  const project = projectFor(actor, b.project);
  const key = string(b.client_request_id, "提交标识", 100);
  const kind = b.kind ?? "solution";
  if (!["solution", "feedback"].includes(kind)) fail(400, "未知提交类别。");
  const installed = object(b.installed ?? {}, "已装版本");
  for (const [n, v] of Object.entries(installed)) {
    string(n, "包名", 100);
    string(v, "版本", 100);
  }
  const digest = await hash(JSON.stringify(canonical(b)));
  const previous = await one(
    db,
    "SELECT digest,receipt FROM requests WHERE owner=? AND client_key=?",
    actor.owner,
    key,
  );
  if (previous) {
    if (previous.digest !== digest)
      fail(409, "提交标识已用于另一份内容。请使用新标识。");
    return { ...JSON.parse(previous.receipt), replayed: true };
  }
  const now = stamp(),
    rid = id("R"),
    tasks = [],
    results = [];
  if (kind === "solution") {
    if (
      !Array.isArray(b.types) ||
      !b.types.length ||
      b.types.length > 10 ||
      new Set(b.types).size !== b.types.length
    )
      fail(400, "请选择不重复的类型。");
    const answers = object(b.answers, "自查答案");
    for (const q of checklist.questions) string(answers[q.id], q.ask, 8000);
    for (const typeId of b.types) {
      const t = types.find((t) => t.id === typeId);
      if (!t) fail(400, `未知类型 ${typeId}，请从清单选择。`);
      const tid = id("T"),
        packs = t.packs.map((n) => packInfo(catalog, n, installed));
      const result = {
        type: t.id,
        name: t.name,
        status: t.status,
        ticket: tid,
        packs,
        materials: t.materials,
        read: t.read,
        note:
          t.status === "ready"
            ? "下载后仍需接入并验证；安装不表示加载或自动触发。"
            : "已登记，维护者尚未接受或发布。",
        skeleton: t.status === "ready" ? undefined : skeleton,
        settings:
          t.status === "ready"
            ? [
                {
                  what: "项目入口",
                  text: "把 .agents/rules/data-app-norms.AGENTS-snippet.md 的规则指针接到项目 AGENTS.md。按实际宿主接入；自动触发需要单独验证。",
                },
              ]
            : [],
      };
      results.push(result);
      tasks.push({
        tid,
        type: t.id,
        title: `${t.name} · ${String(answers.goal).slice(0, 120)}`,
        status: t.status === "ready" ? "ready" : "open",
        packs: packs.map((p) => p.name),
      });
    }
  } else {
    if (!["misfit", "validator", "want"].includes(b.category))
      fail(400, "请选择规范不合身、检查器问题或组件需求。");
    string(b.text, "反馈内容", 16000);
    if (b.where !== undefined && typeof b.where !== "string")
      fail(400, "发生位置应为文字。");
    tasks.push({
      tid: id("T"),
      type: b.category,
      title: b.text.slice(0, 120),
      status: "open",
      packs: [],
    });
  }
  const receipt = {
    request_id: rid,
    project,
    created: now,
    results,
    ...(kind === "feedback"
      ? { ticket: tasks[0].tid, note: "已登记，维护者会在处理后留下说明。" }
      : {}),
  };
  const ops = [
    statement(
      db,
      "INSERT INTO requests(id,owner,project,client_key,digest,receipt,created) VALUES(?,?,?,?,?,?,?)",
      rid,
      actor.owner,
      project,
      key,
      digest,
      JSON.stringify(receipt),
      now,
    ),
  ];
  for (const t of tasks) {
    ops.push(
      statement(
        db,
        "INSERT INTO tickets(id,owner,project,request_id,kind,type,title,status,body,packs,note,revision,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?,1,?,?)",
        t.tid,
        actor.owner,
        project,
        rid,
        kind,
        t.type,
        t.title,
        t.status,
        JSON.stringify(b),
        JSON.stringify(t.packs),
        "已登记",
        now,
        now,
      ),
    );
    ops.push(
      statement(
        db,
        "INSERT INTO events(id,ticket_id,actor,kind,payload,created) VALUES(?,?,?,?,?,?)",
        id("E"),
        t.tid,
        actor.actor,
        "created",
        JSON.stringify({ status: t.status, note: "收到提交并生成回执" }),
        now,
      ),
    );
  }
  try {
    await db.batch(ops);
  } catch (e) {
    const prev = await one(
      db,
      "SELECT digest,receipt FROM requests WHERE owner=? AND client_key=?",
      actor.owner,
      key,
    );
    if (prev) {
      if (prev.digest !== digest)
        fail(409, "提交标识已用于另一份内容。请使用新标识。");
      return { ...JSON.parse(prev.receipt), replayed: true };
    }
    throw e;
  }
  return receipt;
}
async function update(db, a, t, b, catalog) {
  const action = b.action;
  const next = b.status;
  if (action === "withdraw") {
    if (t.status === "closed") return { ticket: t, replayed: true };
  } else {
    maintain(a);
    if (action !== "transition") fail(400, "未知操作。");
  }
  const to = action === "withdraw" ? "closed" : next;
  if (!Object.hasOwn(statusNames, to)) fail(400, "未知状态。");
  if (!Number.isInteger(b.revision) || b.revision !== t.revision)
    fail(409, "记录已变化，请刷新后再处理。");
  const note = string(b.note, "处理说明", 4000);
  const packs = b.packs ?? t.packs;
  if (
    !Array.isArray(packs) ||
    packs.some((n) => typeof n !== "string") ||
    new Set(packs).size !== packs.length
  )
    fail(400, "关联包格式不正确。");
  for (const n of packs) packInfo(catalog, n, {});
  if (to === "ready" && !packs.length)
    fail(400, "标为有包可用时，必须关联已发布的包。");
  if (to === t.status && JSON.stringify(packs) === JSON.stringify(t.packs))
    fail(409, "状态没有变化。");
  const now = stamp(),
    eventId = id("E");
  // Insert the event while the old revision still matches; both statements are atomic.
  const result = await db.batch([
    statement(
      db,
      "INSERT INTO events(id,ticket_id,actor,kind,payload,created) SELECT ?,id,?,?,?,? FROM tickets WHERE id=? AND revision=?",
      eventId,
      a.actor,
      "transition",
      JSON.stringify({ from: t.status, status: to, note, packs }),
      now,
      t.id,
      t.revision,
    ),
    statement(
      db,
      "UPDATE tickets SET status=?,packs=?,note=?,revision=revision+1,updated=? WHERE id=? AND revision=?",
      to,
      JSON.stringify(packs),
      note,
      now,
      t.id,
      t.revision,
    ),
  ]);
  if (!result[1].meta.changes) fail(409, "另一处已修改记录，请刷新。");
  return {
    ticket: await ticket(db, a, t.id),
    event_id: eventId,
    note: "已保存处理结果，可在历史中查看并重新调整。",
  };
}
export async function api(req, env, catalog) {
  try {
    const u = new URL(req.url),
      path = u.pathname,
      method = req.method;
    if (!["GET", "POST"].includes(method)) fail(405, "不支持这个操作。");
    if (method === "POST") {
      const origin = req.headers.get("origin");
      if (
        (origin && origin !== u.origin) ||
        req.headers.get("sec-fetch-site") === "cross-site"
      )
        fail(403, "不接受跨站写入。");
    }
    if (path === "/v1/checklist" && method === "GET") return json(checklist);
    if (path === "/v1/packs" && method === "GET") return json(catalog);
    if (path === "/v1/health" && method === "GET") {
      await one(env.DB, "SELECT 1 AS ok");
      return json({ ok: true });
    }
    const a = await identity(req, env.DB),
      db = env.DB;
    if (path === "/v1/me" && method === "GET")
      return json({
        role: a.role,
        project: a.project ?? null,
        mode: env.CG_LOCAL ? "local" : "hosted",
      });
    if (path === "/v1/requests" && method === "POST")
      return json(await submit(db, a, await bodyOf(req), catalog), 201);
    if (path === "/v1/tickets" && method === "GET") {
      const conditions = ["owner=?"],
        args = [a.owner];
      const project = a.project || u.searchParams.get("project");
      if (project) {
        conditions.push("project=?");
        args.push(project);
      }
      const status = u.searchParams.get("status");
      if (status) {
        if (!Object.hasOwn(statusNames, status)) fail(400, "未知状态筛选。");
        conditions.push("status=?");
        args.push(status);
      }
      const q = (u.searchParams.get("q") || "").slice(0, 200);
      if (q) {
        conditions.push(
          "(instr(lower(title),lower(?))>0 OR instr(lower(id),lower(?))>0 OR instr(lower(project),lower(?))>0)",
        );
        args.push(q, q, q);
      }
      const offset = Number(u.searchParams.get("offset") || 0);
      if (!Number.isInteger(offset) || offset < 0)
        fail(400, "分页位置不正确。");
      const where = conditions.join(" AND ");
      const [items, total] = await Promise.all([
        all(
          db,
          `SELECT id,project,kind,type,title,status,note,revision,created,updated FROM tickets WHERE ${where} ORDER BY updated DESC,id LIMIT 50 OFFSET ?`,
          ...args,
          offset,
        ),
        one(
          db,
          `SELECT count(*) AS total FROM tickets WHERE ${where}`,
          ...args,
        ),
      ]);
      return json({ items, total: total.total, offset, limit: 50 });
    }
    const tm = path.match(/^\/v1\/tickets\/(T-[a-f0-9-]+)(?:\/(evidence))?$/);
    if (tm) {
      const t = await ticket(db, a, tm[1]);
      if (method === "GET" && !tm[2])
        return json({
          ...t,
          packs: t.packs.map((n) => packInfo(catalog, n, {})),
          events: (
            await all(
              db,
              "SELECT id,actor,kind,payload,created FROM events WHERE ticket_id=? ORDER BY rowid",
              t.id,
            )
          ).map((e) => ({ ...e, payload: JSON.parse(e.payload) })),
        });
      if (method === "POST") {
        const b = await bodyOf(req);
        if (tm[2]) {
          if (!Object.hasOwn(evidenceNames, b.stage))
            fail(400, "请选择有效的执行环节。");
          const detail = string(b.detail, "执行证据", 8000),
            eid = id("E");
          const now = stamp();
          await db.batch([
            statement(
              db,
              "INSERT INTO events(id,ticket_id,actor,kind,payload,created) VALUES(?,?,?,?,?,?)",
              eid,
              t.id,
              a.actor,
              "evidence",
              JSON.stringify({ stage: b.stage, detail, reported: true }),
              now,
            ),
            statement(db, "UPDATE tickets SET updated=? WHERE id=?", now, t.id),
          ]);
          return json(
            {
              event_id: eid,
              note: "执行记录已保存。这是提交者提供的证据，未由服务代跑检查。",
            },
            201,
          );
        }
        return json(await update(db, a, t, b, catalog));
      }
    }
    if (path === "/v1/tokens") {
      maintain(a);
      if (method === "GET")
        return json({
          items: await all(
            db,
            "SELECT id,project,created,revoked FROM tokens WHERE owner=? ORDER BY created DESC",
            a.owner,
          ),
        });
      const b = await bodyOf(req),
        project = projectFor(a, b.project),
        tid = id("K");
      const raw =
        "cg_" +
        crypto.randomUUID().replaceAll("-", "") +
        crypto.randomUUID().replaceAll("-", "");
      await statement(
        db,
        "INSERT INTO tokens(id,hash,owner,project,created,revoked) VALUES(?,?,?,?,?,0)",
        tid,
        await hash(raw),
        a.owner,
        project,
        stamp(),
      ).run();
      return json(
        {
          id: tid,
          project,
          token: raw,
          note: "只显示这一次。令牌只可提交和读取这个项目，不能处理维护状态。",
        },
        201,
      );
    }
    const km = path.match(/^\/v1\/tokens\/(K-[a-f0-9-]+)\/revoke$/);
    if (km && method === "POST") {
      maintain(a);
      await bodyOf(req);
      const k = await one(
        db,
        "SELECT id FROM tokens WHERE id=? AND owner=?",
        km[1],
        a.owner,
      );
      if (!k) fail(404, "令牌不存在。");
      await statement(
        db,
        "UPDATE tokens SET revoked=1 WHERE id=? AND owner=?",
        km[1],
        a.owner,
      ).run();
      return json({ note: "令牌已撤销。如需恢复使用，请为项目创建新令牌。" });
    }
    fail(404, "没有这个接口。");
  } catch (e) {
    if (!(e instanceof Fault)) console.error("CG request failed", e);
    return json(
      {
        error:
          e instanceof Fault
            ? e.message
            : "服务暂时无法完成，请保留输入后重试。",
      },
      e.status || 503,
    );
  }
}
