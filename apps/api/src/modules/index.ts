import { Router } from "express";
import { env } from "../configs/env.js";
import { emailRouter } from "./email/routes.js";
import { storageRouter } from "./storage/routes.js";

export function createModulesRouter(options: { emailApi: boolean }) {
  const router = Router();
  router.use("/storage", storageRouter);
  if (options.emailApi) router.use("/email", emailRouter);
  return router;
}

export const modulesRouter = createModulesRouter({
  emailApi: env.emailApiEnabled,
});
