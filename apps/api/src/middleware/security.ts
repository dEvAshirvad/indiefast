import compression from "compression";
import type { RequestHandler } from "express";
import helmet from "helmet";
import hpp from "hpp";

// Express 5's req.query is a getter. hpp mutates the object it reads, then
// the next read parses the URL again. Pin the parsed object first.
const pinQuery: RequestHandler = (req, _res, next) => {
  Object.defineProperty(req, "query", {
    value: { ...req.query },
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
};

export const security: RequestHandler[] = [
  helmet(),
  pinQuery,
  hpp(),
  compression(),
];
