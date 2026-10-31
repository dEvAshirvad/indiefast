import { expect, test } from "vitest";
import { env } from "../env.js";
import { createRedis } from "./redis.js";

test("ping answers PONG", async () => {
  const redis = createRedis(env.redisHost, env.redisPort, env.redisPassword);
  try {
    await redis.ping();
  } finally {
    await redis.close();
  }
});

test("a refused connection is AppError DATASTORE_UNAVAILABLE", async () => {
  const redis = createRedis("127.0.0.1", 1, env.redisPassword);
  try {
    await expect(redis.ping()).rejects.toMatchObject({
      name: "AppError",
      code: "DATASTORE_UNAVAILABLE",
      message: "Redis is unavailable",
    });
  } finally {
    await redis.close();
  }
});
