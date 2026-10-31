import pino from "pino";
import { getRequestId } from "../../lib/request-context.js";
import { env } from "../env.js";

const level =
  env.nodeEnv === "test"
    ? "silent"
    : env.nodeEnv === "production"
      ? "info"
      : "debug";

export const logger = pino({
  level,
  redact: ["req.headers.authorization", "req.headers.cookie"],
  mixin() {
    const requestId = getRequestId();
    return requestId ? { requestId } : {};
  },
});
