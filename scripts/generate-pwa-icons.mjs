import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const source = path.join(root, "assets/icon-source.png");
const iconsDir = path.join(root, "public/icons");
const appDir = path.join(root, "src/app");

const background = { r: 255, g: 255, b: 255, alpha: 1 };
const BLACK_THRESHOLD = 15;

async function replaceBlackBackground(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r <= BLACK_THRESHOLD && g <= BLACK_THRESHOLD && b <= BLACK_THRESHOLD) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      if (info.channels === 4) data[i + 3] = 255;
    }
  }

  return sharp(data, { raw: info }).png().toBuffer();
}

async function createSquareMaster() {
  const cleaned = await replaceBlackBackground(source);
  return sharp(cleaned)
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
  const maskableSource = await replaceBlackBackground(source);
  await sharp(maskableSource)
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

  const logoSource = await replaceBlackBackground(source);
  await sharp(logoSource)
    .resize(128, 128, { fit: "contain", background })
    .png()
    .toFile(path.join(root, "public/logo.png"));

  console.log("Generated PWA icons in public/icons, src/app, and public/logo.png");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
