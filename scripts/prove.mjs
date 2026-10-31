import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const base = process.env.API_URL ?? "http://localhost:4000";
const signupBudgetMs = 500;

function percentile(sorted, p) {
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[index] ?? 0;
}

async function once(path, options = {}) {
  const headers = {
    origin: "http://localhost:3000",
    ...(options.headers ?? {}),
  };
  const started = performance.now();
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers,
    signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
  });
  const text = await response.text();
  return {
    status: response.status,
    ms: performance.now() - started,
    text,
    headers: response.headers,
  };
}

async function burst(count, concurrency, run) {
  const times = [];
  const statuses = [];
  let cursor = 0;
  async function worker() {
    while (cursor < count) {
      const index = cursor;
      cursor += 1;
      const result = await run(index);
      times.push(result.ms);
      statuses.push(result.status);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  times.sort((a, b) => a - b);
  const serverErrors = statuses.filter((status) => status >= 500).length;
  return {
    n: count,
    p50: Math.round(percentile(times, 50)),
    p95: Math.round(percentile(times, 95)),
    serverErrors,
    statuses,
  };
}

function cookieHeader(headers) {
  const raw = headers.getSetCookie?.() ?? [];
  return raw.map((line) => line.split(";")[0]).join("; ");
}

async function mailhogCount() {
  const response = await fetch("http://127.0.0.1:8025/api/v2/messages", {
    signal: AbortSignal.timeout(2_000),
  });
  if (!response.ok) return -1;
  const body = await response.json();
  return body.total ?? body.count ?? body.items?.length ?? 0;
}

function compose(args) {
  return new Promise((resolve) => {
    const child = spawn("docker", ["compose", ...args], { stdio: "inherit" });
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

const report = [];

const health = await burst(20, 10, () => once("/health"));
report.push({ name: "health", ...health, statuses: undefined });

const stamp = Date.now();
const first = await once("/api/auth/sign-up/email", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    name: "Gate",
    email: `gate-${stamp}@example.com`,
    password: "password123",
  }),
});
const cookie = cookieHeader(first.headers);
const presign = await burst(9, 3, () =>
  once("/api/storage/uploads", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
    },
    body: JSON.stringify({
      filename: "a.png",
      contentType: "image/png",
      sizeBytes: 10,
    }),
  }),
);
report.push({
  name: "presign",
  ...presign,
  statuses: undefined,
  firstStatus: first.status,
});

const signup = await burst(50, 10, (index) =>
  once("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Gate",
      email: `gate-${stamp}-${index}@example.com`,
      password: "password123",
    }),
  }),
);
report.push({ name: "signup", ...signup, statuses: undefined });

const accepted = signup.statuses.filter(
  (status) => status >= 200 && status < 300,
).length;
const signupPass =
  signup.p95 < signupBudgetMs &&
  signup.serverErrors === 0 &&
  accepted === 50 &&
  first.status >= 200 &&
  first.status < 300;
report.push({
  name: "signup-budget",
  ok: signupPass,
  budgetMs: signupBudgetMs,
  p95: signup.p95,
  accepted,
  serverErrors: signup.serverErrors,
  firstStatus: first.status,
});

const flood = await burst(70, 10, () =>
  once("/echo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: "limit" }),
  }),
);
report.push({
  name: "rate-limit-returns-429",
  ok: flood.statuses.includes(429),
  p95: flood.p95,
});

if (process.argv.includes("--chaos")) {
  const worker = spawn(
    "pnpm",
    ["--filter", "api", "exec", "tsx", "src/worker.ts"],
    { stdio: "inherit" },
  );
  await delay(1_000);
  const before = await mailhogCount().catch(() => -1);
  await compose(["stop", "mailhog"]);
  const during = await once("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Gate",
      email: `gate-down-${stamp}@example.com`,
      password: "password123",
    }),
  });
  await delay(12_000);
  await compose(["start", "mailhog"]);
  await delay(1_000);
  const after = await once("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Gate",
      email: `gate-back-${stamp}@example.com`,
      password: "password123",
    }),
  });
  await delay(3_000);
  const messages = await mailhogCount().catch(() => -1);
  worker.kill("SIGTERM");
  report.push({
    name: "mailhog-down",
    signupWhileDown: during.status,
    signupAfter: after.status,
    mailhogBefore: before,
    mailhogAfter: messages,
  });

  await compose(["stop", "redis"]);
  const redisDownStarted = performance.now();
  let redisDown;
  try {
    redisDown = await once("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Gate",
        email: `gate-redis-${stamp}@example.com`,
        password: "password123",
      }),
    });
  } catch (error) {
    redisDown = {
      status: 0,
      ms: performance.now() - redisDownStarted,
      text: error instanceof Error ? error.message : "timeout",
    };
  }
  await compose(["start", "redis"]);
  report.push({
    name: "redis-down-signup",
    status: redisDown.status,
    ms: Math.round(redisDown.ms),
    body: redisDown.text.slice(0, 240),
  });

  const boot = spawn(
    "pnpm",
    ["--filter", "api", "exec", "tsx", "src/index.ts"],
    {
      env: { ...process.env, PORT: "4010", DATABASE_PORT: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let bootLog = "";
  boot.stdout.on("data", (chunk) => {
    bootLog += chunk.toString();
  });
  boot.stderr.on("data", (chunk) => {
    bootLog += chunk.toString();
  });
  const bootCode = await Promise.race([
    new Promise((resolve) => {
      boot.on("exit", (code) => resolve(code ?? 1));
    }),
    delay(10_000).then(() => {
      boot.kill("SIGTERM");
      return "timeout";
    }),
  ]);
  report.push({
    name: "postgres-boot",
    exit: bootCode,
    appError: bootLog.includes("DATASTORE_UNAVAILABLE"),
  });

  const slowApi = spawn(
    "pnpm",
    ["--filter", "api", "exec", "tsx", "src/index.ts"],
    {
      env: { ...process.env, PORT: "4010" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  await Promise.race([
    new Promise((resolve, reject) => {
      const onData = (chunk) => {
        if (chunk.toString().includes("api listening")) {
          slowApi.stdout.off("data", onData);
          resolve();
        }
      };
      slowApi.stdout.on("data", onData);
      slowApi.on("exit", () => reject(new Error("api exited before listening")));
    }),
    delay(15_000).then(() => {
      slowApi.kill("SIGTERM");
      throw new Error("api did not listen");
    }),
  ]);
  const slow = fetch("http://127.0.0.1:4010/slow");
  await delay(200);
  slowApi.kill("SIGTERM");
  const slowResponse = await slow;
  const slowExit = await new Promise((resolve) => {
    slowApi.on("exit", (code) => resolve(code ?? 1));
  });
  report.push({
    name: "sigterm-during-request",
    status: slowResponse.status,
    exit: slowExit,
  });
}

console.log(JSON.stringify(report, null, 2));
if (report.some((row) => row.ok === false)) process.exitCode = 1;
