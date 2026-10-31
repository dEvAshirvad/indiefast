import { drizzle } from "drizzle-orm/node-postgres/driver";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { env } from "../env.js";
import { AppError } from "../errors/api-error.js";
import { coreErrors } from "../errors/core-errors.js";
import { logger } from "../logger/pino.js";

const { Pool } = pg;

export function createPostgres(
  host: string,
  port: number,
  user: string,
  password: string,
  database: string,
) {
  const pool = new Pool({
    host,
    port,
    user,
    password,
    database,
    max: 10,
    connectionTimeoutMillis: 2_000,
    application_name: "indiefast",
  });
  pool.on("error", (error) => {
    logger.error({ err: error }, "postgres pool error");
  });
  const db = drizzle(pool);

  return {
    db,
    async ping() {
      let client: pg.PoolClient | undefined;
      try {
        client = await pool.connect();
        await client.query("select 1");
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError({
          code: coreErrors.DATASTORE_UNAVAILABLE.code,
          status: coreErrors.DATASTORE_UNAVAILABLE.status,
          message: "Postgres is unavailable",
        });
      } finally {
        client?.release();
      }
    },
    async close() {
      await pool.end();
    },
  };
}

let singleton: ReturnType<typeof createPostgres> | undefined;

export function getPostgres() {
  singleton ??= createPostgres(
    env.databaseHost,
    env.databasePort as number,
    env.databaseUser,
    env.databasePassword,
    env.databaseName,
  );
  return singleton;
}

export function migratePostgres(
  db: ReturnType<typeof createPostgres>["db"],
  migrationsFolder: string,
) {
  return migrate(db, { migrationsFolder });
}
