// D1 and the local adapter expose the same prepared-statement boundary.
export const one = (db, sql, ...args) =>
  db
    .prepare(sql)
    .bind(...args)
    .first();
export const all = async (db, sql, ...args) =>
  (
    await db
      .prepare(sql)
      .bind(...args)
      .all()
  ).results;
export const statement = (db, sql, ...args) => db.prepare(sql).bind(...args);
export const hash = async (text) =>
  [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
export const id = (prefix) => `${prefix}-${crypto.randomUUID()}`;
export const stamp = () => new Date().toISOString();
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  return value;
}
export class Fault extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const fail = (status, message) => {
  throw new Fault(status, message);
};
export function string(value, label, max = 4000) {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    fail(400, `${label}必须填写，且不超过 ${max} 字。`);
  return value.trim();
}
export function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail(400, `${label}应为对象。`);
  return value;
}
