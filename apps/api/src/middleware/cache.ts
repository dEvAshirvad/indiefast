import type { RequestHandler } from "express";
import { getRedis } from "../configs/db/redis.js";
import { readCache, writeCache } from "../lib/cache.js";

function successData(body: unknown): unknown | undefined {
  if (
    typeof body !== "object" ||
    body === null ||
    !("success" in body) ||
    body.success !== true ||
    !("data" in body)
  ) {
    return undefined;
  }
  return body.data;
}

export function cacheResponse(
  paths: readonly string[],
  ttlSeconds = 30,
): RequestHandler {
  const allowed = new Set(paths);

  return async (req, res, next) => {
    if (req.method !== "GET" || !allowed.has(req.path)) {
      next();
      return;
    }

    try {
      const hit = await readCache(getRedis().client, req.path);
      if (hit !== undefined) {
        res.ok(hit);
        return;
      }
    } catch {
      next();
      return;
    }

    const send = res.json.bind(res);
    res.json = ((body: unknown) => {
      const data = res.statusCode === 200 ? successData(body) : undefined;
      if (data === undefined) return send(body);
      writeCache(getRedis().client, req.path, data, ttlSeconds)
        .then(() => {
          send(body);
        })
        .catch(() => {
          send(body);
        });
      return res;
    }) as typeof res.json;
    next();
  };
}
