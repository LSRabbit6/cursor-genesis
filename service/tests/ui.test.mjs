import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { webcrypto } from "node:crypto";
import { JSDOM } from "jsdom";
import { api } from "../api.mjs";
import { openDatabase } from "../sqlite.mjs";
const catalog = {
  packs: [
    {
      name: "delivery-data-app",
      version: "0.1.0",
      description: "规范与检查器",
      zip: "/downloads/delivery-data-app.zip",
      sha256: "a".repeat(64),
    },
  ],
};
async function settled(check) {
  for (let i = 0; i < 40; i++) {
    if (check()) return;
    await new Promise((ok) => setImmediate(ok));
  }
  assert.ok(check(), "UI did not finish expected operation");
}
test("forms, filters, detail, maintenance, evidence, XSS text handling and WebMCP contract", async () => {
  const dir = mkdtempSync(join(tmpdir(), "cg-ui-")),
    db = openDatabase(join(dir, "db.sqlite"));
  const dom = new JSDOM(
    readFileSync(new URL("../../web/index.html", import.meta.url), "utf8"),
    { url: "https://workbench.example/", runScripts: "outside-only" },
  );
  const w = dom.window,
    d = w.document,
    registered = new Map();
  let failSave = false;
  try {
    Object.defineProperty(w, "crypto", { value: webcrypto });
    w.HTMLElement.prototype.scrollIntoView = () => {};
    d.modelContext = {
      registerTool(tool) {
        registered.set(tool.name, tool);
      },
    };
    w.fetch = async (path, options = {}) => {
      if (failSave && options.method === "POST") throw Error("临时断线");
      return api(
        new Request("https://workbench.example" + path, {
          ...options,
          headers: {
            ...options.headers,
            "oai-authenticated-user-id": "ui-owner",
          },
        }),
        { DB: db },
        catalog,
      );
    };
    w.eval(readFileSync(new URL("../../web/app.js", import.meta.url), "utf8"));
    await settled(
      () =>
        d.querySelector("#connection-state").textContent === "在线服务已连接" &&
        d.querySelectorAll("#questions textarea").length === 6,
    );
    assert.match(d.querySelector("#ticket-list").textContent, /没有匹配/);
    const form = d.querySelector("#request-form");
    form.elements.project.value = "UI project";
    for (const input of form.querySelectorAll("textarea"))
      input.value = "给不出";
    form.elements.goal.value = "可验证的页面流程";
    form.querySelector('[value="retail-multistore"]').checked = true;
    failSave = true;
    form.dispatchEvent(new w.Event("submit", { cancelable: true }));
    await settled(() =>
      d.querySelector("#notice").textContent.includes("临时断线"),
    );
    assert.equal(form.elements.goal.value, "可验证的页面流程");
    failSave = false;
    form.dispatchEvent(new w.Event("submit", { cancelable: true }));
    await settled(
      () =>
        d.querySelectorAll(".ticket-row").length === 2 &&
        d.querySelector("#transition-form"),
    );
    assert.match(d.querySelector("#notice").textContent, /回执/);
    form.dispatchEvent(new w.Event("submit", { cancelable: true }));
    await settled(() =>
      d.querySelector("#notice").textContent.includes("沿用原回执"),
    );
    assert.equal(d.querySelectorAll(".ticket-row").length, 2);
    const transition = d.querySelector("#transition-form");
    transition.elements.status.value = "accepted";
    transition.elements.note.value = "维护者确认继续";
    transition.dispatchEvent(new w.Event("submit", { cancelable: true }));
    await settled(() =>
      d.querySelector(".timeline").textContent.includes("维护者确认继续"),
    );
    const evidence = d.querySelector("#evidence-form");
    evidence.elements.stage.value = "checked";
    evidence.elements.detail.value = "运行测试，退出码 0";
    evidence.dispatchEvent(new w.Event("submit", { cancelable: true }));
    await settled(() =>
      d.querySelector(".timeline").textContent.includes("运行测试，退出码 0"),
    );
    const feedback = d.querySelector("#feedback-form");
    feedback.elements.project.value = "UI project";
    feedback.elements.text.value = "<img src=x onerror=alert(1)> 作为原文";
    feedback.dispatchEvent(new w.Event("submit", { cancelable: true }));
    await settled(
      () =>
        d.querySelectorAll(".ticket-row").length === 3 &&
        d.querySelector("#detail-content").textContent.includes("作为原文"),
    );
    assert.equal(d.querySelector("#detail-content img"), null);
    assert.equal(registered.size, 2);
    const list = registered.get("list_cg_records");
    assert.equal(list.annotations.readOnlyHint, true);
    await list.execute({ q: "不存在" });
    assert.match(d.querySelector("#ticket-list").textContent, /没有匹配/);
    await assert.rejects(() => list.execute({ status: "imaginary" }));
    const result = await list.execute({ project: "UI project" });
    assert.equal(result.total, 3);
    const detail = await registered
      .get("open_cg_record")
      .execute({ ticket: result.items[0].id });
    assert.equal(detail.id, result.items[0].id);
    await assert.rejects(() =>
      registered.get("open_cg_record").execute({ ticket: "../../bad" }),
    );
  } finally {
    w.close();
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
