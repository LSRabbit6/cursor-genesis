import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const digest = (value) =>
  createHash("sha256").update(value).digest("hex");
const lifetime = 8 * 60 * 60 * 1000;
const cookieName = "cg_session";
const json = (value, status = 200, headers = {}) =>
  new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });

// One CG-owned maintenance space; harness identities are separate project tokens.
export function createAccess(config, now = Date.now) {
  if (
    config.version !== 1 ||
    typeof config.owner !== "string" ||
    !config.owner.trim() ||
    config.owner.length > 120 ||
    !/^[a-f0-9]{64}$/.test(config.key_hash)
  )
    throw Error("CG 访问配置无效。请运行 scripts/init-access.mjs 创建配置。");
  const sessions = new Map();
  let failures = 0,
    retryAt = 0;
  const key = (request) => {
    const raw = request.headers
      .get("cookie")
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith(cookieName + "="))
      ?.slice(cookieName.length + 1);
    return raw && /^[A-Za-z0-9_-]{43}$/.test(raw) ? digest(raw) : null;
  };
  const cookie = (request, value, age) =>
    `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
  const prune = () => {
    for (const [k, expires] of sessions)
      if (expires <= now()) sessions.delete(k);
  };
  return {
    principal(request) {
      prune();
      return sessions.has(key(request))
        ? { owner: config.owner, role: "maintainer", actor: "browser" }
        : undefined;
    },
    async handle(request) {
      const path = new URL(request.url).pathname;
      if (request.method !== "POST")
        return json({ error: "请使用登录表单。" }, 405);
      if (request.headers.get("origin") !== new URL(request.url).origin)
        return json({ error: "不接受跨站登录或退出。" }, 403);
      if (path === "/auth/logout") {
        sessions.delete(key(request));
        return json({ note: "已退出 CG。" }, 200, {
          "Set-Cookie": cookie(request, "", 0),
        });
      }
      if (path !== "/auth/login") return json({ error: "没有这个接口。" }, 404);
      if (!request.headers.get("content-type")?.startsWith("application/json"))
        return json({ error: "请使用登录表单。" }, 415);
      if (now() >= retryAt) {
        failures = 0;
        retryAt = now() + 60_000;
      }
      if (failures >= 10)
        return json({ error: "尝试次数过多，请一分钟后重试。" }, 429, {
          "Retry-After": "60",
        });
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "登录内容格式不正确。" }, 400);
      }
      const raw = body?.key;
      if (
        typeof raw !== "string" ||
        raw.length > 256 ||
        !timingSafeEqual(
          Buffer.from(digest(raw || ""), "hex"),
          Buffer.from(config.key_hash, "hex"),
        )
      ) {
        failures++;
        return json({ error: "管理密钥不正确。请使用此 CG 服务的密钥。" }, 401);
      }
      failures = 0;
      prune();
      if (sessions.size >= 100) sessions.delete(sessions.keys().next().value);
      sessions.delete(key(request));
      const session = randomBytes(32).toString("base64url");
      sessions.set(digest(session), now() + lifetime);
      return json({ note: "登录成功。" }, 200, {
        "Set-Cookie": cookie(request, session, lifetime / 1000),
      });
    },
  };
}
