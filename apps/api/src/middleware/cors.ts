import cors from "cors";
import type { RequestHandler } from "express";
import { AppError } from "../configs/errors/api-error.js";
import { coreErrors } from "../configs/errors/core-errors.js";
import { isAllowedOrigin } from "../configs/origins.js";

export const corsPolicy: RequestHandler = cors({
  credentials: true,
  exposedHeaders: ["x-request-id"],
  optionsSuccessStatus: 204,
  origin(origin, callback) {
    if (origin === undefined) {
      callback(null, false);
      return;
    }

    if (isAllowedOrigin(origin)) {
      callback(null, origin);
      return;
    }

    callback(
      new AppError({
        code: coreErrors.ORIGIN_NOT_ALLOWED.code,
        status: coreErrors.ORIGIN_NOT_ALLOWED.status,
        message: coreErrors.ORIGIN_NOT_ALLOWED.message,
      }),
    );
  },
});
