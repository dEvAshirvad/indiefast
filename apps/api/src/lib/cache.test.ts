import { expect, test } from "vitest";
import { createRedis } from "../configs/db/redis.js";
import { env } from "../configs/env.js";
import { readCache, writeCache } from "./cache.js";

test("writes a value and reads a miss as undefined", async () => {
  const redis = createRedis(env.redisHost, env.redisPort, env.redisPassword);
  const key = `test-${Date.now()}`;
  try {
    await redis.ping();
    await writeCache(redis.client, key, "ok", 60);
    await expect(readCache(redis.client, key)).resolves.toBe("ok");
    await expect(
      readCache(redis.client, `${key}-missing`),
    ).resolves.toBeUndefined();
  } finally {
    await redis.client.del(`cache:${key}`);
    await redis.close();
  }
});
