import { apiReference } from "@scalar/express-api-reference";
import { toNodeHandler } from "better-auth/node";
import express, { type Express } from "express";
import { z } from "zod";
import { auth } from "../lib/auth.js";
import { responder } from "../lib/responder.js";
import { cacheResponse } from "../middleware/cache.js";
import { corsPolicy } from "../middleware/cors.js";
import { errorHandler } from "../middleware/error-handler.js";
import { idempotency } from "../middleware/idempotency.js";
import { metrics, metricsHandler } from "../middleware/metrics.js";
import { notFound } from "../middleware/not-found.js";
import { rateLimiter } from "../middleware/rate-limit.js";
import { requestContext } from "../middleware/request-context.js";
import { requestLogger } from "../middleware/request-logger.js";
import { sanitize } from "../middleware/sanitize.js";
import { security } from "../middleware/security.js";
import { emojiFavicon } from "../middleware/serve-emoji-favicon.js";
import { validateBody } from "../middleware/zod-validate.js";
import { modulesRouter } from "../modules/index.js";
import { env } from "./env.js";
import { AppError } from "./errors/api-error.js";
import { coreErrors } from "./errors/core-errors.js";
import { openApiDocument } from "./openapi.js";

export function createApp(): Express {
  const app = express();

  // Runtime order. Teaching order is the lesson numbers.
  // 1. request logger — the id, the header, and the finish line
  // 2. security — helmet, hpp, compression
  // 3. request context — AsyncLocalStorage
  // 4. rate limit
  // 5. sanitize
  // Responder, JSON, and CORS are the plumbing section 8.2 assumes.
  // 6. routes
  // The error handler is last.
  app.use(requestLogger);
  app.use(responder);
  app.use(express.json());
  app.use(security);
  app.use(requestContext);
  app.use(corsPolicy);
  app.use(rateLimiter);
  app.use(sanitize);
  app.use(metrics);
  app.use(cacheResponse(["/health"]));

  app.get("/health", (_req, res) => {
    res.ok({ ok: true });
  });

  // Deleted when Auth has a real POST. The schema stays beside the route until Web needs it.
  const echoBody = z.object({ message: z.string().min(1) });
  app.post("/echo", idempotency(), validateBody(echoBody), (req, res) => {
    res.ok({ message: req.body.message });
  });

  app.all("/api/auth/*splat", toNodeHandler(auth));
  app.use("/api", modulesRouter);

  app.get("/api/openapi.json", (_req, res) => {
    res.json(openApiDocument);
  });

  app.get(
    "/api/reference",
    apiReference({
      sources: [
        { url: "/api/openapi.json", title: "App API" },
        { url: "/api/auth/open-api/generate-schema", title: "Auth API" },
      ],
    }),
  );

  app.get("/", (_req, res) => {
    res.ok({
      message: "IndieFast API services are running.",
      nodeEnv: env.nodeEnv,
      uptime: process.uptime(),
    });
  });

  if (env.nodeEnv !== "production") {
    app.get("/boom", async () => {
      throw new AppError({
        code: coreErrors.INTERNAL.code,
        status: coreErrors.INTERNAL.status,
        message: "Boom",
      });
    });

    app.get("/slow", async (_req, res) => {
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      res.ok({ slow: true });
    });

    app.use(emojiFavicon);
  }

  app.get("/metrics", metricsHandler);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
