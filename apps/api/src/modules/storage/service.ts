import { isAllowedUploadContentType } from "@indiefast/types/storage";
import { AppError } from "../../configs/errors/api-error.js";
import { coreErrors } from "../../configs/errors/core-errors.js";
import { getStorage } from "../../configs/storage/s3.js";
import { fileRepository } from "./repository.js";

const maxSizeBytes = 10_485_760;

export type FileRecord = {
  id: string;
  ownerId: string;
  bucketKey: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
};

function basenameOf(filename: string) {
  const base = filename.split(/[/\\]/).pop()?.trim();
  return base && base.length > 0 ? base : "file";
}

function toFile(row: {
  id: string;
  ownerId: string;
  bucketKey: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  createdAt: Date;
}): FileRecord {
  return {
    id: row.id,
    ownerId: row.ownerId,
    bucketKey: row.bucketKey,
    filename: row.filename,
    contentType: row.contentType,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt.toISOString(),
  };
}

function notFound(): AppError {
  return new AppError({
    code: coreErrors.NOT_FOUND.code,
    status: coreErrors.NOT_FOUND.status,
    message: coreErrors.NOT_FOUND.message,
  });
}

async function ownedFile(id: string, ownerId: string) {
  const row = await fileRepository.findById(id);
  if (!row || row.ownerId !== ownerId) throw notFound();
  return row;
}

export const storageService = {
  async createUploadIntent(input: {
    ownerId: string;
    filename: string;
    contentType: string;
    sizeBytes: number;
  }) {
    if (!isAllowedUploadContentType(input.contentType)) {
      throw new AppError({
        code: coreErrors.BAD_REQUEST.code,
        status: coreErrors.BAD_REQUEST.status,
        message: "Unsupported content type",
      });
    }
    if (input.sizeBytes > maxSizeBytes) {
      throw new AppError({
        code: coreErrors.BAD_REQUEST.code,
        status: coreErrors.BAD_REQUEST.status,
        message: "File too large",
      });
    }
    const id = crypto.randomUUID();
    const filename = basenameOf(input.filename);
    const bucketKey = `${input.ownerId}/${id}/${filename}`;
    await fileRepository.insert({
      id,
      ownerId: input.ownerId,
      bucketKey,
      filename,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
    });
    const row = await fileRepository.findById(id);
    if (!row) throw notFound();
    const uploadUrl = await getStorage().presignPut({
      key: bucketKey,
      contentType: input.contentType,
      contentLength: input.sizeBytes,
    });
    return { file: toFile(row), uploadUrl, expiresIn: 60 as const };
  },

  async getForOwner(input: { id: string; ownerId: string }) {
    const row = await ownedFile(input.id, input.ownerId);
    const downloadUrl = await getStorage().presignGet({
      key: row.bucketKey,
      filename: row.filename,
    });
    return { file: toFile(row), downloadUrl, expiresIn: 300 as const };
  },

  async deleteForOwner(input: { id: string; ownerId: string }) {
    const row = await ownedFile(input.id, input.ownerId);
    await getStorage().deleteObject({ key: row.bucketKey });
    await fileRepository.deleteById(row.id);
  },
};
