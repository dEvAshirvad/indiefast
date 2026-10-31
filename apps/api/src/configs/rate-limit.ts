export const rateLimitPolicy = {
  windowMs: 60_000,
  max: 60,
  skipPaths: [
    "/health",
    "/",
    "/api/reference",
    "/api/openapi.json",
    "/metrics",
  ],
} as const;

export type RateLimitPolicy = {
  windowMs: number;
  max: number;
  skipPaths: readonly string[];
};
