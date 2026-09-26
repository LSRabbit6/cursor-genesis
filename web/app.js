const $ = (s) => document.querySelector(s);
const state = {
  catalog: null,
  checklist: null,
  me: null,
  offset: 0,
  detail: null,
};
const statuses = {
  open: "待处理",
  accepted: "已接受",
  ready: "有包可用",
  resolved: "已处理",
  declined: "暂不做",
  closed: "已撤回",
};
const stages = {
  installed: "已安装",
  connected: "已接入",
  loaded: "已加载",
  triggered: "已触发",
  checked: "检查结果",
  accepted: "验收结果",
  delivered: "交付结果",
};
const safe = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
async function call(path, body) {
  const r = await fetch("/v1" + path, {
    headers: { "Content-Type": "application/json" },
    ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
  });
  let d;
  try {
    d = await r.json();
  } catch {
    throw Error("连接未完成，请先登录或稍后重试。");
  }
  if (!r.ok) {
    if (r.status === 401) $("#login-required").hidden = false;
    throw Error(d.error || "请求失败");
  }
  return d;
}
function notice(text, error = false) {
  $("#notice").textContent = text;
  $("#notice").className = "notice" + (error ? " error" : "");
  $("#notice").hidden = false;
}
function when(v) {
  return new Date(v).toLocaleString("zh-CN", { hour12: false });
}
async function init() {
  try {
    [state.checklist, state.catalog, state.me] = await Promise.all([
      call("/checklist"),
      call("/packs"),
      call("/me"),
    ]);
    $("#login-required").hidden = true;
    $("#logout").hidden = state.me.mode === "local";
    $("#connection-state").textContent =
      state.me.mode === "local" ? "本地服务已连接" : "独立 CG 服务已连接";
    $("#type-options").innerHTML = state.checklist.types
      .map(
        (t) =>
          `<label><input type="checkbox" name="types" value="${safe(t.id)}" ${t.id === "data-app" ? "checked" : ""}>${safe(t.name)}</label>`,
      )
      .join("");
    $("#questions").innerHTML = state.checklist.questions
      .map(
        (q) =>
          `<label>${safe(q.ask)}<textarea name="${safe(q.id)}" rows="2" required maxlength="8000" placeholder="有依据就填，找不到写给不出"></textarea></label>`,
      )
      .join("");
    $("#supply").innerHTML =
      state.catalog.packs
        .map(
          (p) =>
            `<article class="supply-row"><span class="badge">已发布 ${safe(p.version)}</span><h3>${safe(p.name)}</h3><p>${safe(p.description)}</p><a href="${safe(p.zip)}" download>下载发布包</a></article>`,
        )
        .join("") +
      `<p class="muted" style="margin-top:20px">零售、病理：只有骨架。企业交付：先读材料，暂不通过此入口安装。</p>`;
    await Promise.all([loadRecords(), loadTokens()]);
  } catch (e) {
    $("#connection-state").textContent = "连接未完成";
    notice(e.message, true);
    $("#ticket-list").innerHTML =
      '<p class="empty">暂时没有读到记录。请确认服务已启动或已登录，再点“刷新记录”。</p>';
  }
}
async function loadRecords() {
  const params = new URLSearchParams(new FormData($("#filters")));
  params.set("offset", state.offset);
  const d = await call("/tickets?" + params);
  $("#record-count").textContent = `${d.total} 条`;
  $("#updated-at").textContent =
    "更新于 " + new Date().toLocaleTimeString("zh-CN");
  $("#ticket-list").innerHTML = d.items.length
    ? d.items
        .map(
          (t) =>
            `<button type="button" class="ticket-row" data-ticket="${safe(t.id)}"><span><strong>${safe(t.title)}</strong><span class="ticket-meta">${safe(t.project)} · ${when(t.updated)}<br>${safe(t.id)}</span></span><span class="badge ${safe(t.status)}">${safe(statuses[t.status])}</span></button>`,
        )
        .join("")
    : '<p class="empty">当前没有匹配的记录。若设置了筛选，请清空后再查；还未提交时，从上面的客户端填写自查或反馈。</p>';
  $("#previous").disabled = state.offset === 0;
  $("#next").disabled = state.offset + 50 >= d.total;
  $("#page-info").textContent = d.total
    ? `${state.offset + 1}–${Math.min(state.offset + 50, d.total)} / ${d.total}`
    : "0 条";
  return d;
}
$("#refresh").onclick = () => init();
$("#filters").onsubmit = (e) => {
  e.preventDefault();
  state.offset = 0;
  loadRecords().catch((e) => notice(e.message, true));
};
$("#clear-filters").onclick = () => {
  $("#filters").reset();
  state.offset = 0;
  loadRecords().catch((e) => notice(e.message, true));
};
$("#previous").onclick = () => {
  state.offset = Math.max(0, state.offset - 50);
  loadRecords().catch((e) => notice(e.message, true));
};
$("#next").onclick = () => {
  state.offset += 50;
  loadRecords().catch((e) => notice(e.message, true));
};
init();

async function busy(form, work) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    await work();
  } catch (e) {
    notice(e.message, true);
  } finally {
    button.disabled = false;
  }
}
function requestKey(form, body) {
  const content = JSON.stringify(body);
  if (form.dataset.payload !== content) {
    form.dataset.payload = content;
    form.dataset.key = crypto.randomUUID();
  }
  return form.dataset.key;
}
function receiptLinks(r) {
  const tickets = r.results?.map((x) => x.ticket) || [r.ticket];
  const n = $("#notice");
  for (const t of tickets.filter(Boolean)) {
    const a = document.createElement("a");
    a.href = "#detail";
    a.textContent = "查看 " + t;
    a.onclick = (e) => {
      e.preventDefault();
      openTicket(t).catch((e) => notice(e.message, true));
    };
    n.append(a);
  }
}
$("#request-form").onsubmit = (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  busy(form, async () => {
    const f = new FormData(form),
      types = f.getAll("types");
    if (!types.length) throw Error("至少选一个类型。");
    const body = {
      kind: "solution",
      project: f.get("project").trim(),
      types,
      answers: Object.fromEntries(
        state.checklist.questions.map((q) => [q.id, f.get(q.id)]),
      ),
      installed: {},
    };
    body.client_request_id = requestKey(form, body);
    const r = await call("/requests", body);
    notice(
      `已收到自查。回执 ${r.request_id}${r.replayed ? "（本次为重试，沿用原回执）" : ""}`,
    );
    receiptLinks(r);
    for (const name of ["#feedback-form", "#token-form"])
      $(name).elements.project.value = body.project;
    await loadRecords();
    await openTicket(r.results[0].ticket, false);
  });
};
$("#feedback-form").onsubmit = (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  busy(form, async () => {
    const body = {
      kind: "feedback",
      ...Object.fromEntries(new FormData(form)),
      installed: {},
    };
    body.client_request_id = requestKey(form, body);
    const r = await call("/requests", body);
    notice(`反馈已登记：${r.ticket}`);
    receiptLinks(r);
    await loadRecords();
    await openTicket(r.ticket, false);
  });
};
$("#ticket-list").onclick = (e) => {
  const b = e.target.closest("[data-ticket]");
  if (b) openTicket(b.dataset.ticket).catch((e) => notice(e.message, true));
};
$("#close-detail").onclick = () => {
  $("#detail").hidden = true;
  state.detail = null;
};
async function openTicket(ticketId, scroll = true) {
  const t = await call("/tickets/" + encodeURIComponent(ticketId));
  state.detail = t;
  $("#detail").hidden = false;
  $("#detail-title").textContent = t.title;
  const answers = t.body.answers
    ? Object.entries(t.body.answers)
        .map(
          ([k, v]) =>
            `<div class="answer"><dt>${safe(state.checklist.questions.find((q) => q.id === k)?.ask || k)}</dt><dd>${safe(v)}</dd></div>`,
        )
        .join("")
    : `<div class="answer"><dt>发生位置</dt><dd>${safe(t.body.where || "未填写")}</dd></div><div class="answer"><dt>反馈内容</dt><dd>${safe(t.body.text)}</dd></div>`;
  const transitions = Object.entries(statuses)
    .map(
      ([v, n]) =>
        `<option value="${v}" ${v === t.status ? "selected" : ""}>${n}</option>`,
    )
    .join("");
  const packNames = new Set(t.packs.map((p) => p.name));
  $("#detail-content").innerHTML =
    `<p class="muted">${safe(t.project)} · ${safe(t.id)} · <span class="badge ${safe(t.status)}">${safe(statuses[t.status])}</span></p><div class="detail-grid"><div><h3>客户端 · 原始自查</h3><dl>${answers}</dl><h3>服务端 · 交付材料</h3>${t.packs.length ? t.packs.map((p) => `<p><a href="${safe(p.zip)}" download>${safe(p.name)} ${safe(p.version)}</a> <span class="muted">下载包</span></p>`).join("") : "<p>当前没有关联的成品包。先补齐材料、按通用骨架推进，再按编号查进展。</p><pre>" + safe("观测：根据权威数据记录事实。\n边界：默认只读，口径由负责人定。\n规范：先设计，再实施。\n比较器：保留原始数据、复算结果和差异。\n具体业务步骤：给不出，等待项目材料。") + "</pre>"}<p class="muted">在本地安装后，把规则指针接到项目入口；加载、自动触发与验收需要各自的证据。</p></div><div><h3>服务端 · 处理这条记录</h3>${state.me.role === "maintainer" ? `<form id="transition-form"><label>处理状态<select name="status">${transitions}</select></label><fieldset><legend>关联当前已发布的包</legend><div class="choices">${state.catalog.packs.map((p) => `<label><input type="checkbox" name="packs" value="${safe(p.name)}" ${packNames.has(p.name) ? "checked" : ""}>${safe(p.name)}</label>`).join("")}</div></fieldset><label>处理说明<textarea name="note" required rows="3" maxlength="4000" placeholder="为什么调整、下一步做什么"></textarea></label><button type="submit">保存处理结果</button></form>` : "<p>项目令牌可查看结果，处理操作由维护者完成。</p>"}<div class="divider"></div><h3>客户端 · 留下执行证据</h3><form id="evidence-form"><label>执行环节<select name="stage">${Object.entries(
      stages,
    )
      .map(([v, n]) => `<option value="${v}">${n}</option>`)
      .join(
        "",
      )}</select></label><label>结果与依据<textarea name="detail" required rows="3" maxlength="8000" placeholder="运行了什么、结果如何、证据在哪。失败也如实记录。"></textarea></label><button type="submit" class="secondary">保存执行记录</button></form>${t.status !== "closed" ? '<button type="button" id="withdraw" class="text-button">撤回这条需求</button>' : ""}</div></div><div class="divider"></div><h3>完整交接记录</h3><ol class="timeline">${t.events.map((e) => `<li><time>${when(e.created)}</time><p><strong>${e.kind === "created" ? "客户端提交 · 服务端回执" : e.kind === "evidence" ? "客户端记录 · " + safe(stages[e.payload.stage]) : "服务端处理 · " + safe(statuses[e.payload.status])}</strong></p><p>${safe(e.payload.note || e.payload.detail || "")}</p>${e.kind === "evidence" ? '<span class="muted">提交者记录，未由服务代跑或独立核实</span>' : ""}</li>`).join("")}</ol>`;
  const transition = $("#transition-form");
  if (transition)
    transition.onsubmit = (e) => {
      e.preventDefault();
      busy(transition, async () => {
        const f = new FormData(transition);
        const r = await call("/tickets/" + t.id, {
          action: "transition",
          status: f.get("status"),
          packs: f.getAll("packs"),
          note: f.get("note"),
          revision: t.revision,
        });
        notice(r.note);
        await Promise.all([loadRecords(), openTicket(t.id, false)]);
      });
    };
  const evidence = $("#evidence-form");
  evidence.onsubmit = (e) => {
    e.preventDefault();
    busy(evidence, async () => {
      const r = await call(
        "/tickets/" + t.id + "/evidence",
        Object.fromEntries(new FormData(evidence)),
      );
      notice(r.note);
      await Promise.all([loadRecords(), openTicket(t.id, false)]);
    });
  };
  const withdraw = $("#withdraw");
  if (withdraw)
    withdraw.onclick = async () => {
      try {
        const r = await call("/tickets/" + t.id, {
          action: "withdraw",
          revision: t.revision,
          note: "提交者撤回；维护者可重新打开。",
        });
        notice(r.note);
        await Promise.all([loadRecords(), openTicket(t.id, false)]);
      } catch (e) {
        notice(e.message, true);
      }
    };
  if (scroll)
    $("#detail").scrollIntoView({ behavior: "smooth", block: "start" });
  return { id: t.id, status: t.status, project: t.project };
}
async function loadTokens() {
  if (state.me.role !== "maintainer") {
    $("#connection").hidden = true;
    return;
  }
  const d = await call("/tokens");
  $("#token-list").innerHTML = d.items.length
    ? d.items
        .map(
          (t) =>
            `<div class="token-row"><span>${safe(t.project)} · ${safe(t.label || "未命名客户端")}<br><span class="muted">${safe(t.id)} · ${when(t.created)} · ${t.revoked ? "已撤销" : "可使用"}</span></span>${t.revoked ? "" : `<button type="button" class="text-button" data-revoke="${safe(t.id)}">撤销</button>`}</div>`,
        )
        .join("")
    : '<p class="muted">还没有项目令牌。需要本地客户端接入时，为指定项目创建一个。</p>';
}
$("#token-form").onsubmit = (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  busy(form, async () => {
    const r = await call("/tokens", Object.fromEntries(new FormData(form)));
    $("#token-value").textContent = r.token;
    $("#token-result").hidden = false;
    notice("令牌已创建，仅能访问 " + r.project + "。保存后可以隐藏。");
    await loadTokens();
  });
};
$("#hide-token").onclick = () => {
  $("#token-value").textContent = "";
  $("#token-result").hidden = true;
};
$("#copy-token").onclick = async () => {
  try {
    await navigator.clipboard.writeText($("#token-value").textContent);
    notice("令牌已复制。请保存在项目以外。");
  } catch {
    notice("浏览器未允许复制，请选中令牌手动复制。", true);
  }
};
$("#token-list").onclick = async (e) => {
  const b = e.target.closest("[data-revoke]");
  if (!b) return;
  try {
    b.disabled = true;
    const r = await call("/tokens/" + b.dataset.revoke + "/revoke", {});
    notice(r.note);
    await loadTokens();
  } catch (e) {
    b.disabled = false;
    notice(e.message, true);
  }
};

// Progressive enhancement: the same read and navigation actions for browser agents.
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  window.addEventListener("pagehide", () => lifecycle.abort(), { once: true });
  for (const tool of [
    {
      name: "list_cg_records",
      title: "查看协作记录",
      description: "按项目、状态和文字筛选记录，并更新页面列表；不写入数据。",
      inputSchema: {
        type: "object",
        properties: {
          project: { type: "string" },
          q: { type: "string" },
          status: { type: "string", enum: ["", ...Object.keys(statuses)] },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      async execute(input) {
        if (
          !input ||
          typeof input !== "object" ||
          Array.isArray(input) ||
          Object.entries(input).some(
            ([k, v]) =>
              !["project", "q", "status"].includes(k) || typeof v !== "string",
          ) ||
          (input.status && !Object.hasOwn(statuses, input.status))
        )
          throw Error("无效筛选。");
        for (const k of ["project", "q", "status"])
          $("#filters").elements[k].value = input[k] || "";
        state.offset = 0;
        return loadRecords();
      },
    },
    {
      name: "open_cg_record",
      title: "打开协作详情",
      description: "在页面中打开指定记录，查看回执和历史；不修改记录。",
      inputSchema: {
        type: "object",
        properties: { ticket: { type: "string" } },
        required: ["ticket"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      async execute(input) {
        if (
          !input ||
          Object.keys(input).length !== 1 ||
          typeof input.ticket !== "string" ||
          !/^T-[a-f0-9-]+$/.test(input.ticket)
        )
          throw Error("编号格式不正确。");
        return openTicket(input.ticket);
      },
    },
  ]) {
    try {
      Promise.resolve(
        document.modelContext.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {}
  }
}

$("#logout").onclick = async () => {
  try {
    const r = await fetch("/auth/logout", { method: "POST" });
    if (!r.ok) throw Error("退出未完成，请重试。");
    window.location.assign("/login.html");
  } catch (e) {
    notice(e.message, true);
  }
};
