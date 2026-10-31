import type { RequestHandler } from "express";
import { runWithRequestId } from "../lib/request-context.js";

export const requestContext: RequestHandler = (_req, res, next) => {
  const requestId = res.locals.requestId;
  if (!requestId) {
    next();
    return;
  }
  runWithRequestId(requestId, () => next());
};
