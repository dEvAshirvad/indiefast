import axios from "axios";
import { env } from "../lib/env";

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  config.headers.set("x-request-id", crypto.randomUUID());
  return config;
});
