import type { Server } from "node:http";

const defaultTimeoutMs = 10_000;
const shuttingDown = new WeakSet<Server>();

export async function beginShutdown(
  server: Server,
  closeResources: () => Promise<void>,
  options?: { timeoutMs?: number; exit?: (code: number) => void },
): Promise<void> {
  if (shuttingDown.has(server)) return;
  shuttingDown.add(server);

  const timeoutMs = options?.timeoutMs ?? defaultTimeoutMs;
  const exit = options?.exit ?? process.exit;
  let timedOut = false;

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      timedOut = true;
      exit(1);
      resolve();
    }, timeoutMs);
    timer.unref();

    server.close((error) => {
      clearTimeout(timer);
      if (timedOut) return;
      if (error) reject(error);
      else resolve();
    });
    server.closeIdleConnections();
  });

  if (timedOut) return;
  await closeResources();
}

export function installShutdown(
  server: Server,
  closeResources: () => Promise<void>,
): void {
  process.once("SIGTERM", () => {
    void beginShutdown(server, closeResources)
      .then(() => {
        process.exit(0);
      })
      .catch(() => {
        process.exit(1);
      });
  });
}
