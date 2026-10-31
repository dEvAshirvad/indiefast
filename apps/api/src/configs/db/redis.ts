import { Redis } from "ioredis";
import { env } from "../env.js";
import { AppError } from "../errors/api-error.js";
import { coreErrors } from "../errors/core-errors.js";
import { logger } from "../logger/pino.js";

export function createRedis(host: string, port: number, password: string) {
  const client = new Redis({
    host,
    port,
    password,
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      return Math.min(times * 100, 2000);
    },
    lazyConnect: true,
    keepAlive: 30000,
    // Fail fast when Redis is unavailable to avoid request pileups.
    enableOfflineQueue: false,
    enableReadyCheck: true,
    connectTimeout: 10000,
  });
  client.on("error", (error: Error) => {
    logger.error({ err: error }, "redis client error");
  });

  return {
    client,
    async ping() {
      try {
        if (client.status === "wait") await client.connect();
        const reply = await client.ping();
        if (reply !== "PONG") throw new Error(reply);
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError({
          code: coreErrors.DATASTORE_UNAVAILABLE.code,
          status: coreErrors.DATASTORE_UNAVAILABLE.status,
          message: "Redis is unavailable",
        });
      }
    },
    async close() {
      client.disconnect();
    },
  };
}

let singleton: ReturnType<typeof createRedis> | undefined;

export function getRedis() {
  singleton ??= createRedis(
    env.redisHost,
    env.redisPort as number,
    env.redisPassword,
  );
  return singleton;
}
