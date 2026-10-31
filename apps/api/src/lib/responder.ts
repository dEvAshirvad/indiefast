import type { RequestHandler, Response } from "express";
import { getRequestId } from "./request-context.js";

type ErrorPayload = {
  code: string;
  message: string;
};

function requestIdOf(res: Response): string {
  return getRequestId() ?? res.locals.requestId ?? "unknown";
}

export const responder: RequestHandler = (_req, res, next) => {
  res.ok = (data) => {
    res.status(200).json({
      success: true,
      data,
      meta: { requestId: requestIdOf(res) },
    });
    return res;
  };

  res.created = (data) => {
    res.status(201).json({
      success: true,
      data,
      meta: { requestId: requestIdOf(res) },
    });
    return res;
  };

  res.fail = (status, error: ErrorPayload) => {
    res.status(status).json({
      success: false,
      error,
      meta: { requestId: requestIdOf(res) },
    });
    return res;
  };

  next();
};
