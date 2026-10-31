import { env } from "./env.js";

export const allowedOrigins = [env.webUrl];

export function isAllowedOrigin(
  origin: string | undefined,
  allowlist: readonly string[] = allowedOrigins,
): boolean {
  if (origin === undefined) {
    return true;
  }

  return allowlist.includes(origin);
}
