#!/usr/bin/env node
/**
 * Erzeugt Instagram-Assets aus public/images/brand-logo.png.
 *
 * Quelle: 1408x768, cremefarbener Hintergrund mit feiner Leinenstruktur.
 * Die Bounding-Boxen unten wurden per Pixelanalyse aus der Quelle ermittelt.
 *
 * Der Quellhintergrund hat eine leichte Vignette - ein Rechteck daraus auf eine
 * einfarbige Flaeche zu setzen hinterlaesst eine sichtbare Kante. Deshalb wird
 * das Logo zuerst komplett freigestellt (Alpha aus dem Farbabstand zum Creme)
 * und erst dann skaliert und auf eine flache Flaeche gesetzt.
 *
 * Aufruf: node tools/make-instagram-assets.mjs
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const SRC = 'public/images/brand-logo.png';
const OUT_DIR = 'assets/instagram';

const BLEED = 4; // schmaler Rand, damit weiche Logokanten nicht abgeschnitten werden
const BG = { r: 248, g: 249, b: 244, alpha: 1 }; // Creme der Ausgabeflaeche

// Freistellen: unterhalb von ALPHA_LO gilt ein Pixel als Hintergrund (deckt die
// Leinenstruktur ab, die um bis zu ~4 Stufen schwankt), ab ALPHA_HI als Logo.
const KEY = [248, 249, 244];
const ALPHA_LO = 8;
const ALPHA_HI = 30;

// Bounding-Boxen in der Quelle (left, top, width, height)
const BLOCKS = {
  // Nur die Bildmarke: Sonne + Palmwedel + Hibiskus
  mark: { left: 543, top: 118, width: 322, height: 284 },
  // Bildmarke + "VERANO EXOTICO" (ohne Claim)
  wordmark: { left: 445, top: 118, width: 519, height: 486 },
  // Komplettes Logo inkl. "EXPERIENCE THE TROPICS"
  full: { left: 445, top: 118, width: 519, height: 534 },
};

/**
 * Stellt das Logo frei: Alpha ergibt sich aus dem groessten Kanalabstand zum
 * Cremeton, weich interpoliert zwischen ALPHA_LO und ALPHA_HI. Die RGB-Werte
 * bleiben unveraendert - da die Ausgabeflaeche denselben Cremeton hat, sehen
 * die weichen Logokanten danach genauso aus wie im Original.
 */
async function cutoutLogo() {
  const { data, info } = await sharp(SRC)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  const rgba = Buffer.allocUnsafe(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    const r = data[p * 3];
    const g = data[p * 3 + 1];
    const b = data[p * 3 + 2];
    const delta = Math.max(
      Math.abs(r - KEY[0]),
      Math.abs(g - KEY[1]),
      Math.abs(b - KEY[2]),
    );
    const t = (delta - ALPHA_LO) / (ALPHA_HI - ALPHA_LO);
    rgba[p * 4] = r;
    rgba[p * 4 + 1] = g;
    rgba[p * 4 + 2] = b;
    rgba[p * 4 + 3] = Math.round(255 * Math.min(1, Math.max(0, t)));
  }
  return { data: rgba, width, height };
}

/** Schneidet einen Block mit Bleed aus, begrenzt auf die Bildkanten. */
function cutout(src, block) {
  const left = Math.max(0, block.left - BLEED);
  const top = Math.max(0, block.top - BLEED);
  const width = Math.min(src.width - left, block.width + 2 * BLEED);
  const height = Math.min(src.height - top, block.height + 2 * BLEED);
  return { left, top, width, height };
}

/**
 * Skaliert einen Block so, dass er `fit` der kuerzeren Canvas-Kante einnimmt,
 * und setzt ihn mittig (optional vertikal versetzt) auf die Canvas.
 */
async function compose(logo, { name, block, canvas, fit, offsetY = 0 }) {
  const rect = cutout(logo, block);
  const base = Math.min(canvas.width, canvas.height);
  const scale = (base * fit) / Math.max(block.width, block.height);

  const piece = await sharp(logo.data, {
    raw: { width: logo.width, height: logo.height, channels: 4 },
  })
    .extract(rect)
    .resize({ width: Math.round(rect.width * scale), kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer({ resolveWithObject: true });

  const left = Math.round((canvas.width - piece.info.width) / 2);
  const top = Math.round((canvas.height - piece.info.height) / 2 + offsetY);

  const file = `${OUT_DIR}/${name}.png`;
  await sharp({
    create: { width: canvas.width, height: canvas.height, channels: 3, background: BG },
  })
    .composite([{ input: piece.data, left, top }])
    .png({ compressionLevel: 9 })
    .toFile(file);

  return { file, canvas: `${canvas.width}x${canvas.height}` };
}

const SQUARE = (n) => ({ width: n, height: n });
const STORY = { width: 1080, height: 1920 };

const JOBS = [
  // Profilbild: nur die Bildmarke, damit sie im Kreis lesbar bleibt.
  { name: 'profilbild-marke', block: BLOCKS.mark, canvas: SQUARE(640), fit: 0.62 },
  // Alternative mit Wortmarke - im Kreis kleiner, aber mit Namen.
  { name: 'profilbild-wortmarke', block: BLOCKS.wordmark, canvas: SQUARE(640), fit: 0.6 },
  // Feed-Post: komplettes Logo inkl. Claim.
  { name: 'post-quadratisch', block: BLOCKS.full, canvas: SQUARE(1080), fit: 0.6 },
  // Story: Logo leicht nach oben versetzt, damit unten Platz fuer Sticker bleibt.
  { name: 'story', block: BLOCKS.full, canvas: STORY, fit: 0.62, offsetY: -160 },
  // Highlight-Cover: Story-Format, Marke exakt mittig. Instagram schneidet daraus
  // einen Kreis von rund 735 px Durchmesser - fit 0.5 fuellt ihn mit Rand aus.
  { name: 'highlight-cover', block: BLOCKS.mark, canvas: STORY, fit: 0.5 },
];

await mkdir(OUT_DIR, { recursive: true });
const logo = await cutoutLogo();
for (const job of JOBS) {
  const res = await compose(logo, job);
  console.log(`${res.canvas.padEnd(10)} ${res.file}`);
}
