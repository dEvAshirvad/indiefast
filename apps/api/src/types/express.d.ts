import type { Session } from "@indiefast/types/auth";

declare global {
  namespace Express {
    interface Request {
      user?: Session["user"];
      session?: Session["session"];
    }

    interface Locals {
      requestId?: string;
    }

    interface Response {
      ok: <T>(data: T) => Response;
      created: <T>(data: T) => Response;
      fail: (
        status: number,
        error: { code: string; message: string },
      ) => Response;
    }
  }
}
