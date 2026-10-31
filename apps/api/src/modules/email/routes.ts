import { emailTestSchema } from "@indiefast/types/email";
import { Router } from "express";
import { requireAuth } from "../../middleware/require-auth.js";
import { validateBody } from "../../middleware/zod-validate.js";
import { enqueueEmail } from "./enqueue.js";

export const emailRouter = Router();

emailRouter.post(
  "/test",
  requireAuth,
  validateBody(emailTestSchema),
  async (req, res) => {
    await enqueueEmail({
      to: req.body.to,
      template: req.body.template,
      url: req.body.url,
    });
    res.created({ queued: true });
  },
);
