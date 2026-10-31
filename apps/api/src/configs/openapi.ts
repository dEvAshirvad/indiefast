import { emailOpenApiPaths } from "../modules/email/openapi.js";
import { storageOpenApiPaths } from "../modules/storage/openapi.js";
import { env } from "./env.js";

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

const successEnvelope = {
  type: "object",
  required: ["success", "data", "meta"],
  properties: {
    success: { type: "boolean", const: true },
    data: { type: "object" },
    meta: { $ref: "#/components/schemas/Meta" },
  },
} as const;

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "IndieFast API",
    version: "0.0.0",
    description: "Production-grade Express API for the IndieFast starter pack.",
  },
  servers: [{ url: `http://${env.appHost}:${env.port}` }],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        operationId: "health",
        responses: {
          "200": {
            description: "The process is up.",
            content: {
              "application/json": { schema: successEnvelope },
            },
          },
        },
      },
    },
    "/": {
      get: {
        summary: "Service info",
        operationId: "root",
        responses: {
          "200": {
            description: "The process is running.",
            content: {
              "application/json": { schema: successEnvelope },
            },
          },
        },
      },
    },
    ...storageOpenApiPaths,
    ...(env.emailApiEnabled ? emailOpenApiPaths : {}),
  },
  components: {
    schemas: {
      Meta: {
        type: "object",
        required: ["requestId"],
        properties: {
          requestId: { type: "string", format: "uuid" },
        },
      },
      SuccessEnvelope: successEnvelope,
      ErrorEnvelope: errorEnvelope,
    },
  },
} as const;
