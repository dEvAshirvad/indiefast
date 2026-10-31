import type { RequestHandler } from "express";
import { authRepository } from "../modules/auth/repository.js";

export function auditTrail(action: string): RequestHandler {
  return async (req, _res, next) => {
    try {
      if (req.user?.id) {
        await authRepository.writeAuditEvent({
          userId: req.user.id,
          action,
          metadata: {
            path: req.path,
            method: req.method,
          },
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
