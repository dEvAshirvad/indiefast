import { cp, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const skipped = [
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  "graphify-out",
];

const skippedFiles = new Set([".env"]);

const dataDirs = [
  "docker/postgres_data",
  "docker/redis_data",
  "docker/minio_data",
  "docker/pgadmin_data",
  "docker/redisinsight_data",
];

export function shouldCopy(rel) {
  const path = rel.split("\\").join("/");
  if (!path || path === ".") return true;
  const parts = path.split("/");
  if (parts.some((part) => skipped.includes(part))) return false;
  if (skippedFiles.has(parts.at(-1) ?? "")) return false;
  if (dataDirs.some((dir) => path === dir || path.startsWith(`${dir}/`))) {
    return false;
  }
  return true;
}

const logo = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#111"/>
  <text x="32" y="40" text-anchor="middle" font-size="28" fill="#fff">IF</text>
</svg>
`;

const mark = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="14" fill="#111"/>
</svg>
`;

export async function copyTemplate(source, target) {
  await mkdir(target, { recursive: true });
  await cp(source, target, {
    recursive: true,
    filter(src) {
      const rel = relative(source, src);
      return shouldCopy(rel);
    },
  });
  const publicDir = join(target, "apps/web/public");
  await mkdir(publicDir, { recursive: true });
  await writeFile(join(publicDir, "logo.svg"), logo);
  await writeFile(join(publicDir, "logo-mark.svg"), mark);
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirect && process.argv.includes("--self-check")) {
  const assert = (await import("node:assert")).default;
  assert.equal(shouldCopy(".env"), false);
  assert.equal(shouldCopy(".env.example"), true);
  assert.equal(shouldCopy("docker/postgres_data/x"), false);
  assert.equal(shouldCopy("docker/pgadmin/entrypoint.sh"), true);
  assert.equal(shouldCopy("apps/api/src/index.ts"), true);
  assert.equal(shouldCopy("node_modules/foo"), false);
  console.log("create-indiefast self-check ok");
}

if (isDirect && !process.argv.includes("--self-check")) {
  const targetName = process.argv[2];
  if (!targetName) {
    console.error("usage: create-indiefast <directory>");
    process.exit(1);
  }
  const source = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  await copyTemplate(source, resolve(targetName));
  console.log(`copied IndieFast to ${targetName}`);
}
