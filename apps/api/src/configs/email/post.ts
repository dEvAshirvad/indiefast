import { createBreaker } from "../../lib/circuit-breaker.js";
import { withTimeout } from "../../lib/with-timeout.js";
import { AppError } from "../errors/api-error.js";
import { coreErrors } from "../errors/core-errors.js";

type PostInput = {
  url: string;
  init: RequestInit;
};

export function createProviderPost(timeoutMs = 5_000) {
  const action = async ({ url, init }: PostInput) => {
    const response = await withTimeout(fetch(url, init), timeoutMs);
    if (!response.ok) {
      throw new AppError({
        code: coreErrors.EMAIL_SEND_FAILED.code,
        status: coreErrors.EMAIL_SEND_FAILED.status,
        message: `Email provider returned ${response.status}`,
      });
    }
  };
  const breaker = createBreaker(action, {
    timeout: timeoutMs + 100,
    volumeThreshold: 5,
  });
  return (url: string, init: RequestInit) => breaker.fire({ url, init });
}
