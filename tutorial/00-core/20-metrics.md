# 20 — Metrics

Logs are stories about one request. Metrics are rates. One counter is enough until a dashboard exists.

## One number

`src/middleware/metrics.ts` keeps a counter in the process. Every finished response increments it, except `GET /metrics` itself. The scrape would otherwise count as traffic.

`GET /metrics` answers `text/plain`:

```
http_requests_total 12
```

The number is the count of finished requests before this scrape. It is not the JSON envelope. `/metrics` is on the rate-limit skip list, next to `/health`, so a scraper does not spend the request budget.

The counter dies with the process. There is no Prometheus client and no Redis.

## Verify

```sh
pnpm --filter api test
curl -s localhost:4000/metrics
curl -s localhost:4000/health
curl -s localhost:4000/metrics
```

The second number is one higher than the first. Twenty scrapes in a row stay 200.

## Stop

One counter. Lesson 21 puts the middleware in runtime order. It does not add a route.
