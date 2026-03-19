import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.join(__dirname, "../public/sbc.svg");
const outputDir = path.join(__dirname, "../public/startup");

const STARTUP_SPECS = [
  { width: 750, height: 1334 },
  { width: 1170, height: 2532 },
  { width: 1179, height: 2556 },
  { width: 1206, height: 2622 },
  { width: 1242, height: 2688 },
  { width: 1242, height: 2208 },
  { width: 1284, height: 2778 },
  { width: 1290, height: 2796 },
  { width: 1536, height: 2048 },
  { width: 1620, height: 2160 },
  { width: 1668, height: 2224 },
  { width: 1668, height: 2388 },
  { width: 2048, height: 2732 },
];

function startupName(width, height) {
  return `apple-launch-${width}x${height}.png`;
}

function createBackgroundSvg(width, height) {
  const glowRadiusA = Math.round(Math.max(width, height) * 0.45);
  const glowRadiusB = Math.round(Math.max(width, height) * 0.4);

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f8fbff"/>
          <stop offset="45%" stop-color="#ebf4ff"/>
          <stop offset="100%" stop-color="#f5fcff"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      <circle cx="${Math.round(width * 0.1)}" cy="${Math.round(height * 0.06)}" r="${glowRadiusA}" fill="rgba(8,119,251,0.28)"/>
      <circle cx="${Math.round(width * 0.9)}" cy="${Math.round(height * 0.08)}" r="${glowRadiusB}" fill="rgba(6,182,212,0.2)"/>
    </svg>
  `;
}

function createWordmarkSvg(width, height) {
  const fontSize = Math.round(Math.min(width, height) * 0.055);
  const y = Math.round(height * 0.7);

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="50%"
        y="${y}"
        text-anchor="middle"
        fill="#0b2140"
        font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif"
        font-size="${fontSize}"
        font-weight="700"
        letter-spacing="0.3"
      >Smart Business Center</text>
    </svg>
  `;
}

async function buildOne(width, height, logoBuffer) {
  const iconSize = Math.round(Math.min(width, height) * 0.22);
  const logoX = Math.round((width - iconSize) / 2);
  const logoY = Math.round(height * 0.36 - iconSize / 2);

  const backgroundBuffer = Buffer.from(createBackgroundSvg(width, height));
  const wordmarkBuffer = Buffer.from(createWordmarkSvg(width, height));

  const resizedLogo = await sharp(logoBuffer)
    .resize(iconSize, iconSize, { fit: "contain" })
    .png()
    .toBuffer();

  await sharp(backgroundBuffer)
    .composite([
      { input: resizedLogo, left: logoX, top: logoY },
      { input: wordmarkBuffer, left: 0, top: 0 },
    ])
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(outputDir, startupName(width, height)));
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  if (!fs.existsSync(logoPath)) {
    throw new Error(`Logo not found: ${logoPath}`);
  }

  const logoBuffer = fs.readFileSync(logoPath);
  const generated = new Set();

  const generateIfNeeded = async (width, height) => {
    const key = `${width}x${height}`;
    if (generated.has(key)) return;
    generated.add(key);
    await buildOne(width, height, logoBuffer);
    console.log(`Generated ${startupName(width, height)}`);
  };

  for (const spec of STARTUP_SPECS) {
    await generateIfNeeded(spec.width, spec.height);
    await generateIfNeeded(spec.height, spec.width);
  }

  console.log("Done generating iOS startup images.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
