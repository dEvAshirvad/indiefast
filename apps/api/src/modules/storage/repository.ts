import { eq } from "drizzle-orm";
import { getPostgres } from "../../configs/db/postgres.js";
import { file } from "./model.js";

export type FileInsert = {
  id: string;
  ownerId: string;
  bucketKey: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
};

export const fileRepository = {
  async insert(row: FileInsert) {
    await getPostgres().db.insert(file).values(row);
  },

  async findById(id: string) {
    const rows = await getPostgres()
      .db.select()
      .from(file)
      .where(eq(file.id, id))
      .limit(1);
    return rows[0];
  },

  async deleteById(id: string) {
    await getPostgres().db.delete(file).where(eq(file.id, id));
  },
};
