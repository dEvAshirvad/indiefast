import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { getPostgres } from "../../configs/db/postgres.js";
import { getStorage } from "../../configs/storage/s3.js";
import { user } from "../auth/model/core.js";
import { storageService } from "./service.js";

async function insertUser() {
  const id = crypto.randomUUID();
  await getPostgres()
    .db.insert(user)
    .values({
      id,
      email: `${id}@example.com`,
      name: "Storage Service",
      role: "user",
      emailVerified: false,
    });
  return id;
}

test("createUploadIntent rejects files over 10 MiB", async () => {
  await expect(
    storageService.createUploadIntent({
      ownerId: crypto.randomUUID(),
      filename: "big.png",
      contentType: "image/png",
      sizeBytes: 10_485_761,
    }),
  ).rejects.toMatchObject({
    name: "AppError",
    code: "BAD_REQUEST",
    message: "File too large",
  });
});

test("createUploadIntent rejects a disallowed content type", async () => {
  await expect(
    storageService.createUploadIntent({
      ownerId: crypto.randomUUID(),
      filename: "notes.pdf",
      contentType: "application/pdf",
      sizeBytes: 1,
    }),
  ).rejects.toMatchObject({
    name: "AppError",
    code: "BAD_REQUEST",
    message: "Unsupported content type",
  });
});

test("createUploadIntent then getForOwner then deleteForOwner", async () => {
  const ownerId = await insertUser();
  try {
    await getStorage().ensureBucket();
    const created = await storageService.createUploadIntent({
      ownerId,
      filename: "path/to/photo.png",
      contentType: "image/png",
      sizeBytes: 5,
    });
    expect(created.expiresIn).toBe(60);
    expect(created.file.filename).toBe("photo.png");
    expect(created.file.bucketKey).toBe(
      `${ownerId}/${created.file.id}/photo.png`,
    );
    expect(created.uploadUrl).toContain(created.file.bucketKey);

    const put = await fetch(created.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "image/png",
        "Content-Length": "5",
      },
      body: "hello",
    });
    expect(put.ok).toBe(true);

    const got = await storageService.getForOwner({
      id: created.file.id,
      ownerId,
    });
    expect(got.expiresIn).toBe(300);
    expect(got.file.id).toBe(created.file.id);
    const downloaded = await fetch(got.downloadUrl);
    expect(await downloaded.text()).toBe("hello");

    await expect(
      storageService.getForOwner({
        id: created.file.id,
        ownerId: crypto.randomUUID(),
      }),
    ).rejects.toMatchObject({ name: "AppError", code: "NOT_FOUND" });

    await expect(
      storageService.deleteForOwner({
        id: created.file.id,
        ownerId: crypto.randomUUID(),
      }),
    ).rejects.toMatchObject({ name: "AppError", code: "NOT_FOUND" });

    await storageService.deleteForOwner({ id: created.file.id, ownerId });
    await expect(
      storageService.getForOwner({ id: created.file.id, ownerId }),
    ).rejects.toMatchObject({ name: "AppError", code: "NOT_FOUND" });
  } finally {
    await getPostgres().db.delete(user).where(eq(user.id, ownerId));
  }
});
