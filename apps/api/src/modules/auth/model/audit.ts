import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./core.js";

// App-owned table for audit events outside Better Auth core schema.
export const authAuditTrail = pgTable(
  "auth_audit_trail",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index("auth_audit_user_idx").on(table.userId),
    actionIdx: index("auth_audit_action_idx").on(table.action),
  }),
);
