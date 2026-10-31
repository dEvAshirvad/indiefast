import { createServer, type Server } from "node:http";
import { expect, test } from "vitest";
import { createHttpClient } from "./http-client.js";
import { TimeoutError } from "./with-timeout.js";

function listen(
  handler: (
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
  ) => void,
): Promise<{ url: string; server: Server }> {
  const server = createServer(handler);
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = address && typeof address === "object" ? address.port : 0;
      resolve({ url: `http://127.0.0.1:${port}/`, server });
    });
  });
}

test("get returns a 200 response", async () => {
  const { url, server } = await listen((_req, res) => {
    res.writeHead(200);
    res.end("ok");
  });
  try {
    const response = await createHttpClient().get(url);
    expect(response.status).toBe(200);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("after the threshold a sleeping server fails fast", async () => {
  const { url, server } = await listen((_req, res) => {
    setTimeout(() => {
      res.writeHead(200);
      res.end("slow");
    }, 300);
  });
  const client = createHttpClient({
    timeoutMs: 50,
    attempts: 1,
    volumeThreshold: 2,
    errorThresholdPercentage: 50,
    resetTimeout: 60_000,
  });

  try {
    await expect(client.get(url)).rejects.toBeInstanceOf(TimeoutError);
    await expect(client.get(url)).rejects.toBeInstanceOf(TimeoutError);
    const started = Date.now();
    await expect(client.get(url)).rejects.toThrow(/open/i);
    expect(Date.now() - started).toBeLessThan(30);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
