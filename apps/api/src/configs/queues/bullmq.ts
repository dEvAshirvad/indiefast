import { Queue } from "bullmq";
import { withTimeout } from "../../lib/with-timeout.js";
import { env } from "../env.js";
import { AppError } from "../errors/api-error.js";
import { coreErrors } from "../errors/core-errors.js";

export const emailQueueName = "email";

export const emailJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 1_000 },
  removeOnComplete: 100,
  removeOnFail: 100,
};

export function emailWorkerConnection(
  host: string,
  port: number,
  password: string,
) {
  return {
    host,
    port,
    password,
    maxRetriesPerRequest: null as null,
  };
}

export function createEmailQueue(host: string, port: number, password: string) {
  const queue = new Queue(emailQueueName, {
    connection: {
      host,
      port,
      password,
      maxRetriesPerRequest: null,
      connectTimeout: 1_000,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    },
    defaultJobOptions: emailJobOptions,
  });
  queue.on("error", () => undefined);

  return {
    queue,
    async ready() {
      try {
        await withTimeout(queue.waitUntilReady(), 2_000);
        await withTimeout(queue.getVersion(), 2_000);
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError({
          code: coreErrors.DATASTORE_UNAVAILABLE.code,
          status: coreErrors.DATASTORE_UNAVAILABLE.status,
          message: "Email queue is unavailable",
        });
      }
    },
    async close() {
      await queue.close();
    },
  };
}

let singleton: ReturnType<typeof createEmailQueue> | undefined;

export function getEmailQueue() {
  singleton ??= createEmailQueue(
    env.redisHost,
    env.redisPort,
    env.redisPassword,
  );
  return singleton;
}
