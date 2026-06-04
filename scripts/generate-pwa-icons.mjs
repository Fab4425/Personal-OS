/**
 * Erzeugt icon-192.png und icon-512.png aus public/icon.svg
 * Ausführen: npm run icons
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const svgPath = path.join(root, "public", "icon.svg");

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Bitte zuerst: npm install -D sharp");
    process.exit(1);
  }

  if (!fs.existsSync(svgPath)) {
    console.error("public/icon.svg fehlt");
    process.exit(1);
  }

  const svg = fs.readFileSync(svgPath);
  for (const size of [192, 512]) {
    const out = path.join(root, "public", `icon-${size}.png`);
    await sharp(svg).resize(size, size).png().toFile(out);
    console.log("OK", out);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
