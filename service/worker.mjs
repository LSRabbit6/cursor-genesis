import { api } from "./service/api.mjs";
import assets from "./assets.mjs";
import catalog from "./catalog.mjs";
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/v1/")) return api(request, env, catalog);
    if (request.method !== "GET" && request.method !== "HEAD")
      return new Response("Method not allowed", { status: 405 });
    const asset = assets[path === "/" ? "/index.html" : path];
    if (!asset) return new Response("Not found", { status: 404 });
    const bytes = Uint8Array.from(atob(asset.body), (c) => c.charCodeAt(0));
    return new Response(request.method === "HEAD" ? null : bytes, {
      headers: {
        "Content-Type": asset.type,
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
        "Content-Security-Policy":
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'",
      },
    });
  },
};
