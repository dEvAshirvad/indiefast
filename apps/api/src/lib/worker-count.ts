export function resolveWorkerCount(
  cpus: number,
  raw: string | undefined,
): number {
  if (raw !== undefined) {
    const count = Number(raw);
    if (!Number.isInteger(count) || count < 1) {
      throw new Error("CLUSTER_WORKERS must be an integer >= 1");
    }
    return count;
  }
  if (cpus <= 1) return 1;
  return Math.max(4, cpus);
}
