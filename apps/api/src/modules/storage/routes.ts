import {
  fileIdParamSchema,
  uploadIntentSchema,
} from "@indiefast/types/storage";
import { Router } from "express";
import { AppError } from "../../configs/errors/api-error.js";
import { auditTrail } from "../../middleware/audit-trail.js";
import { idempotency } from "../../middleware/idempotency.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { validateBody, validateParams } from "../../middleware/zod-validate.js";
import { storageService } from "./service.js";

function ownerIdOf(req: { user?: { id: string } }) {
  if (!req.user) {
    throw new AppError({
      code: "UNAUTHORIZED",
      status: 401,
      message: "Authentication required",
    });
  }
  return req.user.id;
}

export const storageRouter = Router();

storageRouter.post(
  "/uploads",
  requireAuth,
  idempotency(),
  validateBody(uploadIntentSchema),
  auditTrail("storage.upload"),
  async (req, res) => {
    const data = await storageService.createUploadIntent({
      ownerId: ownerIdOf(req),
      filename: req.body.filename,
      contentType: req.body.contentType,
      sizeBytes: req.body.sizeBytes,
    });
    res.created(data);
  },
);

storageRouter.get(
  "/files/:id",
  requireAuth,
  validateParams(fileIdParamSchema),
  async (req, res) => {
    const { id } = fileIdParamSchema.parse(req.params);
    const data = await storageService.getForOwner({
      id,
      ownerId: ownerIdOf(req),
    });
    res.ok(data);
  },
);

storageRouter.delete(
  "/files/:id",
  requireAuth,
  validateParams(fileIdParamSchema),
  auditTrail("storage.delete"),
  async (req, res) => {
    const { id } = fileIdParamSchema.parse(req.params);
    await storageService.deleteForOwner({
      id,
      ownerId: ownerIdOf(req),
    });
    res.ok({ ok: true });
  },
);
