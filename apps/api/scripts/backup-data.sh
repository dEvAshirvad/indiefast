#!/bin/sh
# Postgres only. MinIO objects and Redis keys are not in this file.
set -eu
out="${1:-backup.sql}"
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "$out"
echo "wrote $out"
