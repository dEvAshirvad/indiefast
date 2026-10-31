import { expect, test } from "vitest";
import { createRedis } from "../db/redis.js";
import { env } from "../env.js";
import { createEmailQueue } from "./bullmq.js";

test("the email queue is ready, empty, and registered in Redis", async () => {
  const email = createEmailQueue(
    env.redisHost,
    env.redisPort,
    env.redisPassword,
  );
  const redis = createRedis(env.redisHost, env.redisPort, env.redisPassword);
  try {
    await email.ready();
    const counts = await email.queue.getJobCounts("waiting", "active");
    expect(counts.waiting).toBe(0);
    expect(counts.active).toBe(0);
    expect(await email.queue.getWorkers()).toEqual([]);
    await redis.ping();
    expect(await redis.client.exists("bull:email:meta")).toBe(1);
  } finally {
    await email.close();
    await redis.close();
  }
});

test("a refused connection is AppError DATASTORE_UNAVAILABLE", async () => {
  const email = createEmailQueue("127.0.0.1", 1, env.redisPassword);
  try {
    await expect(email.ready()).rejects.toMatchObject({
      name: "AppError",
      code: "DATASTORE_UNAVAILABLE",
      message: "Email queue is unavailable",
    });
  } finally {
    await email.close();
  }
});
