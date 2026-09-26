import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const requests = sqliteTable(
  "requests",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    project: text("project").notNull(),
    clientKey: text("client_key").notNull(),
    digest: text("digest").notNull(),
    receipt: text("receipt").notNull(),
    created: text("created").notNull(),
  },
  (t) => [uniqueIndex("requests_owner_key").on(t.owner, t.clientKey)],
);

export const tickets = sqliteTable(
  "tickets",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    project: text("project").notNull(),
    requestId: text("request_id")
      .notNull()
      .references(() => requests.id),
    kind: text("kind").notNull(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    status: text("status").notNull(),
    body: text("body").notNull(),
    packs: text("packs").notNull(),
    note: text("note").notNull(),
    revision: integer("revision").notNull().default(1),
    created: text("created").notNull(),
    updated: text("updated").notNull(),
  },
  (t) => [
    index("tickets_owner_project_updated").on(t.owner, t.project, t.updated),
    index("tickets_owner_status").on(t.owner, t.status),
  ],
);

export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => tickets.id),
    actor: text("actor").notNull(),
    kind: text("kind").notNull(),
    payload: text("payload").notNull(),
    created: text("created").notNull(),
  },
  (t) => [index("events_ticket_created").on(t.ticketId, t.created)],
);

export const tokens = sqliteTable(
  "tokens",
  {
    id: text("id").primaryKey(),
    hash: text("hash").notNull(),
    owner: text("owner").notNull(),
    project: text("project").notNull(),
    label: text("label").notNull().default("未命名客户端"),
    created: text("created").notNull(),
    revoked: integer("revoked").notNull().default(0),
  },
  (t) => [
    uniqueIndex("tokens_hash").on(t.hash),
    index("tokens_owner").on(t.owner),
  ],
);
