import { createServer, type Server } from "node:http";
import { expect, test, vi } from "vitest";
import { beginShutdown, installShutdown } from "./shutdown.js";

function listen(server: Server): Promise<URL> {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address && typeof address === "object") {
        resolve(new URL(`http://127.0.0.1:${address.port}/`));
      }
    });
  });
}

test("beginShutdown finishes the in-flight response, then closes resources once", async () => {
  const order: string[] = [];
  const server = createServer((_req, res) => {
    setTimeout(() => {
      order.push("response");
      res.writeHead(200);
      res.end("ok");
    }, 100);
  });
  const url = await listen(server);

  const pending = fetch(url);
  await new Promise((resolve) => setTimeout(resolve, 10));

  const done = beginShutdown(server, async () => {
    order.push("close");
  });

  const response = await pending;
  expect(response.status).toBe(200);
  await done;
  expect(order).toEqual(["response", "close"]);

  await expect(fetch(url)).rejects.toThrow();

  await beginShutdown(server, async () => {
    order.push("close-again");
  });
  expect(order).toEqual(["response", "close"]);
});

test("a hung request hits the injected exit instead of waiting forever", async () => {
  const server = createServer((_req, res) => {
    res.writeHead(200);
    void res;
  });
  const url = await listen(server);
  const exit = vi.fn();
  const pending = fetch(url);
  await new Promise((resolve) => setTimeout(resolve, 10));

  await beginShutdown(server, async () => undefined, {
    timeoutMs: 20,
    exit,
  });

  expect(exit).toHaveBeenCalledWith(1);
  server.closeAllConnections();
  await pending.catch(() => undefined);
});

test("installShutdown registers one SIGTERM listener with process.once", () => {
  const server = createServer();
  const onceCalls: unknown[][] = [];
  const onCalls: unknown[][] = [];
  const once = vi.spyOn(process, "once").mockImplementation((...args) => {
    onceCalls.push(args);
    return process;
  });
  const on = vi.spyOn(process, "on").mockImplementation((...args) => {
    onCalls.push(args);
    return process;
  });

  try {
    installShutdown(server, async () => undefined);
    expect(onceCalls.filter(([signal]) => signal === "SIGTERM")).toHaveLength(
      1,
    );
    expect(onCalls.some(([signal]) => signal === "SIGTERM")).toBe(false);
  } finally {
    once.mockRestore();
    on.mockRestore();
  }
});
