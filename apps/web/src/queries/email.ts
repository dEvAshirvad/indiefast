"use client";

import type { EmailTestInput } from "@indiefast/types/email";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "./_client";

type Envelope<T> = {
  success: true;
  data: T;
  meta: { requestId: string };
};

export const emailApi = {
  async sendTest(input: EmailTestInput) {
    const response = await apiClient.post<Envelope<{ queued: true }>>(
      "/api/email/test",
      input,
    );
    return response.data.data;
  },
};

export function useSendTestEmail() {
  return useMutation({
    mutationFn: emailApi.sendTest,
  });
}
