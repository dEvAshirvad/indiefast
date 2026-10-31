import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { env } from "../env.js";
import { createPostgres, migratePostgres } from "./postgres.js";

function openPostgres(port = env.databasePort) {
  return createPostgres(
    port === env.databasePort ? env.databaseHost : "127.0.0.1",
    port,
    env.databaseUser,
    env.databasePassword,
    env.databaseName,
  );
}

test("ping runs select 1", async () => {
  const postgres = openPostgres();
  try {
    await postgres.ping();
  } finally {
    await postgres.close();
  }
});

test("a refused connection is AppError DATASTORE_UNAVAILABLE", async () => {
  const postgres = openPostgres(1);
  try {
    await expect(postgres.ping()).rejects.toMatchObject({
      name: "AppError",
      code: "DATASTORE_UNAVAILABLE",
      message: "Postgres is unavailable",
    });
  } finally {
    await postgres.close();
  }
});

test("migrate applies an empty journal twice", async () => {
  const postgres = openPostgres();
  const migrationsFolder = fileURLToPath(
    new URL("./migrations", import.meta.url),
  );
  try {
    await migratePostgres(postgres.db, migrationsFolder);
    await migratePostgres(postgres.db, migrationsFolder);
  } finally {
    await postgres.close();
  }
});
