const successEnvelope = {
  type: "object",
  required: ["success", "data", "meta"],
  properties: {
    success: { type: "boolean", const: true },
    data: { type: "object" },
    meta: { $ref: "#/components/schemas/Meta" },
  },
} as const;

const errorEnvelope = {
  type: "object",
  required: ["success", "error", "meta"],
  properties: {
    success: { type: "boolean", const: false },
    error: {
      type: "object",
      required: ["code", "message"],
      properties: {
        code: { type: "string" },
        message: { type: "string" },
      },
    },
    meta: { $ref: "#/components/schemas/Meta" },
  },
} as const;

export const emailOpenApiPaths = {
  "/api/email/test": {
    post: {
      summary: "Enqueue a test email",
      operationId: "enqueueTestEmail",
      responses: {
        "201": {
          description: "The job is on the email queue.",
          content: { "application/json": { schema: successEnvelope } },
        },
        "401": {
          description: "Not signed in.",
          content: { "application/json": { schema: errorEnvelope } },
        },
        "422": {
          description: "Invalid body.",
          content: { "application/json": { schema: errorEnvelope } },
        },
      },
    },
  },
};
