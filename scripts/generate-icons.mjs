// Renders the PWA PNG icons from the SVG sources. Run: node scripts/generate-icons.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../public/icons/", import.meta.url));
const jobs = [
  ["icon.svg", "icon-192.png", 192],
  ["icon.svg", "icon-512.png", 512],
  ["icon-maskable.svg", "icon-maskable-512.png", 512],
  ["icon-maskable.svg", "apple-touch-icon.png", 180],
];
for (const [src, out, size] of jobs) {
  await sharp(dir + src, { density: 384 }).resize(size, size).png().toFile(dir + out);
  console.log("wrote", out);
}
