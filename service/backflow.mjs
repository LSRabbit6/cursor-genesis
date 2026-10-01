import { all, statement, id, stamp, fail, string } from "./db.mjs";

export const fields = {
  problem: "解决什么",
  source: "来源与复现",
  boundary: "适用边界",
  proposal: "改进与使用方法",
  verification: "如何验证",
  limitations: "已知失败与限制",
};
export async function backflow(db, actor, ticket, body) {
  if (actor.role !== "maintainer")
    fail(403, "只有维护者可以整理和关联回流材料。");
  if (ticket.kind !== "feedback") fail(400, "请从反馈记录整理回流材料。");
  if (!body)
    return {
      items: (
        await all(
          db,
          "SELECT id,kind,payload,created FROM events WHERE ticket_id=? AND kind IN ('backflow','backflow_link') ORDER BY rowid",
          ticket.id,
        )
      ).map((e) => ({ ...e, payload: JSON.parse(e.payload) })),
    };
  const eventId = id("E"),
    created = stamp();
  if (body.action === "link") {
    const url = string(body.url, "PR 地址", 500);
    if (
      !/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/pull\/[1-9]\d*$/.test(
        url,
      )
    )
      fail(400, "请填写 GitHub PR 完整地址。");
    const existing = await all(
      db,
      "SELECT payload FROM events WHERE ticket_id=? AND kind='backflow'",
      ticket.id,
    );
    if (!existing.length) fail(409, "先整理导出回流材料，再关联 PR。");
    const links = await all(
      db,
      "SELECT id,payload FROM events WHERE ticket_id=? AND kind='backflow_link'",
      ticket.id,
    );
    const old = links.find((e) => JSON.parse(e.payload).url === url);
    if (old)
      return { event_id: old.id, note: "此 PR 已关联。", replayed: true };
    await statement(
      db,
      "INSERT INTO events(id,ticket_id,actor,kind,payload,created) VALUES(?,?,?,?,?,?)",
      eventId,
      ticket.id,
      actor.actor,
      "backflow_link",
      JSON.stringify({ url, note: "已关联回流 PR；合并与发布状态仍需核对。" }),
      created,
    ).run();
    return { event_id: eventId, note: "PR 已关联；关联不代表合并或发布。" };
  }
  if (body.action !== "export" || body.reviewed !== true)
    fail(400, "请审阅六项摘要并确认可公开后再导出。");
  const summary = {};
  for (const [key, label] of Object.entries(fields))
    summary[key] = string(body[key], label, 6000);
  const previous = await all(
    db,
    "SELECT id,payload FROM events WHERE ticket_id=? AND kind='backflow' ORDER BY rowid DESC",
    ticket.id,
  );
  const same = previous.find(
    (event) =>
      JSON.stringify(JSON.parse(event.payload).summary) ===
      JSON.stringify(summary),
  );
  if (same) {
    const { note, ...packet } = JSON.parse(same.payload);
    return {
      event_id: same.id,
      filename: `cg-backflow-${ticket.id}.json`,
      packet,
      replayed: true,
      note: "摘要未变化，沿用已保存的回流材料。",
    };
  }
  // Only deliberately authored public summaries enter the export, never source body/events.
  const packet = {
    version: 1,
    ticket: ticket.id,
    request: ticket.request_id,
    category: ticket.type,
    created,
    summary,
  };
  await statement(
    db,
    "INSERT INTO events(id,ticket_id,actor,kind,payload,created) VALUES(?,?,?,?,?,?)",
    eventId,
    ticket.id,
    actor.actor,
    "backflow",
    JSON.stringify({ ...packet, note: "已整理可公开摘要，等待仓库审核。" }),
    created,
  ).run();
  return {
    event_id: eventId,
    filename: `cg-backflow-${ticket.id}.json`,
    packet,
    note: "回流材料已生成。下载后导入候选目录；尚未提交 PR 或发布。",
  };
}
