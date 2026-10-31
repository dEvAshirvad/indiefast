import type { RequestHandler } from "express";

let requestsTotal = 0;

export const metrics: RequestHandler = (req, res, next) => {
  if (req.path !== "/metrics") {
    res.on("finish", () => {
      requestsTotal += 1;
    });
  }
  next();
};

export const metricsHandler: RequestHandler = (_req, res) => {
  res.type("text/plain").send(`http_requests_total ${requestsTotal}\n`);
};
