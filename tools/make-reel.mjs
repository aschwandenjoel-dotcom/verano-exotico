#!/usr/bin/env node
/**
 * Baut ein 9:16-Reel (1080x1920) aus einem Stimmungs-Clip, einem Produktbild
 * und Text im Markendesign der Website (Farben/Schriften aus VTLanding.tsx).
 *
 * Aufbau des Videos:
 *   - Hintergrund: der Clip, auf 9:16 zugeschnitten, langsamer Zoom, leicht
 *     abgedunkelt, damit Text und Produkt lesbar bleiben
 *   - Oben: Mono-Kleintext (Eyebrow) + zweizeilige Headline
 *     (Zeile 1 Archivo Black creme, Zeile 2 DM Serif kursiv gold — wie der Hero)
 *   - Mitte: Produktkarte (abgerundet, Schatten), blendet nach 0.5 s ein
 *   - Unten: Produktname · Preis, goldener CTA-Balken mit der Domain
 *   - Ein-/Ausblendung am Anfang und Ende, optional Musik
 *
 * Aufruf:
 *   node tools/make-reel.mjs --clip .tmp/clips/ocean.mp4 --product tanga-leopard \
 *        --out .tmp/reels/tanga-leopard.mp4 [--headline "Ferien in Sicht?" --sub "Dein Bikini wartet."]
 *        [--duration 8] [--locale de|en] [--music pfad.mp3] [--cta verano-exotico.ch]
 *
 * Produktdaten kommen von der Live-API (verano-exotico.ch/api/products) und
 * werden in .tmp/products.json zwischengespeichert; das Produktbild aus
 * public/products/. Kein API-Key nötig.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FONTS = path.join(ROOT, "assets", "fonts");
const FONT = {
  black: path.join(FONTS, "ArchivoBlack-Regular.ttf"),
  serifItalic: path.join(FONTS, "DMSerifDisplay-Italic.ttf"),
  mono: path.join(FONTS, "GeistMono[wght].ttf"),
};
// Markenfarben (globals.css / VTLanding.tsx)
const COLOR = { sand: "F8F3E8", navy: "1A3040", gold: "D4AF37" };
const W = 1080;
const H = 1920;
const FPS = 30;
const PRODUCTS_API = "https://verano-exotico.ch/api/products";
const FEED_URL = "https://verano-exotico.ch/feed/google.xml";
const PRODUCTS_CACHE = path.join(ROOT, ".tmp", "products.json");

// ---------- CLI ----------
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : fallback;
}
const clip = arg("clip");
const slug = arg("product");
const out = arg("out", path.join(ROOT, ".tmp", "reels", `${slug}.mp4`));
const duration = Number(arg("duration", "8"));
const locale = arg("locale", "de") === "en" ? "en" : "de";
const music = arg("music");
const cta = arg("cta", "verano-exotico.ch");
const headline = arg("headline", locale === "en" ? "Golden Days," : "Ferien in Sicht?");
const sub = arg("sub", locale === "en" ? "Timeless Wear." : "Dein Bikini wartet.");
const eyebrow = arg("eyebrow", locale === "en" ? "VERANO EXOTICO · SWIMWEAR" : "VERANO EXOTICO · BADEMODE");

if (!clip || !slug) {
  console.error("Nutzung: --clip <video> --product <slug> [--out <mp4>]");
  process.exit(1);
}
for (const [k, f] of Object.entries(FONT)) {
  if (!existsSync(f)) throw new Error(`Schrift fehlt (${k}): ${f}`);
}

// ---------- Produktdaten ----------
/**
 * Namen (de/en) und Preis aus /api/products, das Hauptbild aus dem Produktfeed
 * (/feed/google.xml) — der Feed kennt auch die Farbbilder, die /api/products
 * nicht ausliefert, und ist exakt das, was Google und Pinterest zeigen.
 */
async function loadProducts() {
  if (existsSync(PRODUCTS_CACHE)) {
    const cached = JSON.parse(readFileSync(PRODUCTS_CACHE, "utf8"));
    if (Date.now() - Number(cached.fetchedAt ?? 0) < 6 * 3600 * 1000) return cached.products;
  }
  const [apiRes, feedRes] = await Promise.all([fetch(PRODUCTS_API), fetch(FEED_URL)]);
  if (!apiRes.ok) throw new Error(`Produkt-API: HTTP ${apiRes.status}`);
  if (!feedRes.ok) throw new Error(`Feed: HTTP ${feedRes.status}`);
  const products = await apiRes.json();
  const feed = await feedRes.text();

  // Pro item_group_id (= Slug) das erste image_link merken
  const imageBySlug = new Map();
  for (const item of feed.split("<item>").slice(1)) {
    const group = item.match(/<g:item_group_id>([^<]+)</)?.[1] ?? item.match(/<g:id>([^<]+)</)?.[1];
    const image = item.match(/<g:image_link>([^<]+)</)?.[1];
    if (group && image && !imageBySlug.has(group)) imageBySlug.set(group, image);
  }
  for (const p of products) p.feedImage = imageBySlug.get(p.slug) ?? null;

  mkdirSync(path.dirname(PRODUCTS_CACHE), { recursive: true });
  writeFileSync(PRODUCTS_CACHE, JSON.stringify({ fetchedAt: Date.now(), products }));
  return products;
}

/** Feed-Bild-URL → lokale Datei unter public/ (schneller und verlustfrei). */
function mainImage(product) {
  if (product.feedImage) {
    const rel = product.feedImage.replace(/^https?:\/\/[^/]+/, "");
    const abs = path.join(ROOT, "public", rel);
    if (existsSync(abs)) return abs;
  }
  throw new Error(`Kein Produktbild für ${product.slug}`);
}

// ---------- Produktkarte (PNG mit Alpha) ----------
async function buildCard(imagePath, cardPath) {
  const cardW = 800;
  const cardH = 1000;
  const radius = 28;
  const img = await sharp(imagePath).resize(cardW, cardH, { fit: "cover", position: "top" }).toBuffer();
  const mask = Buffer.from(
    `<svg width="${cardW}" height="${cardH}"><rect x="0" y="0" width="${cardW}" height="${cardH}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`
  );
  const rounded = await sharp(img).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();

  // Weicher Schatten: dunkle Fläche, unscharf, unter die Karte gelegt
  const pad = 80;
  const shadow = await sharp(
    Buffer.from(
      `<svg width="${cardW + pad * 2}" height="${cardH + pad * 2}"><rect x="${pad}" y="${pad + 24}" width="${cardW}" height="${cardH}" rx="${radius}" fill="#0A1A26" fill-opacity="0.55"/></svg>`
    )
  )
    .blur(28)
    .png()
    .toBuffer();

  await sharp({ create: { width: cardW + pad * 2, height: cardH + pad * 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: shadow, left: 0, top: 0 },
      { input: rounded, left: pad, top: pad },
    ])
    .png()
    .toFile(cardPath);
  return { width: cardW + pad * 2, height: cardH + pad * 2 };
}

// ---------- ffmpeg ----------
/** drawtext-Sonderzeichen escapen (Doppelpunkt, Backslash, Apostroph, Prozent). */
function esc(text) {
  return String(text).replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\\\\\'").replace(/%/g, "%%");
}
/** Buchstabenabstand wie im Web (letter-spacing) — drawtext kennt das nicht, Leerzeichen tun es. */
function spaced(text) {
  return text.split("").join(" ");
}

/**
 * Schriftgrösse so wählen, dass der Text in `maxWidth` passt. drawtext kann
 * nicht automatisch umbrechen oder verkleinern; die mittlere Zeichenbreite
 * (Anteil der Schriftgrösse) ist pro Schrift geschätzt.
 */
const AVG_CHAR = { [FONT.black]: 0.68, [FONT.serifItalic]: 0.44, [FONT.mono]: 0.6 };
function fitSize(text, font, size, maxWidth = W - 120) {
  const est = text.length * (AVG_CHAR[font] ?? 0.6) * size;
  return est <= maxWidth ? size : Math.floor((size * maxWidth) / est);
}

function drawtext({ text, font, size, color, y, x = "(w-text_w)/2", alpha = 1, start = 0 }) {
  size = fitSize(text, font, size);
  const a = start > 0 ? `alpha='if(lt(t,${start}),0,min(1,(t-${start})/0.5))'` : `alpha=${alpha}`;
  return `drawtext=fontfile='${font}':text='${esc(text)}':fontsize=${size}:fontcolor=0x${color}:x=${x}:y=${y}:${a}`;
}

async function main() {
  const products = await loadProducts();
  const product = products.find((p) => p.slug === slug);
  if (!product) throw new Error(`Produkt nicht gefunden: ${slug}`);
  const name = product.name[locale];
  const price = `CHF ${Number(product.price).toFixed(2)}`;

  mkdirSync(path.dirname(out), { recursive: true });
  const cardPath = path.join(path.dirname(out), `_card-${slug}.png`);
  const card = await buildCard(mainImage(product), cardPath);

  // Layout (y-Positionen in px auf 1920)
  const yEyebrow = 150;
  const yHead = 210;
  const ySub = 330;
  const yCard = 500;
  const yName = yCard + card.height - 40;
  const yCta = 1740;

  const fadeOut = Math.max(0, duration - 0.6);
  // Hintergrund: auf 9:16 zuschneiden (cover), dann langsamer Zoom über die
  // ganze Laufzeit. zoompan mit d=1 verarbeitet jeden Videoframe einzeln; der
  // Zoomfaktor hängt an der Eingangsframe-Nummer `in`, nicht am pro Frame
  // zurückgesetzten `zoom`. Danach leicht abdunkeln + Vignette für Lesbarkeit.
  const totalFrames = duration * FPS;
  const bg = [
    `[0:v]trim=duration=${duration},setpts=PTS-STARTPTS,fps=${FPS}`,
    `scale=w='if(gt(a,${W}/${H}),-2,${W})':h='if(gt(a,${W}/${H}),${H},-2)':flags=lanczos`,
    `crop=${W}:${H}`,
    `zoompan=z='1+0.10*in/${totalFrames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${W}x${H}:fps=${FPS}`,
    `eq=brightness=-0.10:saturation=1.05`,
    `vignette=angle=PI/4[bg]`,
  ].join(",");

  // Produktkarte: Standbild als Video, Einblendung ab 0.5 s
  const cardIn = `[1:v]format=rgba,fade=t=in:st=0.5:d=0.6:alpha=1,trim=duration=${duration},setpts=PTS-STARTPTS[card]`;

  const texts = [
    drawtext({ text: spaced(eyebrow), font: FONT.mono, size: 22, color: COLOR.gold, y: yEyebrow }),
    drawtext({ text: headline.toUpperCase(), font: FONT.black, size: 96, color: COLOR.sand, y: yHead }),
    drawtext({ text: sub, font: FONT.serifItalic, size: 92, color: COLOR.gold, y: ySub }),
    drawtext({ text: `${name}  ·  ${price}`, font: FONT.mono, size: 30, color: COLOR.sand, y: yName, start: 1.2 }),
    // CTA-Balken
    `drawbox=x=(iw-620)/2:y=${yCta}:w=620:h=96:color=0x${COLOR.gold}:t=fill`,
    drawtext({ text: spaced(cta.toUpperCase()), font: FONT.black, size: 30, color: COLOR.navy, y: yCta + 30 }),
  ].join(",");

  const compose = `[bg][card]overlay=x=(W-w)/2:y=${yCard - 80}:shortest=1,${texts},fade=t=in:st=0:d=0.5,fade=t=out:st=${fadeOut}:d=0.6,format=yuv420p[v]`;

  const filter = [bg, cardIn, compose].join(";");

  const args = ["-y", "-hide_banner", "-loglevel", "error", "-i", clip, "-loop", "1", "-t", String(duration), "-i", cardPath];
  if (music) args.push("-i", music);
  args.push("-filter_complex", filter, "-map", "[v]");
  if (music) args.push("-map", "2:a", "-af", `afade=t=in:st=0:d=1,afade=t=out:st=${fadeOut}:d=0.6`, "-c:a", "aac", "-b:a", "160k", "-shortest");
  else args.push("-an");
  args.push("-t", String(duration), "-r", String(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out);

  execFileSync(ffmpegPath, args, { stdio: "inherit" });
  console.log(`✅ ${path.relative(ROOT, out)}  (${name}, ${price})`);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
