import type { IncomingHttpHeaders } from "node:http";
import type { Session } from "@indiefast/types/auth";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";
import { serializeUser } from "./serializer.js";

export async function getRequestSession(
  requestHeaders: IncomingHttpHeaders,
): Promise<Session | null> {
  const result = await auth.api.getSession({
    headers: fromNodeHeaders(requestHeaders),
  });
  if (!result) return null;

  return {
    user: serializeUser({
      id: result.user.id,
      email: result.user.email,
      name: result.user.name ?? null,
      role: (result.user as { role?: string }).role ?? "user",
    }),
    session: {
      id: result.session.id,
      expiresAt: result.session.expiresAt.toISOString(),
    },
  };
}
