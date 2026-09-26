import { mkdir, rm, cp, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const root = new URL("../", import.meta.url);
process.chdir(root.pathname);
await rm("dist", { recursive: true, force: true });
await mkdir("dist/server", { recursive: true });
await mkdir("dist/client", { recursive: true });
const built = spawnSync(
  process.env.PYTHON || "python3",
  ["scripts/build-pack-catalog.py", "dist/client"],
  { stdio: "inherit" },
);
if (built.status !== 0) process.exit(built.status || 1);
await cp("web", "dist/client", { recursive: true });
let architecture = await readFile("docs/collaboration-map.html", "utf8");
architecture = architecture.replace(
  "<body>",
  '<body><p style="max-width:1120px;margin:16px auto;padding:0 24px"><a href="/">返回协作工作台</a> · 以下保留完整架构与旧菜单部署的历史观察。</p>',
);
architecture = architecture.replace(/href="([^"#][^"]*)"/g, (match, href) => {
  if (href.startsWith("/") || href.includes("://")) return match;
  const path = new URL(
    href,
    "https://github.com/LSRabbit6/cursor-genesis/blob/main/docs/",
  ).href;
  return `href="${path}"`;
});
await writeFile("dist/client/architecture.html", architecture);
await cp("docs/architecture.md", "dist/client/architecture.md");
await cp("scripts/menu.py", "dist/client/menu.py");
await cp("service", "dist/server/service", {
  recursive: true,
  filter: (p) =>
    !p.includes("/tests") &&
    !p.endsWith("local.mjs") &&
    !p.endsWith("sqlite.mjs"),
});
const files = [
  "index.html",
  "style.css",
  "app.js",
  "architecture.html",
  "architecture.md",
  "menu.py",
  "catalog.json",
];
const catalog = JSON.parse(await readFile("dist/client/catalog.json", "utf8"));
for (const p of catalog.packs) files.push(p.zip.slice(1));
const assets = {};
for (const path of files) {
  const data = await readFile("dist/client/" + path);
  assets["/" + path] = {
    body: data.toString("base64"),
    type: path.endsWith(".html")
      ? "text/html; charset=utf-8"
      : path.endsWith(".css")
        ? "text/css; charset=utf-8"
        : path.endsWith(".js")
          ? "text/javascript; charset=utf-8"
          : path.endsWith(".zip")
            ? "application/zip"
            : "text/plain; charset=utf-8",
  };
}
await writeFile(
  "dist/server/assets.mjs",
  `export default ${JSON.stringify(assets)};\n`,
);
await writeFile(
  "dist/server/catalog.mjs",
  `export default ${JSON.stringify(catalog)};\n`,
);
await cp("service/worker.mjs", "dist/server/index.js");
await mkdir("dist/.openai", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
await cp("drizzle", "dist/.openai/drizzle", { recursive: true });
console.log("Built CG workbench with validated packs and schema migrations.");
