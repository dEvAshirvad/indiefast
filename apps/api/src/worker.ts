import { Worker } from "bullmq";
import { env } from "./configs/env.js";
import { logger } from "./configs/logger/pino.js";
import {
  emailQueueName,
  emailWorkerConnection,
} from "./configs/queues/bullmq.js";
import { deliverEmail } from "./modules/email/deliver.js";

// ponytail: at-least-once. A crash after SMTP accepts the message and before
// the job is acked can deliver twice. The verify token still works once.
// Upgrade path: pass the BullMQ job id as the provider idempotency key.

const worker = new Worker(
  emailQueueName,
  async (job) => {
    await deliverEmail(job.data);
  },
  {
    connection: emailWorkerConnection(
      env.redisHost,
      env.redisPort,
      env.redisPassword,
    ),
  },
);

worker.on("failed", (job, error) => {
  logger.error({ jobId: job?.id, err: error }, "email job failed");
});

async function shutdown() {
  await worker.close();
  process.exit(0);
}

process.on("SIGTERM", () => {
  shutdown().catch((error: unknown) => {
    logger.error({ err: error }, "email worker shutdown failed");
    process.exit(1);
  });
});

process.on("SIGINT", () => {
  shutdown().catch((error: unknown) => {
    logger.error({ err: error }, "email worker shutdown failed");
    process.exit(1);
  });
});

logger.info({ queue: emailQueueName }, "email worker listening");
