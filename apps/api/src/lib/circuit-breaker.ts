import CircuitBreaker from "opossum";

type BreakerOptions = {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  volumeThreshold?: number;
};

export function createBreaker<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options?: BreakerOptions,
) {
  return new CircuitBreaker(action, {
    timeout: options?.timeout ?? 10_000,
    errorThresholdPercentage: options?.errorThresholdPercentage ?? 50,
    resetTimeout: options?.resetTimeout ?? 30_000,
    volumeThreshold: options?.volumeThreshold ?? 5,
  });
}
