"use client";

import type { Session } from "@indiefast/types/auth";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiClient } from "../queries/_client";
import { useSession } from "../queries/auth";

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  setSession: (value: Session | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const sessionQuery = useSession();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (sessionQuery.data !== undefined) {
      setSession(sessionQuery.data);
    }
  }, [sessionQuery.data]);

  useEffect(() => {
    const id = apiClient.interceptors.response.use(
      (response) => response,
      async (error: unknown) => {
        const status =
          typeof error === "object" &&
          error &&
          "response" in error &&
          typeof error.response === "object" &&
          error.response &&
          "status" in error.response
            ? (error.response.status as number | undefined)
            : undefined;
        if (status === 401) {
          setSession(null);
          await queryClient.invalidateQueries({ queryKey: ["session"] });
        }
        throw error;
      },
    );

    return () => {
      apiClient.interceptors.response.eject(id);
    };
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading: sessionQuery.isPending,
      setSession,
    }),
    [session, sessionQuery.isPending],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
