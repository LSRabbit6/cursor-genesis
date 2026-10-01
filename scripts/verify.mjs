import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
process.chdir(fileURLToPath(new URL("../", import.meta.url)));
const python = process.env.PYTHON || "python3";
const base = process.env.CG_VERIFY_BASE;
const steps = [
  [process.execPath, ["scripts/build-workbench.mjs"]],
  [python, ["scripts/check-release.py", ...(base ? ["--base", base] : [])]],
  [
    process.execPath,
    [
      "--test",
      ...readdirSync("service/tests")
        .filter((n) => n.endsWith(".test.mjs"))
        .sort()
        .map((n) => "service/tests/" + n),
    ],
  ],
  [python, ["-m", "unittest", "discover", "-s", "scripts/tests", "-q"]],
  [
    python,
    [
      "-m",
      "unittest",
      "discover",
      "-s",
      "stable/packs/delivery-data-app/validators/data-app-norms-check/tests",
      "-q",
    ],
  ],
  [
    python,
    [
      "stable/packs/delivery-data-app/validators/data-app-norms-check/scripts/check_data_app_norms.py",
      "web/index.html",
      "web/login.html",
      "docs/collaboration-map.html",
    ],
  ],
];
const report = {
  commit: spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).stdout?.trim(),
  started: new Date().toISOString(),
  checks: [],
  ok: false,
};
const sql = readdirSync("drizzle")
  .filter((n) => n.endsWith(".sql"))
  .sort();
const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8"))
  .entries.map((e) => e.tag + ".sql")
  .sort();
if (JSON.stringify(sql) !== JSON.stringify(journal))
  throw Error("迁移 SQL 与登记不一致。");
for (const [program, args] of steps) {
  console.log("\n验证：" + args.join(" "));
  const result = spawnSync(program, args, { stdio: "inherit" });
  report.checks.push({
    command: args.join(" "),
    exit: result.status,
    error: result.error?.message,
  });
  if (result.status !== 0) break;
}
report.ok =
  report.checks.length === steps.length &&
  report.checks.every((c) => c.exit === 0);
report.finished = new Date().toISOString();
mkdirSync("dist", { recursive: true });
writeFileSync("dist/verification.json", JSON.stringify(report, null, 2) + "\n");
console.log(report.ok ? "\n统一验证全部通过。" : "\n验证失败，停止交付。");
process.exitCode = report.ok ? 0 : 1;
