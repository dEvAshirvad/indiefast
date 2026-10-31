import type { ErrorRequestHandler } from "express";
import { AppError } from "../configs/errors/api-error.js";
import { coreErrors } from "../configs/errors/core-errors.js";
import { logger } from "../configs/logger/pino.js";
import { getRequestId } from "../lib/request-context.js";

function isMalformedJson(error: unknown): boolean {
  if (!(error instanceof SyntaxError)) return false;
  const record = error as SyntaxError & {
    status?: number;
    statusCode?: number;
    type?: string;
  };
  return (
    record.status === 400 ||
    record.statusCode === 400 ||
    record.type === "entity.parse.failed"
  );
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const requestId = getRequestId() ?? res.locals.requestId ?? "unknown";

  if (res.headersSent) {
    logger.error({ requestId, err: error }, "error after headers were sent");
    return;
  }

  if (error instanceof AppError) {
    logger.warn(
      { requestId, code: error.code, status: error.status },
      error.message,
    );
    res.fail(error.status, { code: error.code, message: error.message });
    return;
  }

  if (isMalformedJson(error)) {
    logger.warn(
      { requestId, code: coreErrors.VALIDATION.code },
      "malformed json",
    );
    res.fail(coreErrors.VALIDATION.status, {
      code: coreErrors.VALIDATION.code,
      message: coreErrors.VALIDATION.message,
    });
    return;
  }

  logger.error({ requestId, err: error }, "unhandled error");
  res.fail(coreErrors.INTERNAL.status, {
    code: coreErrors.INTERNAL.code,
    message: coreErrors.INTERNAL.message,
  });
};
