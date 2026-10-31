import { AsyncLocalStorage } from "node:async_hooks";

type RequestStore = {
  requestId: string;
};

const requestContext = new AsyncLocalStorage<RequestStore>();

export function runWithRequestId<T>(requestId: string, fn: () => T): T {
  return requestContext.run({ requestId }, fn);
}

export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}
