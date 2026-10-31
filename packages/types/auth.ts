import { z } from "zod";

export const signupInputSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export const signinInputSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const sessionSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.email(),
    name: z.string().nullable(),
    role: z.string(),
  }),
  session: z.object({
    id: z.string(),
    expiresAt: z.string(),
  }),
});

export type SignupInput = z.infer<typeof signupInputSchema>;
export type SigninInput = z.infer<typeof signinInputSchema>;
export type Session = z.infer<typeof sessionSchema>;
