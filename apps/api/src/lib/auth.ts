import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { openAPI, organization } from "better-auth/plugins";
import { getPostgres } from "../configs/db/postgres.js";
import { env } from "../configs/env.js";
import * as authSchema from "../modules/auth/model.js";
import { enqueueEmail } from "../modules/email/enqueue.js";

const socialProviders = {
  ...(env.googleClientId && env.googleClientSecret
    ? {
        google: {
          clientId: env.googleClientId,
          clientSecret: env.googleClientSecret,
        },
      }
    : {}),
  ...(env.githubClientId && env.githubClientSecret
    ? {
        github: {
          clientId: env.githubClientId,
          clientSecret: env.githubClientSecret,
        },
      }
    : {}),
};

export const auth = betterAuth({
  secret: env.authSecret,
  baseURL: `http://${env.appHost}:${env.port}/api/auth`,
  trustedOrigins: [env.webUrl],
  database: drizzleAdapter(getPostgres().db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await enqueueEmail({ to: user.email, template: "reset", url });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await enqueueEmail({ to: user.email, template: "verify", url });
    },
  },
  socialProviders,
  plugins: [openAPI(), organization()],
});
