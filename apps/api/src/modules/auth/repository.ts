import { getPostgres } from "../../configs/db/postgres.js";
import { authAuditTrail } from "./model/audit.js";

export const authRepository = {
  async writeAuditEvent(input: {
    userId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }) {
    await getPostgres()
      .db.insert(authAuditTrail)
      .values({
        id: crypto.randomUUID(),
        userId: input.userId,
        action: input.action,
        metadata: input.metadata ?? null,
      });
  },
};
