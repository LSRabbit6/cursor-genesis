import { mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { openDatabase } from "./sqlite.mjs";
import { createAccess } from "./access.mjs";
import { createWorkbenchServer } from "./http.mjs";

export async function start(standalone) {
  let access, origin;
  if (standalone) {
    if (!process.env.CG_ACCESS_FILE || !process.env.CG_ORIGIN)
      throw Error(
        "独立服务必须设置 CG_ACCESS_FILE 和 CG_ORIGIN。参见 docs/self-hosting.md。",
      );
    const url = new URL(process.env.CG_ORIGIN);
    if (
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      !(
        url.protocol === "https:" ||
        (url.protocol === "http:" &&
          ["127.0.0.1", "localhost"].includes(url.hostname))
      )
    )
      throw Error("CG_ORIGIN 必须是 HTTPS 根地址（本机回环调试可使用 HTTP）。");
    origin = url.origin;
    access = createAccess(
      JSON.parse(await readFile(process.env.CG_ACCESS_FILE, "utf8")),
    );
  }
  const path = process.env.CG_DB || ".cg-menu/workbench.sqlite";
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const db = openDatabase(path);
  const catalog = JSON.parse(
    await readFile("dist/client/catalog.json", "utf8"),
  );
  const worker = (
    await import(pathToFileURL(process.cwd() + "/dist/server/index.js"))
  ).default;
  const server = createWorkbenchServer({ db, catalog, worker, access, origin });
  const port = Number(process.env.PORT || 4317);
  if (!Number.isInteger(port) || port < 0 || port > 65535)
    throw Error("PORT 无效。");
  const host = standalone ? process.env.CG_HOST || "127.0.0.1" : "127.0.0.1";
  server.listen(port, host, () =>
    console.log(
      `CG workbench: ${origin || `http://127.0.0.1:${server.address().port}`}`,
    ),
  );
  for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, () =>
      server.close(() => {
        db.close();
        process.exit(0);
      }),
    );
}
