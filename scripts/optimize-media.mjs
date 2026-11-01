#!/usr/bin/env node
/**
 * Shrinks oversized JPEG originals in public/media in place (same path and
 * format, so content URLs stay valid). next/image already serves resized
 * variants; this only keeps the repository and source images lean.
 *
 * Usage: node scripts/optimize-media.mjs
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const MAX_EDGE = 2000;
const MIN_BYTES = 600 * 1024;
const mediaDir = new URL("../public/media", import.meta.url).pathname;

const files = readdirSync(mediaDir, { recursive: true })
  .map((f) => join(mediaDir, f))
  .filter((f) => /\.jpe?g$/i.test(f) && statSync(f).size > MIN_BYTES);

let saved = 0;
for (const file of files) {
  const input = readFileSync(file);
  const output = await sharp(input)
    .rotate() // respect EXIF orientation before metadata is stripped
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  if (output.length < input.length) {
    writeFileSync(file, output);
    saved += input.length - output.length;
  }
}
console.log(`optimized ${files.length} JPEGs, saved ${(saved / 1048576).toFixed(1)} MB`);
