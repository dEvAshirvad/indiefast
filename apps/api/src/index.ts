import { getPostgres } from "./configs/db/postgres.js";
import { getRedis } from "./configs/db/redis.js";
import { env } from "./configs/env.js";
import { AppError } from "./configs/errors/api-error.js";
import { logger } from "./configs/logger/pino.js";
import { getEmailQueue } from "./configs/queues/bullmq.js";
import { createApp } from "./configs/server-config.js";
import { getStorage } from "./configs/storage/s3.js";
import { installShutdown } from "./lib/shutdown.js";

const app = createApp();

async function main() {
  await getPostgres().ping();
  logger.info("postgres ping ok");
  await getRedis().ping();
  logger.info("redis ping ok");
  await getEmailQueue().ready();
  logger.info({ queue: "email" }, "email queue ready");
  await getStorage().ensureBucket();
  logger.info({ bucket: env.s3Bucket }, "storage bucket ready");

  const server = app.listen(env.port, () => {
    logger.info(
      { port: env.port, url: `http://${env.appHost}:${env.port}` },
      "api listening",
    );
  });

  installShutdown(server, async () => {
    await getPostgres().close();
    await getRedis().close();
    await getEmailQueue().close();
    getStorage().destroy();
  });
}

main().catch((error: unknown) => {
  if (error instanceof AppError) {
    logger.error({ code: error.code, message: error.message }, "boot failed");
  } else {
    logger.error({ err: error }, "boot failed");
  }
  process.exit(1);
});
