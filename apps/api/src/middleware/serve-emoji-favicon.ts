import type { RequestHandler } from "express";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚡</text></svg>`;

export const emojiFavicon: RequestHandler = (req, res, next) => {
  if (req.path !== "/favicon.ico") {
    next();
    return;
  }
  res.type("image/svg+xml");
  res.send(svg);
};
