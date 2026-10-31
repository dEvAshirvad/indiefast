import type { RequestHandler } from "express";
import { AppError } from "../configs/errors/api-error.js";
import { getRequestSession } from "../lib/auth-session.js";

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const session = await getRequestSession(req.headers);
    if (!session) {
      throw new AppError({
        code: "UNAUTHORIZED",
        status: 401,
        message: "Authentication required",
      });
    }
    req.user = session.user;
    req.session = session.session;
    next();
  } catch (error) {
    next(error);
  }
};
