import { expect, test } from "vitest";
import { createRedis } from "../configs/db/redis.js";
import { env } from "../configs/env.js";
import {
  readIdempotentResponse,
  storeIdempotentResponse,
} from "./idempotency.js";

test("stores a response and reads a miss as undefined", async () => {
  const redis = createRedis(env.redisHost, env.redisPort, env.redisPassword);
  const key = `test-${Date.now()}`;
  try {
    await redis.ping();
    await storeIdempotentResponse(
      redis.client,
      key,
      { status: 200, body: { message: "hi" } },
      60,
    );
    await expect(readIdempotentResponse(redis.client, key)).resolves.toEqual({
      status: 200,
      body: { message: "hi" },
    });
    await expect(
      readIdempotentResponse(redis.client, `${key}-missing`),
    ).resolves.toBeUndefined();
  } finally {
    await redis.client.del(`idem:${key}`);
    await redis.close();
  }
});
