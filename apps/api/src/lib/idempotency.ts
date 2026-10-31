import type { Redis } from "ioredis";
import { AppError } from "../configs/errors/api-error.js";
import { coreErrors } from "../configs/errors/core-errors.js";

export type StoredResponse = {
  status: number;
  body: unknown;
};

function redisKey(key: string) {
  return `idem:${key}`;
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

export async function readIdempotentResponse(
  client: Redis,
  key: string,
): Promise<StoredResponse | undefined> {
  try {
    await connectIfWaiting(client);
    const raw = await client.get(redisKey(key));
    if (raw === null) return undefined;
    return JSON.parse(raw) as StoredResponse;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw unavailable();
  }
}

export async function storeIdempotentResponse(
  client: Redis,
  key: string,
  stored: StoredResponse,
  ttlSeconds: number,
): Promise<void> {
  try {
    await connectIfWaiting(client);
    await client.set(redisKey(key), JSON.stringify(stored), "EX", ttlSeconds);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw unavailable();
  }
}
