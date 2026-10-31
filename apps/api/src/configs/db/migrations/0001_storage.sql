CREATE TABLE "file" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_id" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "bucket_key" text NOT NULL,
  "filename" text NOT NULL,
  "content_type" text NOT NULL,
  "size_bytes" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "file_bucket_key_unique" ON "file" ("bucket_key");
CREATE INDEX "file_owner_idx" ON "file" ("owner_id");
