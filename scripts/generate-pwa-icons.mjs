import sharp from "sharp";
import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const source = path.join(
  root,
  "assets/icon-source.png"
);
const iconsDir = path.join(root, "public/icons");
const appDir = path.join(root, "src/app");

const background = { r: 240, g: 253, b: 244, alpha: 1 };

async function createSquareMaster() {
  return sharp(source)
    .resize(1024, 1024, {
      fit: "contain",
      background,
    })
    .png()
    .toBuffer();
}

async function main() {
  await mkdir(iconsDir, { recursive: true });

  const master = await createSquareMaster();
  await sharp(master).png().toFile(path.join(iconsDir, "icon-1024.png"));

  const sizes = [16, 32, 180, 192, 512];
  for (const size of sizes) {
    await sharp(master)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon-${size}.png`));
  }

  const maskableContentSize = 340;
  await sharp(master)
    .resize(maskableContentSize, maskableContentSize, {
      fit: "contain",
      background,
    })
    .extend({
      top: 86,
      bottom: 86,
      left: 86,
      right: 86,
      background,
    })
    .png()
    .toFile(path.join(iconsDir, "icon-maskable-512.png"));

  await sharp(master).resize(512, 512).png().toFile(path.join(appDir, "icon.png"));
  await sharp(master).resize(180, 180).png().toFile(path.join(appDir, "apple-icon.png"));

  console.log("Generated PWA icons in public/icons and src/app");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
