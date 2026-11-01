declare module "autocannon" {
  export interface Options {
    url: string;
    method?: string;
    path?: string;
    headers?: Record<string, string>;
    body?: string;
    connections?: number;
    amount?: number;
    duration?: number;
    pipelining?: number;
    timeout?: number;
    requests?: Array<{
      method?: string;
      path?: string;
      headers?: Record<string, string>;
      body?: string;
    }>;
  }

  export default function autocannon(
    options: Options,
    callback: (error: Error | null, result: unknown) => void,
  ): void;
}
