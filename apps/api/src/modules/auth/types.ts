import type { Session, SigninInput, SignupInput } from "@indiefast/types/auth";

export type AuthSignupPayload = SignupInput;
export type AuthSigninPayload = SigninInput;
export type AuthSessionPayload = Session;

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};
