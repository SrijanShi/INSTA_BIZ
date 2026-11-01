#!/usr/bin/env node
/**
 * Mirrors every photo, video and poster referenced by src/content/*.json into
 * public/media, keeping the original paths so the content URLs stay valid.
 * Files that already exist are skipped, so the script is safe to re-run.
 *
 * Usage: node scripts/fetch-media.mjs [origin]
 *   origin defaults to https://puppy.instabizweb.com
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const origin = process.argv[2] ?? "https://puppy.instabizweb.com";
const root = new URL("..", import.meta.url).pathname;
const contentDir = join(root, "src/content");

// Collect every `url` string under a `/media/` path, at any depth.
const urls = new Set();
const visit = (value) => {
  if (Array.isArray(value)) value.forEach(visit);
  else if (value && typeof value === "object") {
    if (typeof value.url === "string" && value.url.startsWith("/media/")) urls.add(value.url);
    Object.values(value).forEach(visit);
  }
};
for (const file of readdirSync(contentDir).filter((f) => f.endsWith(".json"))) {
  visit(JSON.parse(readFileSync(join(contentDir, file), "utf8")));
}

let fetched = 0;
let bytes = 0;
const queue = [...urls].filter((url) => !existsSync(join(root, "public", url)));
console.log(`${urls.size} media files referenced, ${queue.length} to download`);

// A few parallel workers keep this quick without hammering the origin.
async function worker() {
  for (let url = queue.shift(); url; url = queue.shift()) {
    const res = await fetch(origin + url);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    const data = Buffer.from(await res.arrayBuffer());
    const dest = join(root, "public", url);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, data);
    fetched++;
    bytes += data.length;
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
console.log(`downloaded ${fetched} files (${(bytes / 1048576).toFixed(1)} MB)`);
