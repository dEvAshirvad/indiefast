import type { Redis } from "ioredis";
import { AppError } from "../configs/errors/api-error.js";
import { coreErrors } from "../configs/errors/core-errors.js";

function redisKey(key: string) {
  return `cache:${key}`;
}

function unavailable(): AppError {
  return new AppError({
    code: coreErrors.DATASTORE_UNAVAILABLE.code,
    status: coreErrors.DATASTORE_UNAVAILABLE.status,
    message: "Redis is unavailable",
  });
}

async function connectIfWaiting(client: Redis) {
  if (client.status === "wait") await client.connect();
}

export async function readCache(
  client: Redis,
  key: string,
): Promise<unknown | undefined> {
  try {
    await connectIfWaiting(client);
    const raw = await client.get(redisKey(key));
    if (raw === null) return undefined;
    return JSON.parse(raw) as unknown;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw unavailable();
  }
}

export async function writeCache(
  client: Redis,
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  try {
    await connectIfWaiting(client);
    await client.set(redisKey(key), JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw unavailable();
  }
}
