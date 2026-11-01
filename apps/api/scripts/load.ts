import { type ChildProcess, execSync, spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { availableParallelism } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import autocannon from "autocannon";
import { Redis } from "ioredis";
import pg from "pg";
import { env } from "../src/configs/env.js";
import { logger } from "../src/configs/logger/pino.js";
import { resolveWorkerCount } from "../src/lib/worker-count.js";

const apiDir = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
const rawDir = path.join(repoRoot, "docs/engineering/load-report/raw");
const base = `http://127.0.0.1:${env.port}`;

type CannonResult = {
  latency: { p50: number; p99: number };
  requests: { average: number; total: number };
  errors: number;
  timeouts: number;
  non2xx: number;
  statusCodeStats: Record<string, { count: number }>;
};

type Shot = {
  p50: number;
  p99: number;
  requestsPerSec: number;
  total: number;
  errors: number;
  timeouts: number;
  non2xx: number;
  status: Record<string, number>;
};

type ModeReport = {
  workers: number;
  echo: Record<"10" | "25" | "50", Shot>;
  email: { shot: Shot; accepted: number; mailhog: number; drainMs: number };
  limiter: Shot;
  pool: { shot: Shot; rows: number };
  stampede: { shot: Shot; rows: number };
  health: Shot;
  shutdown?: { drainMs: number; exitCode: number; shot: Shot };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shotOf(result: CannonResult): Shot {
  const status: Record<string, number> = {};
  for (const [code, row] of Object.entries(result.statusCodeStats ?? {})) {
    status[code] = row.count;
  }
  return {
    p50: result.latency.p50,
    p99: result.latency.p99,
    requestsPerSec: result.requests.average,
    total: result.requests.total,
    errors: result.errors,
    timeouts: result.timeouts,
    non2xx: result.non2xx,
    status,
  };
}

function fire(
  options: Parameters<typeof autocannon>[0],
): Promise<CannonResult> {
  return new Promise((resolve, reject) => {
    autocannon(options, (error, result) => {
      if (error) reject(error);
      else resolve(result as CannonResult);
    });
  });
}

type Tracked = { child: ChildProcess; logs: () => string };

function startProcess(script: string, clusterWorkers?: string): Tracked {
  // The child has to see CLUSTER_WORKERS. The rest of the environment is the repo .env already loaded.
  // biome-ignore lint/style/noProcessEnv: spawn env is a copy plus one override
  const childEnv = { ...process.env };
  if (clusterWorkers === undefined) delete childEnv.CLUSTER_WORKERS;
  else childEnv.CLUSTER_WORKERS = clusterWorkers;
  const child = spawn(process.execPath, ["--import", "tsx", script], {
    cwd: apiDir,
    env: childEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  const take = (chunk: Buffer) => {
    logs += chunk.toString();
    if (logs.length > 20_000) logs = logs.slice(-20_000);
  };
  child.stdout?.on("data", take);
  child.stderr?.on("data", take);
  return { child, logs: () => logs };
}

async function portAnswers(): Promise<boolean> {
  try {
    const response = await fetch(`${base}/health`, {
      signal: AbortSignal.timeout(400),
    });
    return response.status > 0;
  } catch {
    return false;
  }
}

async function waitForHealth(tracked: Tracked): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (tracked.child.exitCode !== null) {
      throw new Error(
        `api exited ${tracked.child.exitCode}\n${tracked.logs()}`,
      );
    }
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) return;
    } catch {
      // boot still in progress
    }
    await sleep(200);
  }
  throw new Error(`health timeout\n${tracked.logs()}`);
}

function stopChild(child: ChildProcess): Promise<number> {
  return new Promise((resolve) => {
    if (child.exitCode !== null) {
      resolve(child.exitCode);
      return;
    }
    const timer = setTimeout(() => child.kill("SIGKILL"), 12_000);
    child.once("exit", (code) => {
      clearTimeout(timer);
      resolve(code ?? 1);
    });
    child.kill("SIGTERM");
  });
}

async function waitUntilDown(): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (!(await portAnswers())) return;
    await sleep(200);
  }
  throw new Error("API port stayed open after stop");
}

async function clearIdem(redis: Redis, keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await redis.del(...keys.map((key) => `idem:${key}`));
}

async function flushRateLimit(redis: Redis): Promise<void> {
  let cursor = "0";
  do {
    const [next, keys] = await redis.scan(
      cursor,
      "MATCH",
      "rl:*",
      "COUNT",
      200,
    );
    cursor = next;
    if (keys.length > 0) await redis.del(...keys);
  } while (cursor !== "0");
}

async function signIn(): Promise<string> {
  const response = await fetch(`${base}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: env.webUrl,
    },
    body: JSON.stringify({
      email: env.adminEmail,
      password: env.adminPassword,
    }),
  });
  if (!response.ok) {
    throw new Error(`sign-in ${response.status} ${await response.text()}`);
  }
  const cookies = response.headers.getSetCookie();
  if (cookies.length === 0) throw new Error("sign-in set no cookie");
  return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

function seedAdmin(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "scripts/seed-admin.ts"],
      { cwd: apiDir, stdio: "inherit" },
    );
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`seed exited ${code}`));
    });
  });
}

async function mailhogTotal(): Promise<number> {
  const response = await fetch("http://127.0.0.1:8025/api/v2/messages");
  const body = (await response.json()) as { total: number };
  return body.total;
}

async function clearMailhog(): Promise<void> {
  await fetch("http://127.0.0.1:8025/api/v1/messages", { method: "DELETE" });
}

async function waitForMail(target: number): Promise<{
  total: number;
  drainMs: number;
}> {
  const started = Date.now();
  while (Date.now() - started < 60_000) {
    const total = await mailhogTotal();
    if (total >= target) return { total, drainMs: Date.now() - started };
    await sleep(250);
  }
  return { total: await mailhogTotal(), drainMs: 60_000 };
}

type Call = { url: string; init: RequestInit };

async function burst(calls: Call[], connections: number): Promise<Shot> {
  const latencies: number[] = [];
  const status: Record<string, number> = {};
  let cursor = 0;
  const started = performance.now();

  async function worker() {
    while (cursor < calls.length) {
      const current = cursor;
      cursor += 1;
      const call = calls[current];
      if (!call) return;
      const t0 = performance.now();
      const response = await fetch(call.url, call.init);
      latencies.push(performance.now() - t0);
      const code = String(response.status);
      status[code] = (status[code] ?? 0) + 1;
      await response.arrayBuffer();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(connections, calls.length) }, () => worker()),
  );
  latencies.sort((a, b) => a - b);
  const rank = (percentile: number) => {
    const index = Math.ceil((percentile / 100) * latencies.length) - 1;
    return Math.round(latencies[Math.max(0, index)] ?? 0);
  };
  const elapsed = (performance.now() - started) / 1000;
  const non2xx = Object.entries(status).reduce(
    (sum, [code, count]) => sum + (code.startsWith("2") ? 0 : count),
    0,
  );
  return {
    p50: rank(50),
    p99: rank(99),
    requestsPerSec: Math.round((calls.length / elapsed) * 10) / 10,
    total: calls.length,
    errors: 0,
    timeouts: 0,
    non2xx,
    status,
  };
}

function echoCalls(count: number): Call[] {
  return Array.from({ length: count }, () => ({
    url: `${base}/echo`,
    init: {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "load" }),
    },
  }));
}

async function measureMode(
  name: string,
  workers: number,
  clusterWorkers: string,
  redis: Redis,
  db: pg.Client,
  cookie: string,
  shutdown: boolean,
): Promise<ModeReport> {
  const api = startProcess("src/index.ts", clusterWorkers);
  await waitForHealth(api);
  const echo = {} as ModeReport["echo"];
  for (const connections of [10, 25, 50] as const) {
    await flushRateLimit(redis);
    echo[String(connections) as "10" | "25" | "50"] = await burst(
      echoCalls(connections),
      connections,
    );
  }

  await flushRateLimit(redis);
  await clearMailhog();
  const enqueueStarted = Date.now();
  const emailShot = await burst(
    Array.from({ length: 20 }, (_, index) => ({
      url: `${base}/api/email/test`,
      init: {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
          origin: env.webUrl,
        },
        body: JSON.stringify({
          to: `load-${name}-${index}@indiefast.local`,
          template: "welcome",
        }),
      },
    })),
    20,
  );
  const accepted = emailShot.status["201"] ?? emailShot.status["200"] ?? 0;
  const drained = await waitForMail(accepted);
  const email = {
    shot: emailShot,
    accepted,
    mailhog: drained.total,
    drainMs:
      drained.total >= accepted ? Date.now() - enqueueStarted : drained.drainMs,
  };

  await flushRateLimit(redis);
  const limiter = await burst(echoCalls(70), 1);

  await flushRateLimit(redis);
  const poolPrefix = `pool-${name}`;
  const poolKeys = Array.from(
    { length: 50 },
    (_, index) => `${poolPrefix}-${index}`,
  );
  await clearIdem(redis, poolKeys);
  const beforePool = await countFiles(db, `${poolPrefix}-%`);
  const poolShot = await burst(
    Array.from({ length: 50 }, (_, index) => ({
      url: `${base}/api/storage/uploads`,
      init: {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
          "idempotency-key": `${poolPrefix}-${index}`,
        },
        body: JSON.stringify({
          filename: `${poolPrefix}-${index}.png`,
          contentType: "image/png",
          sizeBytes: 1024,
        }),
      },
    })),
    50,
  );
  const pool = {
    shot: poolShot,
    rows: (await countFiles(db, `${poolPrefix}-%`)) - beforePool,
  };

  await flushRateLimit(redis);
  const stampedeName = `stampede-${name}.png`;
  await clearIdem(redis, [`stampede-${name}`]);
  const beforeStampede = await countFiles(db, stampedeName);
  const stampedeShot = await burst(
    Array.from({ length: 20 }, () => ({
      url: `${base}/api/storage/uploads`,
      init: {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
          "idempotency-key": `stampede-${name}`,
        },
        body: JSON.stringify({
          filename: stampedeName,
          contentType: "image/png",
          sizeBytes: 1024,
        }),
      },
    })),
    20,
  );
  const stampede = {
    shot: stampedeShot,
    rows: (await countFiles(db, stampedeName)) - beforeStampede,
  };

  const health = shotOf(
    await fire({
      url: `${base}/health`,
      connections: 50,
      duration: 10,
      pipelining: 1,
      timeout: 10,
    }),
  );

  let shutdownReport: ModeReport["shutdown"];
  if (shutdown) {
    const cannon = fire({
      url: `${base}/health`,
      connections: 50,
      duration: 10,
      pipelining: 1,
      timeout: 10,
    });
    await sleep(3_000);
    const started = Date.now();
    const exitCode = await stopChild(api.child);
    shutdownReport = {
      drainMs: Date.now() - started,
      exitCode,
      shot: shotOf(await cannon),
    };
    await waitUntilDown();
  } else {
    await stopChild(api.child);
    await waitUntilDown();
  }

  return {
    workers,
    echo,
    email,
    limiter,
    pool,
    stampede,
    health,
    shutdown: shutdownReport,
  };
}

async function countFiles(db: pg.Client, filename: string): Promise<number> {
  const like = filename.includes("%");
  const result = await db.query<{ n: number }>(
    like
      ? "select count(*)::int as n from file where filename like $1"
      : "select count(*)::int as n from file where filename = $1",
    [filename],
  );
  return result.rows[0]?.n ?? 0;
}

function line(shot: Shot): string {
  const codes = Object.entries(shot.status)
    .map(([code, count]) => `${code}×${count}`)
    .join(", ");
  return `p50 ${shot.p50} ms, p99 ${shot.p99} ms, ${shot.requestsPerSec} req/s, non-2xx ${shot.non2xx}, errors ${shot.errors}, timeouts ${shot.timeouts}${codes ? `, status ${codes}` : ""}`;
}

function healthSentence(single: ModeReport, cluster: ModeReport): string {
  const singleFaster =
    single.health.requestsPerSec >= cluster.health.requestsPerSec;
  if (singleFaster) {
    return `On this cached read, one process served ${single.health.requestsPerSec} req/s at p99 ${single.health.p99} ms. ${cluster.workers} workers served ${cluster.health.requestsPerSec} req/s at p99 ${cluster.health.p99} ms. Extra processes are not a speedup when the handler never blocks.`;
  }
  return `On this cached read, ${cluster.workers} workers served ${cluster.health.requestsPerSec} req/s at p99 ${cluster.health.p99} ms. One process served ${single.health.requestsPerSec} req/s at p99 ${single.health.p99} ms.`;
}

function poolSentence(single: ModeReport, cluster: ModeReport): string {
  const held =
    single.pool.rows === 50 &&
    cluster.pool.rows === 50 &&
    single.pool.shot.non2xx === 0 &&
    cluster.pool.shot.non2xx === 0;
  if (held) {
    return `Nothing gave up inside 50 in-flight uploads. One process p99 was ${single.pool.shot.p99} ms. ${cluster.workers} workers p99 was ${cluster.pool.shot.p99} ms. All 50 intents inserted a row in both modes. The 2 second pool timeout was not reached.`;
  }
  return `One process inserted ${single.pool.rows} rows out of 50 at p99 ${single.pool.shot.p99} ms with ${single.pool.shot.non2xx} non-2xx. ${cluster.workers} workers inserted ${cluster.pool.rows} rows at p99 ${cluster.pool.shot.p99} ms with ${cluster.pool.shot.non2xx} non-2xx. Pool max stays 10 per process, connect timeout 2 seconds.`;
}

function reportMarkdown(input: {
  sha: string;
  node: string;
  cpus: number;
  cpuModel: string;
  single: ModeReport;
  cluster: ModeReport;
}): string {
  const { single, cluster } = input;
  const stampedeCeiling = Math.max(single.stampede.rows, cluster.stampede.rows);
  return `# IndieFast load report

Measured on this machine, this commit, the local Compose cluster. The figures below are copied from \`docs/engineering/load-report/raw/observations.json\`.

| | |
| --- | --- |
| Commit | \`${input.sha}\` plus the uncommitted clustering and load harness |
| Node | ${input.node} |
| CPUs | ${input.cpus} (${input.cpuModel}) |
| Single process | \`CLUSTER_WORKERS=1\` |
| Cluster | ${cluster.workers} API workers |
| Limiter | 60 requests / 60 seconds / IP, Redis |
| Postgres pool | max 10 per process, 2s connect timeout |
| Health cache | Redis, 30 seconds. The health cannon is a cached read. |

An engineer shipping an MVP usually gets a Next.js starter and rebuilds the API plumbing on the next product: one process, an in-memory limiter, no queue drain, no shutdown story. IndieFast starts that plumbing with the repo. ShipFast and the T3 stack were not booted here, so this page does not rank requests per second against them. It records what this pack does under concurrency.

\`/metrics\` is per process. Counted bursts send each request once. The 10 second health run is autocannon. Row counts are Postgres. Mail counts are Mailhog.

## 1. Cannon concurrency

\`POST /echo\`. The rate-limit window is flushed before each burst. Every request is sent once.

| Burst | 1 process | ${cluster.workers} workers |
| --- | --- | --- |
| 10 in flight | ${line(single.echo["10"])} | ${line(cluster.echo["10"])} |
| 25 in flight | ${line(single.echo["25"])} | ${line(cluster.echo["25"])} |
| 50 in flight | ${line(single.echo["50"])} | ${line(cluster.echo["50"])} |

## 2. Email worker

Twenty \`POST /api/email/test\` calls, template \`welcome\`, then the BullMQ worker drains to Mailhog. The worker is one process in both runs. Delivery is at-least-once: a crash after SMTP accepts a message can send it twice.

| | 1 process | ${cluster.workers} workers |
| --- | --- | --- |
| Enqueue | ${line(single.email.shot)} | ${line(cluster.email.shot)} |
| Accepted | ${single.email.accepted} | ${cluster.email.accepted} |
| Mailhog | ${single.email.mailhog} | ${cluster.email.mailhog} |
| Drain | ${single.email.drainMs} ms | ${cluster.email.drainMs} ms |

## 3. Failure on purpose

Seventy \`POST /echo\` requests, one at a time, after a clean rate-limit window. The 61st onward should be 429. A 500 would mean the limiter failed open into an error.

| | 1 process | ${cluster.workers} workers |
| --- | --- | --- |
| 70 echo | ${line(single.limiter)} | ${line(cluster.limiter)} |

Shutdown is SIGTERM to the cluster primary three seconds into a 10 second health cannon. Budget is 10 seconds.

| Drain | Exit code | Cannon during drain |
| --- | --- | --- |
| ${cluster.shutdown?.drainMs ?? "n/a"} ms | ${cluster.shutdown?.exitCode ?? "n/a"} | ${cluster.shutdown ? line(cluster.shutdown.shot) : "n/a"} |

The cannon keeps firing until its 10 seconds are up, including after the process has exited. Its error count is that leftover traffic. The drain time and exit code are the shutdown result.

## 4. Cluster, 1 vs ${cluster.workers}

\`GET /health\`, 50 connections, 10 seconds. Cached read.

| 1 process | ${cluster.workers} workers |
| --- | --- |
| ${line(single.health)} | ${line(cluster.health)} |

${healthSentence(single, cluster)}

## 5. Shared limiter

One process returned 200×${single.limiter.status["200"] ?? 0} and 429×${single.limiter.status["429"] ?? 0}. ${cluster.workers} workers returned 200×${cluster.limiter.status["200"] ?? 0} and 429×${cluster.limiter.status["429"] ?? 0}. The cap stayed at 60. It did not become ${cluster.workers * 60}.

## 6. Pool ceiling

Fifty concurrent \`POST /api/storage/uploads\`, distinct idempotency keys, distinct filenames. One process has 10 Postgres connections. ${cluster.workers} workers have up to ${cluster.workers * 10}.

| | 1 process | ${cluster.workers} workers |
| --- | --- | --- |
| Upload intents | ${line(single.pool.shot)} | ${line(cluster.pool.shot)} |
| \`file\` rows | ${single.pool.rows} | ${cluster.pool.rows} |

${poolSentence(single, cluster)}

## Idempotency ceiling

Twenty concurrent \`POST /api/storage/uploads\` with one \`Idempotency-Key\`. The middleware has no in-flight lock, so overlapping requests can both miss and both insert.

| | 1 process | ${cluster.workers} workers |
| --- | --- | --- |
| Responses | ${line(single.stampede.shot)} | ${line(cluster.stampede.shot)} |
| \`file\` rows | ${single.stampede.rows} | ${cluster.stampede.rows} |

The ceiling published from this run is ${stampedeCeiling} handler executions for one key. A count above 1 is that race, measured, not hidden.

## What this report does not claim

These numbers are this laptop, this commit, Compose on localhost. They are not a production traffic certificate. They are not a Lighthouse score. They are not a leaderboard against ShipFast or T3, because those apps were not part of the run.
`;
}

async function main(): Promise<void> {
  if (await portAnswers()) {
    throw new Error(
      `Something is already listening on ${base}. Stop pnpm dev, then rerun.`,
    );
  }

  const cpus = availableParallelism();
  const multi = resolveWorkerCount(cpus, undefined);
  if (multi < 2) {
    throw new Error(
      "This machine has one core. The cluster comparison needs more.",
    );
  }

  await mkdir(rawDir, { recursive: true });
  const redis = new Redis({
    host: env.redisHost,
    port: env.redisPort,
    password: env.redisPassword,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });
  await redis.connect();
  const db = new pg.Client({
    host: env.databaseHost,
    port: env.databasePort,
    user: env.databaseUser,
    password: env.databasePassword,
    database: env.databaseName,
  });
  await db.connect();

  const worker = startProcess("src/worker.ts");
  await sleep(500);
  if (worker.child.exitCode !== null) {
    throw new Error(`email worker exited\n${worker.logs()}`);
  }

  const singleApi = startProcess("src/index.ts", "1");
  await waitForHealth(singleApi);
  let cookie: string;
  try {
    cookie = await signIn();
  } catch {
    await seedAdmin();
    cookie = await signIn();
  }
  await stopChild(singleApi.child);
  await waitUntilDown();

  const single = await measureMode("single", 1, "1", redis, db, cookie, false);
  const cluster = await measureMode(
    "cluster",
    multi,
    String(multi),
    redis,
    db,
    cookie,
    true,
  );

  await stopChild(worker.child);

  const observations = {
    sha: gitSha(),
    node: process.version,
    cpus,
    cpuModel: (await import("node:os")).cpus()[0]?.model ?? "unknown",
    single,
    cluster,
  };
  await writeFile(
    path.join(rawDir, "observations.json"),
    `${JSON.stringify(observations, null, 2)}\n`,
  );
  await writeFile(
    path.join(repoRoot, "docs/engineering/load-report.md"),
    reportMarkdown(observations),
  );

  await redis.quit();
  await db.end();
  logger.info(
    { cpus, workers: multi },
    "wrote docs/engineering/load-report.md",
  );
}

function gitSha(): string {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: repoRoot })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

main().catch((error: unknown) => {
  logger.error({ err: error }, "load run failed");
  process.exit(1);
});
