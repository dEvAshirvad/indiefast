export const coreErrors = {
  INTERNAL: {
    code: "INTERNAL",
    status: 500,
    message: "Something went wrong",
  },
  NOT_FOUND: {
    code: "NOT_FOUND",
    status: 404,
    message: "Not found",
  },
  ORIGIN_NOT_ALLOWED: {
    code: "ORIGIN_NOT_ALLOWED",
    status: 403,
    message: "Origin not allowed",
  },
  RATE_LIMITED: {
    code: "RATE_LIMITED",
    status: 429,
    message: "Too many requests",
  },
  DATASTORE_UNAVAILABLE: {
    code: "DATASTORE_UNAVAILABLE",
    status: 503,
    message: "Datastore is unavailable",
  },
  EMAIL_NOT_CONFIGURED: {
    code: "EMAIL_NOT_CONFIGURED",
    status: 503,
    message: "Email provider is not configured",
  },
  EMAIL_SEND_FAILED: {
    code: "EMAIL_SEND_FAILED",
    status: 502,
    message: "Email provider rejected the message",
  },
  BAD_REQUEST: {
    code: "BAD_REQUEST",
    status: 400,
    message: "Bad request",
  },
  VALIDATION: {
    code: "VALIDATION",
    status: 422,
    message: "Validation failed",
  },
} as const;
