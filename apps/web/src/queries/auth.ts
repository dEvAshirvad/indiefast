"use client";

import type { Session, SigninInput, SignupInput } from "@indiefast/types/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./_client";

type BetterAuthSessionPayload = {
  user: { id: string; email: string; name: string | null; role?: string };
  session: { id: string; expiresAt: string | Date };
};

function toSession(payload: BetterAuthSessionPayload): Session {
  return {
    user: {
      id: payload.user.id,
      email: payload.user.email,
      name: payload.user.name ?? null,
      role: payload.user.role ?? "user",
    },
    session: {
      id: payload.session.id,
      expiresAt: new Date(payload.session.expiresAt).toISOString(),
    },
  };
}

export type Organization = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: string;
};

export const authApi = {
  async signupCredentials(input: SignupInput) {
    const response = await apiClient.post<BetterAuthSessionPayload>(
      "/api/auth/sign-up/email",
      input,
    );
    return toSession(response.data);
  },
  async signinCredentials(input: SigninInput) {
    const response = await apiClient.post<BetterAuthSessionPayload>(
      "/api/auth/sign-in/email",
      input,
    );
    return toSession(response.data);
  },
  async signinSocial(provider: "google" | "github") {
    const callbackURL = encodeURIComponent(window.location.origin);
    return {
      url: `/api/auth/sign-in/social?provider=${provider}&callbackURL=${callbackURL}`,
    };
  },
  async logout() {
    await apiClient.post("/api/auth/sign-out");
    return { ok: true };
  },
  async session() {
    const response = await apiClient.get<BetterAuthSessionPayload | null>(
      "/api/auth/get-session",
    );
    return response.data ? toSession(response.data) : null;
  },
  async org() {
    const response = await apiClient.get<Organization[]>(
      "/api/auth/organization/list",
    );
    return response.data;
  },
};

export function useSignupCredentials() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.signupCredentials,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

export function useSigninCredentials() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.signinCredentials,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

export function useSigninSocial() {
  return useMutation({ mutationFn: authApi.signinSocial });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

export function useSession() {
  return useQuery({ queryKey: ["session"], queryFn: authApi.session });
}

export function useOrg() {
  return useQuery({ queryKey: ["org"], queryFn: authApi.org });
}
