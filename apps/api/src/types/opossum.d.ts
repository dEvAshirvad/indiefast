declare module "opossum" {
  export default class CircuitBreaker<
    TArgs extends unknown[] = unknown[],
    TResult = unknown,
  > {
    constructor(
      action: (...args: TArgs) => Promise<TResult>,
      options?: {
        timeout?: number;
        errorThresholdPercentage?: number;
        resetTimeout?: number;
        volumeThreshold?: number;
      },
    );
    fire(...args: TArgs): Promise<TResult>;
  }
}
