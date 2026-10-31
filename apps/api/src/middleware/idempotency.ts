import type { RequestHandler } from "express";
import { getRedis } from "../configs/db/redis.js";
import {
  readIdempotentResponse,
  storeIdempotentResponse,
} from "../lib/idempotency.js";

// ponytail: no in-flight lock. Two overlapping requests can both miss.
// Upgrade is SET NX plus wait. The tests are sequential.
export function idempotency(ttlSeconds = 86_400): RequestHandler {
  return async (req, res, next) => {
    const key = req.get("Idempotency-Key");
    if (!key) {
      next();
      return;
    }

    try {
      const stored = await readIdempotentResponse(getRedis().client, key);
      if (stored) {
        res.status(stored.status).json(stored.body);
        return;
      }

      const send = res.json.bind(res);
      res.json = ((body: unknown) => {
        storeIdempotentResponse(
          getRedis().client,
          key,
          { status: res.statusCode, body },
          ttlSeconds,
        )
          .then(() => {
            send(body);
          })
          .catch(next);
        return res;
      }) as typeof res.json;
      next();
    } catch (error) {
      next(error);
    }
  };
}
