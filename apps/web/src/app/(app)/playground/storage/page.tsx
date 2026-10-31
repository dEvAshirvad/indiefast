"use client";

import { allowedUploadContentTypes } from "@indiefast/types/storage";
import Image from "next/image";
import { useState } from "react";
import { useSession } from "../../../../queries/auth";
import {
  useDeleteFile,
  useFile,
  useUploadFile,
} from "../../../../queries/storage";

export default function StoragePlaygroundPage() {
  const session = useSession();
  const upload = useUploadFile();
  const [fileId, setFileId] = useState<string | null>(null);
  const file = useFile(fileId);
  const remove = useDeleteFile();

  if (!session.data) {
    return (
      <main>
        <h1>Storage playground</h1>
        <p>
          Sign in on <a href="/playground/auth">/playground/auth</a> first.
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Storage playground</h1>
      <input
        type="file"
        accept={allowedUploadContentTypes.join(",")}
        onChange={(event) => {
          const next = event.target.files?.[0];
          if (!next) return;
          upload.mutate(next, {
            onSuccess: (stored) => setFileId(stored.id),
          });
        }}
      />
      <div>
        <button
          type="button"
          disabled={!fileId || remove.isPending}
          onClick={() => {
            if (!fileId) return;
            remove.mutate(fileId, {
              onSuccess: () => setFileId(null),
            });
          }}
        >
          Delete
        </button>
      </div>
      {file.data?.downloadUrl ? (
        <>
          <div
            style={{
              position: "relative",
              width: "min(100%, 40rem)",
              aspectRatio: "4 / 3",
            }}
          >
            <Image
              src={file.data.downloadUrl}
              alt={file.data.file.filename}
              fill
              sizes="(max-width: 40rem) 100vw, 40rem"
              style={{ objectFit: "contain" }}
            />
          </div>
          <p>
            <a href={file.data.downloadUrl}>Download</a>
          </p>
        </>
      ) : null}
      <pre>{JSON.stringify(file.data ?? upload.data ?? null, null, 2)}</pre>
      {upload.error ? <p>{upload.error.message}</p> : null}
      {file.error ? <p>{file.error.message}</p> : null}
      {remove.error ? <p>{remove.error.message}</p> : null}
    </main>
  );
}
