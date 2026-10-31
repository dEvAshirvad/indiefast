import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../configs/errors/api-error.js";
import { coreErrors } from "../configs/errors/core-errors.js";

function validationError(parsed: {
  error: { issues: { path: PropertyKey[]; message: string }[] };
}) {
  const message = parsed.error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return `${path || "body"}: ${issue.message}`;
    })
    .join("; ");
  return new AppError({
    code: coreErrors.VALIDATION.code,
    status: coreErrors.VALIDATION.status,
    message,
  });
}

export function validateBody<T extends ZodType>(schema: T): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(validationError(parsed));
      return;
    }
    req.body = parsed.data;
    next();
  };
}

export function validateParams<T extends ZodType>(schema: T): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      next(validationError(parsed));
      return;
    }
    req.params = parsed.data as typeof req.params;
    next();
  };
}
