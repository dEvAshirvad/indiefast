function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    attempts: number;
    baseMs: number;
    sleep?: (ms: number) => Promise<void>;
  },
): Promise<T> {
  const sleep = options.sleep ?? defaultSleep;
  let last: unknown;

  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      if (attempt === options.attempts) break;
      await sleep(options.baseMs * 2 ** (attempt - 1));
    }
  }

  throw last;
}
