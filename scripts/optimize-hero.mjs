import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const srcPath = path.join(root, "public", "givy-hero.jpg");

function loadSharp() {
  const candidates = [
    "sharp",
    "next/dist/compiled/sharp",
    path.join(root, "node_modules", "sharp"),
    path.join(root, "node_modules", "next", "node_modules", "sharp"),
  ];
  for (const id of candidates) {
    try {
      return require(id);
    } catch {
      /* try next */
    }
  }
  throw new Error("sharp not found — install sharp or run after npm install");
}

const sharp = loadSharp();
const input = fs.readFileSync(srcPath);
const meta = await sharp(input).metadata();
console.log("before", {
  bytes: input.length,
  width: meta.width,
  height: meta.height,
  format: meta.format,
});

const maxWidth = 1920;
const pipeline = sharp(input).rotate().resize({
  width: maxWidth,
  height: Math.round(maxWidth * ((meta.height || 1080) / (meta.width || 1920))),
  fit: "inside",
  withoutEnlargement: true,
});

const jpgBuffer = await pipeline
  .clone()
  .jpeg({ quality: 78, mozjpeg: true, progressive: true })
  .toBuffer();

const avifBuffer = await pipeline
  .clone()
  .avif({ quality: 55, effort: 4 })
  .toBuffer();

const webpBuffer = await pipeline
  .clone()
  .webp({ quality: 72 })
  .toBuffer();

const blur = await sharp(input)
  .resize(16, 16, { fit: "inside" })
  .jpeg({ quality: 40 })
  .toBuffer();
const blurDataURL = `data:image/jpeg;base64,${blur.toString("base64")}`;

fs.writeFileSync(srcPath, jpgBuffer);
fs.writeFileSync(path.join(root, "public", "givy-hero.avif"), avifBuffer);
fs.writeFileSync(path.join(root, "public", "givy-hero.webp"), webpBuffer);
fs.writeFileSync(
  path.join(root, "scripts", "hero-blur.json"),
  JSON.stringify(
    {
      blurDataURL,
      width: meta.width,
      height: meta.height,
      jpgBytes: jpgBuffer.length,
      avifBytes: avifBuffer.length,
      webpBytes: webpBuffer.length,
    },
    null,
    2,
  ),
);

console.log("after", {
  jpg: jpgBuffer.length,
  avif: avifBuffer.length,
  webp: webpBuffer.length,
  blurChars: blurDataURL.length,
});
