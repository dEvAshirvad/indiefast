import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./_client";

export type HealthData = { ok: true };

export type HealthEnvelope = {
  success: true;
  data: HealthData;
  meta: { requestId: string };
};

export const healthApi = {
  async get(): Promise<HealthEnvelope> {
    const response = await apiClient.get<HealthEnvelope>("/health");
    return response.data;
  },
};

export function useHealth() {
  return useQuery({ queryKey: ["health"], queryFn: healthApi.get });
}
