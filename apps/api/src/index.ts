import cluster from "node:cluster";
import { availableParallelism } from "node:os";
import { env } from "./configs/env.js";
import { logger } from "./configs/logger/pino.js";
import { resolveWorkerCount } from "./lib/worker-count.js";

const workers = resolveWorkerCount(availableParallelism(), env.clusterWorkers);

async function bootWorker(): Promise<void> {
  const { failBoot, start } = await import("./main.js");
  try {
    await start();
  } catch (error) {
    failBoot(error);
  }
}

function forkWorkers(count: number): void {
  let shuttingDown = false;

  const stop = (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    const deadline = setTimeout(() => process.exit(1), 10_000);
    deadline.unref();
    for (const worker of Object.values(cluster.workers ?? {})) {
      worker?.process.kill(signal);
    }
  };

  process.once("SIGTERM", () => stop("SIGTERM"));
  process.once("SIGINT", () => stop("SIGINT"));

  cluster.on("exit", () => {
    const alive = Object.keys(cluster.workers ?? {}).length;
    if (shuttingDown) {
      if (alive === 0) process.exit(0);
      return;
    }
    cluster.fork();
  });

  for (let i = 0; i < count; i += 1) cluster.fork();
  logger.info({ workers: count }, "api cluster primary");
}

if (workers === 1 || !cluster.isPrimary) {
  void bootWorker();
} else {
  forkWorkers(workers);
}
