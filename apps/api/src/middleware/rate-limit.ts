import { rateLimit, type Store } from "express-rate-limit";
import type { Redis } from "ioredis";
import { getRedis } from "../configs/db/redis.js";
import { AppError } from "../configs/errors/api-error.js";
import { coreErrors } from "../configs/errors/core-errors.js";
import {
  type RateLimitPolicy,
  rateLimitPolicy,
} from "../configs/rate-limit.js";

const incrementScript = `
local hits = redis.call("INCR", KEYS[1])
if hits == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return {hits, ttl}
`;

async function connectIfWaiting(client: Redis) {
  if (client.status === "wait") await client.connect();
}

export function createRedisRateLimitStore(
  client: Redis,
  windowMs: number,
): Store {
  const prefix = "rl:";
  const keyFor = (key: string) => `${prefix}${key}`;

  return {
    localKeys: false,
    prefix,
    async increment(key) {
      await connectIfWaiting(client);
      const result = (await client.eval(
        incrementScript,
        1,
        keyFor(key),
        String(windowMs),
      )) as [number, number];
      const ttl = Number(result[1]);
      return {
        totalHits: Number(result[0]),
        resetTime: new Date(Date.now() + Math.max(ttl, 0)),
      };
    },
    async decrement(key) {
      await connectIfWaiting(client);
      const hits = await client.decr(keyFor(key));
      if (hits < 0) await client.set(keyFor(key), "0", "KEEPTTL");
    },
    async resetKey(key) {
      await connectIfWaiting(client);
      await client.del(keyFor(key));
    },
  };
}

export function createRateLimiter(
  policy: RateLimitPolicy = rateLimitPolicy,
  store?: Store,
) {
  return rateLimit({
    windowMs: policy.windowMs,
    limit: policy.max,
    ...(store ? { store } : {}),
    standardHeaders: "draft-7",
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    skip: (req) => policy.skipPaths.includes(req.path),
    handler: (_req, _res, next) => {
      next(
        new AppError({
          code: coreErrors.RATE_LIMITED.code,
          status: coreErrors.RATE_LIMITED.status,
          message: coreErrors.RATE_LIMITED.message,
        }),
      );
    },
  });
}

export const rateLimiter = createRateLimiter(
  rateLimitPolicy,
  createRedisRateLimitStore(getRedis().client, rateLimitPolicy.windowMs),
);
