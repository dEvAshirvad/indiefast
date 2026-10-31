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

export const storageOpenApiPaths = {
  "/api/storage/uploads": {
    post: {
      summary: "Create an upload intent",
      operationId: "createUploadIntent",
      responses: {
        "201": {
          description: "Presigned PUT URL and file row.",
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
  "/api/storage/files/{id}": {
    get: {
      summary: "Get a file and a presigned GET URL",
      operationId: "getFile",
      responses: {
        "200": {
          description: "File metadata and download URL.",
          content: { "application/json": { schema: successEnvelope } },
        },
        "401": {
          description: "Not signed in.",
          content: { "application/json": { schema: errorEnvelope } },
        },
        "404": {
          description: "Missing or not owned.",
          content: { "application/json": { schema: errorEnvelope } },
        },
      },
    },
    delete: {
      summary: "Delete a file",
      operationId: "deleteFile",
      responses: {
        "200": {
          description: "Object and row removed.",
          content: { "application/json": { schema: successEnvelope } },
        },
        "401": {
          description: "Not signed in.",
          content: { "application/json": { schema: errorEnvelope } },
        },
        "404": {
          description: "Missing or not owned.",
          content: { "application/json": { schema: errorEnvelope } },
        },
      },
    },
  },
};
