import type { RequestHandler } from "express";
import { AppError } from "../configs/errors/api-error.js";
import { coreErrors } from "../configs/errors/core-errors.js";

const forbidden = new Set(["__proto__", "constructor", "prototype"]);

function badRequest(): AppError {
  return new AppError({
    code: coreErrors.BAD_REQUEST.code,
    status: coreErrors.BAD_REQUEST.status,
    message: coreErrors.BAD_REQUEST.message,
  });
}

function walk(value: unknown): void {
  if (typeof value === "string") {
    if (value.includes("\0")) throw badRequest();
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) walk(item);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const key of Object.keys(value)) {
    if (forbidden.has(key) || key.includes("\0")) throw badRequest();
    walk((value as Record<string, unknown>)[key]);
  }
}

export const sanitize: RequestHandler = (req, _res, next) => {
  try {
    walk(req.body);
    walk(req.query);
    walk(req.params);
    next();
  } catch (error) {
    next(error);
  }
};
