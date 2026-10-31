import type { RequestHandler } from "express";
import { AppError } from "../configs/errors/api-error.js";

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    next(
      new AppError({
        code: "UNAUTHORIZED",
        status: 401,
        message: "Authentication required",
      }),
    );
    return;
  }
  if (req.user.role !== "admin") {
    next(
      new AppError({
        code: "FORBIDDEN",
        status: 403,
        message: "Admin access required",
      }),
    );
    return;
  }
  next();
};
