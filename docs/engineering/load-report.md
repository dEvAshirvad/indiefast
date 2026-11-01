# IndieFast load report

Measured on this machine, this commit, the local Compose cluster. The figures below are copied from `docs/engineering/load-report/raw/observations.json`.

| | |
| --- | --- |
| Commit | `849ba18` plus the uncommitted clustering and load harness |
| Node | v25.9.0 |
| CPUs | 8 (Apple M2) |
| Single process | `CLUSTER_WORKERS=1` |
| Cluster | 8 API workers |
| Limiter | 60 requests / 60 seconds / IP, Redis |
| Postgres pool | max 10 per process, 2s connect timeout |
| Health cache | Redis, 30 seconds. The health cannon is a cached read. |

An engineer shipping an MVP usually gets a Next.js starter and rebuilds the API plumbing on the next product: one process, an in-memory limiter, no queue drain, no shutdown story. IndieFast starts that plumbing with the repo. ShipFast and the T3 stack were not booted here, so this page does not rank requests per second against them. It records what this pack does under concurrency.

`/metrics` is per process. Counted bursts send each request once. The 10 second health run is autocannon. Row counts are Postgres. Mail counts are Mailhog.

## 1. Cannon concurrency

`POST /echo`. The rate-limit window is flushed before each burst. Every request is sent once.

| Burst | 1 process | 8 workers |
| --- | --- | --- |
| 10 in flight | p50 15 ms, p99 17 ms, 516.8 req/s, non-2xx 0, errors 0, timeouts 0, status 200×10 | p50 73 ms, p99 117 ms, 82.3 req/s, non-2xx 0, errors 0, timeouts 0, status 200×10 |
| 25 in flight | p50 7 ms, p99 8 ms, 2537.2 req/s, non-2xx 0, errors 0, timeouts 0, status 200×25 | p50 14 ms, p99 21 ms, 1026.1 req/s, non-2xx 0, errors 0, timeouts 0, status 200×25 |
| 50 in flight | p50 20 ms, p99 29 ms, 1581.9 req/s, non-2xx 0, errors 0, timeouts 0, status 200×50 | p50 11 ms, p99 27 ms, 1765.1 req/s, non-2xx 0, errors 0, timeouts 0, status 200×50 |

## 2. Email worker

Twenty `POST /api/email/test` calls, template `welcome`, then the BullMQ worker drains to Mailhog. The worker is one process in both runs. Delivery is at-least-once: a crash after SMTP accepts a message can send it twice.

| | 1 process | 8 workers |
| --- | --- | --- |
| Enqueue | p50 51 ms, p99 55 ms, 357.7 req/s, non-2xx 0, errors 0, timeouts 0, status 201×20 | p50 131 ms, p99 152 ms, 130.8 req/s, non-2xx 0, errors 0, timeouts 0, status 201×20 |
| Accepted | 20 | 20 |
| Mailhog | 20 | 20 |
| Drain | 311 ms | 413 ms |

## 3. Failure on purpose

Seventy `POST /echo` requests, one at a time, after a clean rate-limit window. The 61st onward should be 429. A 500 would mean the limiter failed open into an error.

| | 1 process | 8 workers |
| --- | --- | --- |
| 70 echo | p50 1 ms, p99 2 ms, 968.9 req/s, non-2xx 10, errors 0, timeouts 0, status 200×60, 429×10 | p50 1 ms, p99 4 ms, 1013.8 req/s, non-2xx 10, errors 0, timeouts 0, status 200×60, 429×10 |

Shutdown is SIGTERM to the cluster primary three seconds into a 10 second health cannon. Budget is 10 seconds.

| Drain | Exit code | Cannon during drain |
| --- | --- | --- |
| 7176 ms | 0 | p50 2 ms, p99 14 ms, 12195.2 req/s, non-2xx 0, errors 37113, timeouts 0, status 200×121948 |

The cannon keeps firing until its 10 seconds are up, including after the process has exited. Its error count is that leftover traffic. The drain time and exit code are the shutdown result.

## 4. Cluster, 1 vs 8

`GET /health`, 50 connections, 10 seconds. Cached read.

| 1 process | 8 workers |
| --- | --- |
| p50 2 ms, p99 5 ms, 19927.64 req/s, non-2xx 0, errors 0, timeouts 0, status 200×219206 | p50 2 ms, p99 17 ms, 13527.2 req/s, non-2xx 0, errors 0, timeouts 0, status 200×135268 |

On this cached read, one process served 19927.64 req/s at p99 5 ms. 8 workers served 13527.2 req/s at p99 17 ms. Extra processes are not a speedup when the handler never blocks.

## 5. Shared limiter

One process returned 200×60 and 429×10. Eight workers returned 200×60 and 429×10. The cap stayed at 60. It did not become 480.

## 6. Pool ceiling

Fifty concurrent `POST /api/storage/uploads`, distinct idempotency keys, distinct filenames. One process has 10 Postgres connections. 8 workers have up to 80.

| | 1 process | 8 workers |
| --- | --- | --- |
| Upload intents | p50 86 ms, p99 92 ms, 531.8 req/s, non-2xx 0, errors 0, timeouts 0, status 201×50 | p50 106 ms, p99 129 ms, 383.7 req/s, non-2xx 0, errors 0, timeouts 0, status 201×50 |
| `file` rows | 50 | 50 |

Nothing gave up inside 50 in-flight uploads. One process p99 was 92 ms. 8 workers p99 was 129 ms. All 50 intents inserted a row in both modes. The 2 second pool timeout was not reached.

## Idempotency ceiling

Twenty concurrent `POST /api/storage/uploads` with one `Idempotency-Key`. The middleware has no in-flight lock, so overlapping requests can both miss and both insert.

| | 1 process | 8 workers |
| --- | --- | --- |
| Responses | p50 20 ms, p99 21 ms, 917.4 req/s, non-2xx 0, errors 0, timeouts 0, status 201×20 | p50 24 ms, p99 27 ms, 723.4 req/s, non-2xx 0, errors 0, timeouts 0, status 201×20 |
| `file` rows | 20 | 20 |

The ceiling published from this run is 20 handler executions for one key. A count above 1 is that race, measured, not hidden.

## What this report does not claim

These numbers are this laptop, this commit, Compose on localhost. They are not a production traffic certificate. They are not a Lighthouse score. They are not a leaderboard against ShipFast or T3, because those apps were not part of the run.
