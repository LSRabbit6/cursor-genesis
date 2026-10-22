import test from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { once } from "node:events";
const root = resolve(".");
const python = process.env.PYTHON || "python3";
async function server(db) {
  const child = spawn(process.execPath, ["service/local.mjs"], {
    cwd: root,
    env: { ...process.env, PORT: "0", CG_DB: db },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let errors = "";
  child.stderr.on("data", (v) => (errors += v));
  const url = await new Promise((ok, no) => {
    let text = "";
    const timer = setTimeout(() => {
      child.kill();
      no(Error("Server startup timed out: " + errors));
    }, 5000);
    child.once("exit", () => {
      clearTimeout(timer);
      no(Error(errors));
    });
    child.stdout.on("data", (v) => {
      text += v;
      const m = text.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (m) {
        clearTimeout(timer);
        ok(m[0]);
      }
    });
  });
  return {
    url,
    async stop() {
      child.kill();
      await once(child, "exit");
    },
  };
}
test("real HTTP + CLI: submit, install verified pack, record evidence, restart and query", async () => {
  const dir = mkdtempSync(join(tmpdir(), "cg-loop-"));
  let s;
  try {
    s = await server(join(dir, "state.sqlite"));
    const call = async (path, body) => {
      const response = await fetch(s.url + path, {
        headers: {
          "sec-fetch-site": "same-origin",
          "content-type": "application/json",
        },
        ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
      });
      assert.ok(response.ok, await response.clone().text());
      return response.json();
    };
    const key = await call("/v1/tokens", { project: "integration" });
    const c = await call("/v1/checklist");
    const answer = {
      project: "integration",
      types: ["data-app", "retail-multistore"],
      answers: Object.fromEntries(
        c.questions.map((q) => [q.id, "测试材料，不含真实业务资料"]),
      ),
    };
    const file = join(dir, "answers.json");
    writeFileSync(file, JSON.stringify(answer));
    const cli = (args) => {
      const r = spawnSync(python, [join(root, "scripts/menu.py"), ...args], {
        cwd: dir,
        env: {
          ...process.env,
          CG_MENU_URL: s.url,
          CG_MENU_TOKEN: key.token,
          CG_MENU_CONFIG: join(dir, "config"),
        },
        encoding: "utf8",
      });
      assert.equal(r.status, 0, r.stderr + r.stdout);
      return r.stdout;
    };
    const r = JSON.parse(cli(["submit", file]));
    assert.equal(r.results.length, 2);
    cli(["install", "delivery-data-app"]);
    assert.ok(
      existsSync(
        join(
          dir,
          ".agents/validators/data-app-norms-check/scripts/check_data_app_norms.py",
        ),
      ),
    );
    assert.match(cli(["packs"]), /delivery-data-app 0.1.0 · 最新/);
    cli([
      "evidence",
      r.results[0].ticket,
      "--stage",
      "installed",
      "--text",
      "从当前目录下载并安装，版本记录已生成",
    ]);
    assert.ok(
      JSON.parse(cli(["status", r.results[0].ticket])).events.some(
        (e) => e.kind === "evidence",
      ),
    );
    const wrong = await fetch(s.url + "/v1/tickets", {
      headers: { "oai-authenticated-user-id": "spoofed" },
    });
    assert.equal(wrong.status, 401);
    const badOrigin = await fetch(s.url + "/v1/tokens", {
      method: "POST",
      headers: {
        origin: "https://evil.example",
        "content-type": "application/json",
      },
      body: "{}",
    });
    assert.equal(badOrigin.status, 403);
    await s.stop();
    s = await server(join(dir, "state.sqlite"));
    assert.equal(
      JSON.parse(cli(["status", r.results[0].ticket])).id,
      r.results[0].ticket,
    );
  } finally {
    if (s) await s.stop();
    rmSync(dir, { recursive: true, force: true });
  }
});
