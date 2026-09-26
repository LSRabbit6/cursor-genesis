import http from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { openDatabase } from "./sqlite.mjs";
import { api } from "./api.mjs";
import { pathToFileURL } from "node:url";
await mkdir(".cg-menu", { recursive: true });
const db = openDatabase(process.env.CG_DB || ".cg-menu/workbench.sqlite");
const catalog = JSON.parse(await readFile("dist/client/catalog.json", "utf8"));
const worker = (
  await import(pathToFileURL(process.cwd() + "/dist/server/index.js"))
).default;
let port = Number(process.env.PORT || 4317);
const server = http.createServer(async (req, res) => {
  try {
    if (
      ![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host)
    ) {
      res.writeHead(403);
      res.end("Invalid host");
      return;
    }
    const ownOrigin = `http://${req.headers.host}`;
    if (
      (req.headers.origin && req.headers.origin !== ownOrigin) ||
      req.headers["sec-fetch-site"] === "cross-site"
    ) {
      res.writeHead(403);
      res.end("Cross-site request rejected");
      return;
    }
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (!k.startsWith("oai-authenticated-user-") && v)
        headers.set(k, Array.isArray(v) ? v.join(",") : v);
    }
    // Local identity is injected only for browser same-origin requests (CLI uses a project token).
    if (
      !headers.has("authorization") &&
      req.headers["sec-fetch-site"] === "same-origin"
    )
      headers.set("oai-authenticated-user-id", "local-owner");
    const chunks = [];
    let n = 0;
    for await (const c of req) {
      n += c.length;
      if (n > 65536) {
        res.writeHead(413);
        res.end("Too large");
        return;
      }
      chunks.push(c);
    }
    const request = new Request(ownOrigin + req.url, {
      method: req.method,
      headers,
      ...(!["GET", "HEAD"].includes(req.method)
        ? { body: Buffer.concat(chunks) }
        : {}),
    });
    const response = req.url.startsWith("/v1/")
      ? await api(request, { DB: db, CG_LOCAL: true }, catalog)
      : await worker.fetch(request, { DB: db, CG_LOCAL: true });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    console.error(e);
    res.writeHead(500);
    res.end("Server error");
  }
});
server.listen(port, "127.0.0.1", () => {
  port = server.address().port;
  console.log(`CG workbench: http://127.0.0.1:${port}`);
});
for (const s of ["SIGTERM", "SIGINT"])
  process.on(s, () =>
    server.close(() => {
      db.close();
      process.exit(0);
    }),
  );
