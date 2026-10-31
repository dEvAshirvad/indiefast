import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { getPostgres } from "../../configs/db/postgres.js";
import { user } from "../auth/model/core.js";
import { fileRepository } from "./repository.js";

async function insertUser() {
  const id = crypto.randomUUID();
  await getPostgres()
    .db.insert(user)
    .values({
      id,
      email: `${id}@example.com`,
      name: "Storage Test",
      role: "user",
      emailVerified: false,
    });
  return id;
}

test("insert then findById then deleteById", async () => {
  const ownerId = await insertUser();
  const id = crypto.randomUUID();
  const row = {
    id,
    ownerId,
    bucketKey: `${ownerId}/${id}/photo.png`,
    filename: "photo.png",
    contentType: "image/png",
    sizeBytes: 1024,
  };

  await fileRepository.insert(row);
  const found = await fileRepository.findById(id);
  expect(found).toMatchObject(row);

  await fileRepository.deleteById(id);
  expect(await fileRepository.findById(id)).toBeUndefined();

  await getPostgres().db.delete(user).where(eq(user.id, ownerId));
});

test("insert without a user fails the owner foreign key", async () => {
  const id = crypto.randomUUID();
  await expect(
    fileRepository.insert({
      id,
      ownerId: crypto.randomUUID(),
      bucketKey: `${id}/missing.png`,
      filename: "missing.png",
      contentType: "image/png",
      sizeBytes: 1,
    }),
  ).rejects.toThrow();
});
