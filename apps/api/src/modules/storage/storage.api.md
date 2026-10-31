# Storage API

The API authorizes. MinIO carries the bytes. MinIO does not virus-scan.

`contentType` must be one of `image/jpeg`, `image/png`, `image/webp`, `image/gif`. No SVG. The allowlist is the declared MIME only — a renamed binary with `Content-Type: image/jpeg` still PUTs.

## Endpoints

- `POST /api/storage/uploads` — session required. Body: `{ filename, contentType, sizeBytes }`. Returns `{ file, uploadUrl, expiresIn: 60 }`. PUT the file to `uploadUrl` with those `Content-Type` and `Content-Length` headers.
- `GET /api/storage/files/:id` — session required. Owner only. Returns `{ file, downloadUrl, expiresIn: 300 }`. The GET URL is `Content-Disposition: inline` so a browser can view the image. A missing id or another user's id is 404.
- `DELETE /api/storage/files/:id` — session required. Owner only. Deletes the object, then the row.

Max `sizeBytes` is 10485760. The browser never POSTs the file to Express.

App OpenAPI: `GET /api/openapi.json`. Reference UI: `GET /api/reference`.
