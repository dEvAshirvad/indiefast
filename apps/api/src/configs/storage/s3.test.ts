import { expect, test } from "vitest";
import { env } from "../env.js";
import { createStorage } from "./s3.js";

function openStorage(port = env.s3Port) {
  return createStorage(
    port === env.s3Port ? env.s3Host : "127.0.0.1",
    port,
    env.s3AccessKey,
    env.s3SecretKey,
    env.s3Bucket,
    env.s3Region,
  );
}

test("ensureBucket resolves twice when the bucket already exists", async () => {
  const storage = openStorage();
  try {
    await storage.ensureBucket();
    await storage.ensureBucket();
  } finally {
    storage.destroy();
  }
});

test("a refused connection is AppError DATASTORE_UNAVAILABLE", async () => {
  const storage = openStorage(1);
  try {
    await expect(storage.ensureBucket()).rejects.toMatchObject({
      name: "AppError",
      code: "DATASTORE_UNAVAILABLE",
      message: "Storage is unavailable",
    });
  } finally {
    storage.destroy();
  }
});

test("a presigned PUT answers a WEB_URL CORS preflight", async () => {
  const storage = openStorage();
  try {
    await storage.ensureBucket();
    const putUrl = await storage.presignPut({
      key: `test/${crypto.randomUUID()}/cors.txt`,
      contentType: "text/plain",
      contentLength: 1,
    });
    const preflight = await fetch(putUrl, {
      method: "OPTIONS",
      headers: {
        Origin: env.webUrl,
        "Access-Control-Request-Method": "PUT",
        "Access-Control-Request-Headers": "content-type,content-length",
      },
    });
    expect(preflight.ok).toBe(true);
    expect(preflight.headers.get("access-control-allow-origin")).toBe(
      env.webUrl,
    );
  } finally {
    storage.destroy();
  }
});

test("presignPut then GET then deleteObject", async () => {
  const storage = openStorage();
  const key = `test/${crypto.randomUUID()}/hello.txt`;
  const body = "hello";
  try {
    await storage.ensureBucket();
    const putUrl = await storage.presignPut({
      key,
      contentType: "text/plain",
      contentLength: body.length,
    });
    const put = await fetch(putUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "text/plain",
        "Content-Length": String(body.length),
      },
      body,
    });
    expect(put.ok).toBe(true);

    const getUrl = await storage.presignGet({ key, filename: "hello.txt" });
    const get = await fetch(getUrl);
    expect(get.headers.get("content-disposition")).toMatch(/^inline;/);
    expect(await get.text()).toBe(body);

    await storage.deleteObject({ key });
    await expect(storage.deleteObject({ key })).resolves.toBeUndefined();
  } finally {
    storage.destroy();
  }
});

test("a refused connection on deleteObject is AppError DATASTORE_UNAVAILABLE", async () => {
  const storage = openStorage(1);
  try {
    await expect(storage.deleteObject({ key: "x" })).rejects.toMatchObject({
      name: "AppError",
      code: "DATASTORE_UNAVAILABLE",
      message: "Storage is unavailable",
    });
  } finally {
    storage.destroy();
  }
});
