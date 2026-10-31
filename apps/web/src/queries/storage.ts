"use client";

import {
  type FileResponse,
  isAllowedUploadContentType,
  type StoredFile,
  type UploadIntent,
  type UploadIntentResponse,
} from "@indiefast/types/storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./_client";

type Envelope<T> = {
  success: true;
  data: T;
  meta: { requestId: string };
};

export const storageApi = {
  async createUploadIntent(input: UploadIntent) {
    const response = await apiClient.post<Envelope<UploadIntentResponse>>(
      "/api/storage/uploads",
      input,
    );
    return response.data.data;
  },
  async getFile(id: string) {
    const response = await apiClient.get<Envelope<FileResponse>>(
      `/api/storage/files/${id}`,
    );
    return response.data.data;
  },
  async deleteFile(id: string) {
    const response = await apiClient.delete<Envelope<{ ok: true }>>(
      `/api/storage/files/${id}`,
    );
    return response.data.data;
  },
};

async function uploadFile(file: File): Promise<StoredFile> {
  if (!isAllowedUploadContentType(file.type)) {
    throw new Error("Unsupported content type");
  }
  const contentType = file.type;
  const intent = await storageApi.createUploadIntent({
    filename: file.name,
    contentType,
    sizeBytes: file.size,
  });
  const put = await fetch(intent.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(file.size),
    },
    body: file,
    mode: "cors",
  });
  if (!put.ok) {
    throw new Error(`MinIO PUT failed (${put.status})`);
  }
  return intent.file;
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadFile,
    onSuccess: async (file) => {
      await queryClient.invalidateQueries({ queryKey: ["file", file.id] });
    },
  });
}

export function useFile(id: string | null) {
  return useQuery({
    queryKey: ["file", id],
    queryFn: () => storageApi.getFile(id as string),
    enabled: Boolean(id),
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: storageApi.deleteFile,
    onSuccess: async (_data, id) => {
      await queryClient.invalidateQueries({ queryKey: ["file", id] });
    },
  });
}
