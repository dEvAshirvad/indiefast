import type { RequestHandler } from "express";
import { AppError } from "../configs/errors/api-error.js";
import { coreErrors } from "../configs/errors/core-errors.js";

export const notFound: RequestHandler = (req, _res, next) => {
  next(
    new AppError({
      code: coreErrors.NOT_FOUND.code,
      status: coreErrors.NOT_FOUND.status,
      message: `No route for ${req.method} ${req.path}`,
    }),
  );
};
