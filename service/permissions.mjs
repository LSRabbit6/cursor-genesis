import { fail } from "./db.mjs";

export const clientScopes = ["read", "submit", "evidence", "withdraw"];
export function allow(actor, scope) {
  if (actor.role !== "maintainer" && !actor.scopes.includes(scope))
    fail(403, `此令牌没有 ${scope} 权限，请联系维护者调整。`);
}
export function scopesOf(value = clientScopes) {
  if (
    !Array.isArray(value) ||
    !value.length ||
    new Set(value).size !== value.length ||
    value.some((s) => !clientScopes.includes(s))
  )
    fail(400, "请选择不重复的有效操作范围。");
  return clientScopes.filter((s) => value.includes(s));
}
export function expiryOf(value) {
  if (value === undefined || value === null || value === "") return null;
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    Date.parse(value) <= Date.now()
  )
    fail(400, "到期时间应为带时区的未来时间；留空表示不过期。");
  return new Date(value).toISOString();
}
