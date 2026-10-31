import { createBreaker } from "./circuit-breaker.js";
import { retry } from "./retry.js";
import { withTimeout } from "./with-timeout.js";

type HttpClientOptions = {
  timeoutMs?: number;
  attempts?: number;
  baseMs?: number;
  volumeThreshold?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
};

export function createHttpClient(options: HttpClientOptions = {}) {
  const timeoutMs = options.timeoutMs ?? 1_000;
  const attempts = options.attempts ?? 2;
  const baseMs = options.baseMs ?? 50;

  async function once(url: string): Promise<Response> {
    return withTimeout(fetch(url), timeoutMs);
  }

  const breaker = createBreaker(once, {
    timeout: timeoutMs + 100,
    errorThresholdPercentage: options.errorThresholdPercentage ?? 50,
    resetTimeout: options.resetTimeout ?? 30_000,
    volumeThreshold: options.volumeThreshold ?? 5,
  });

  return {
    get(url: string): Promise<Response> {
      return retry(() => breaker.fire(url), { attempts, baseMs });
    },
  };
}
