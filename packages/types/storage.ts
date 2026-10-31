import { z } from "zod";

export const allowedUploadContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedUploadContentType =
  (typeof allowedUploadContentTypes)[number];

export function isAllowedUploadContentType(
  value: string,
): value is AllowedUploadContentType {
  return (allowedUploadContentTypes as readonly string[]).includes(value);
}

export const uploadIntentSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(allowedUploadContentTypes),
  sizeBytes: z.number().int().positive().max(10_485_760),
});

export const fileIdParamSchema = z.object({
  id: z.uuid(),
});

export const fileSchema = z.object({
  id: z.uuid(),
  ownerId: z.string().min(1),
  bucketKey: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  createdAt: z.string(),
});

export const uploadIntentResponseSchema = z.object({
  file: fileSchema,
  uploadUrl: z.string().min(1),
  expiresIn: z.literal(60),
});

export const fileResponseSchema = z.object({
  file: fileSchema,
  downloadUrl: z.string().min(1),
  expiresIn: z.literal(300),
});

export type UploadIntent = z.infer<typeof uploadIntentSchema>;
export type FileIdParam = z.infer<typeof fileIdParamSchema>;
export type StoredFile = z.infer<typeof fileSchema>;
export type UploadIntentResponse = z.infer<typeof uploadIntentResponseSchema>;
export type FileResponse = z.infer<typeof fileResponseSchema>;
