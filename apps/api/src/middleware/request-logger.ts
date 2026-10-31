import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import { logger } from "../configs/logger/pino.js";

export const requestLogger: RequestHandler = (req, res, next) => {
  const requestId = randomUUID();
  res.locals.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  const started = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    logger.info(
      {
        requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Math.round(durationMs),
      },
      "request",
    );
  });

  next();
};
