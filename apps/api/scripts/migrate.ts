import { fileURLToPath } from "node:url";
import { getPostgres, migratePostgres } from "../src/configs/db/postgres.js";
import { logger } from "../src/configs/logger/pino.js";

const migrationsFolder = fileURLToPath(
  new URL("../src/configs/db/migrations", import.meta.url),
);
const postgres = getPostgres();

try {
  await migratePostgres(postgres.db, migrationsFolder);
  logger.info("migrations applied");
} finally {
  await postgres.close();
}
