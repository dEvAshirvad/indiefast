import { eq } from "drizzle-orm";
import { getPostgres } from "../src/configs/db/postgres.js";
import { getRedis } from "../src/configs/db/redis.js";
import { env } from "../src/configs/env.js";
import { logger } from "../src/configs/logger/pino.js";
import { getEmailQueue } from "../src/configs/queues/bullmq.js";
import { auth } from "../src/lib/auth.js";
import { user } from "../src/modules/auth/model/core.js";

const postgres = getPostgres();

try {
  const existing = await postgres.db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, env.adminEmail))
    .limit(1);

  if (existing.length === 0) {
    await auth.api.signUpEmail({
      body: {
        email: env.adminEmail,
        password: env.adminPassword,
        name: "Admin",
      },
    });
  }

  await postgres.db
    .update(user)
    .set({ role: "admin" })
    .where(eq(user.email, env.adminEmail));
  logger.info({ email: env.adminEmail }, "admin ready");
} finally {
  await getEmailQueue().close();
  await getRedis().close();
  await postgres.close();
}
