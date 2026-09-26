import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
export function openDatabase(path) {
  const raw = new DatabaseSync(path);
  raw.exec(
    "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;",
  );
  raw.exec(
    "CREATE TABLE IF NOT EXISTS _local_migrations(name TEXT PRIMARY KEY)",
  );
  for (const name of readdirSync(new URL("../drizzle/", import.meta.url))
    .filter((x) => x.endsWith(".sql"))
    .sort()) {
    if (raw.prepare("SELECT 1 FROM _local_migrations WHERE name=?").get(name))
      continue;
    raw.exec("BEGIN");
    try {
      raw.exec(
        readFileSync(new URL("../drizzle/" + name, import.meta.url), "utf8"),
      );
      raw.prepare("INSERT INTO _local_migrations VALUES(?)").run(name);
      raw.exec("COMMIT");
    } catch (e) {
      raw.exec("ROLLBACK");
      throw e;
    }
  }
  const db = {
    prepare(sql) {
      let args = [];
      const q = {
        bind(...v) {
          args = v;
          return q;
        },
        async first() {
          return raw.prepare(sql).get(...args) ?? null;
        },
        async all() {
          return { results: raw.prepare(sql).all(...args) };
        },
        execute() {
          return { meta: raw.prepare(sql).run(...args) };
        },
        async run() {
          return q.execute();
        },
      };
      return q;
    },
    async batch(ops) {
      raw.exec("BEGIN IMMEDIATE");
      try {
        const r = ops.map((op) => op.execute());
        raw.exec("COMMIT");
        return r;
      } catch (e) {
        raw.exec("ROLLBACK");
        throw e;
      }
    },
    close() {
      raw.close();
    },
  };
  return db;
}
