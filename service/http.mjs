import http from "node:http";
import { api } from "./api.mjs";

export function createWorkbenchServer({ db, catalog, worker, access, origin }) {
  const server = http.createServer(async (req, res) => {
    try {
      const canonical = origin || `http://127.0.0.1:${server.address().port}`;
      const allowedHost = new URL(canonical).host;
      const hosts = origin
        ? [allowedHost]
        : [allowedHost, `localhost:${server.address().port}`];
      if (
        !hosts.includes(req.headers.host) ||
        !req.url.startsWith("/") ||
        req.url.startsWith("//")
      ) {
        res.writeHead(403);
        res.end("Invalid host");
        return;
      }
      const ownOrigin = origin || `http://${req.headers.host}`;
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
        if (
          v &&
          !k.startsWith("oai-") &&
          !k.startsWith("x-cg-") &&
          !k.startsWith("x-forwarded-")
        )
          headers.set(k, Array.isArray(v) ? v.join(",") : v);
      }
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 65536) {
          res.writeHead(413);
          res.end("Too large");
          return;
        }
        chunks.push(chunk);
      }
      const request = new Request(ownOrigin + req.url, {
        method: req.method,
        headers,
        ...(!["GET", "HEAD"].includes(req.method)
          ? { body: Buffer.concat(chunks) }
          : {}),
      });
      const principal = access
        ? access.principal(request)
        : !headers.has("authorization") &&
            headers.get("sec-fetch-site") === "same-origin"
          ? { owner: "local-owner", role: "maintainer", actor: "browser" }
          : undefined;
      const env = { DB: db, CG_LOCAL: !access, CG_PRINCIPAL: principal };
      const path = new URL(request.url).pathname;
      const response =
        access && !principal && ["/", "/index.html"].includes(path)
          ? new Response(null, {
              status: 302,
              headers: { Location: "/login.html", "Cache-Control": "no-store" },
            })
          : path.startsWith("/auth/") && access
            ? await access.handle(request)
            : path.startsWith("/v1/")
              ? await api(request, env, catalog)
              : await worker.fetch(request, env);
      res.writeHead(response.status, {
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
        "X-Frame-Options": "DENY",
        ...Object.fromEntries(response.headers),
      });
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      console.error("CG server error", error.message);
      if (!res.headersSent) res.writeHead(500);
      res.end("Server error");
    }
  });
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  return server;
}
