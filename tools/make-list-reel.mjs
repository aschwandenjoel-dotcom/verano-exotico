#!/usr/bin/env node
/**
 * Nutzen-Reel: mehrere Produkte nacheinander unter einer Headline —
 * „5 Ferienbikinis unter CHF 40", „Welcher Schnitt für dich?" usw.
 *
 * Ablauf: Headline steht die ganze Zeit oben; ab 0.8 s erscheinen die
 * Produktkarten nacheinander (je 2.4 s, weich ein-/ausgeblendet) mit
 * Zähler, Produktname · Preis und optional einem Label pro Karte
 * („High-Waist · kaschiert den Bauch"). Unten der CTA-Balken.
 *
 * Aufruf:
 *   node tools/make-list-reel.mjs --clip .tmp/clips/x.mp4 \
 *        --title "5 Ferienbikinis" --sub "unter CHF 40." \
 *        --products a,b,c,d,e [--labels "Label A|Label B|…"] [--per 2.4] [--locale de] [--out …]
 *
 * Baut auf tools/make-reel.mjs auf (Design, Karten, Hintergrund).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import {
  COLOR, FONT, W, arg, backgroundChain, buildCard, drawtext, encodeArgs, loadProducts, mainImage, spaced,
} from "./make-reel.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const clip = arg("clip");
const slugs = arg("products", "").split(",").map((s) => s.trim()).filter(Boolean);
const title = arg("title");
const sub = arg("sub", "");
const labels = arg("labels", "").split("|").map((s) => s.trim());
const per = Number(arg("per", "2.4"));
const locale = arg("locale", "de") === "en" ? "en" : "de";
const cta = arg("cta", "verano-exotico.ch");
const eyebrow = arg("eyebrow", locale === "en" ? "VERANO EXOTICO · SWIMWEAR" : "VERANO EXOTICO · BADEMODE");
const out = arg("out", path.join(ROOT, ".tmp", "reels", `liste-${(title ?? "reel").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.mp4`));

if (!clip || !title || slugs.length === 0) {
  console.error('Nutzung: --clip <video> --title "…" --products a,b,c [--sub "…"] [--labels "a|b|c"]');
  process.exit(1);
}
for (const [k, f] of Object.entries(FONT)) if (!existsSync(f)) throw new Error(`Schrift fehlt (${k}): ${f}`);

const products = await loadProducts();
const picked = slugs.map((slug) => {
  const p = products.find((x) => x.slug === slug);
  if (!p) throw new Error(`Produkt nicht gefunden: ${slug}`);
  return p;
});

mkdirSync(path.dirname(out), { recursive: true });

// Zeitplan
const intro = 0.8;
const outro = 1.4;
const duration = Math.round((intro + picked.length * per + outro) * 10) / 10;
const fadeOut = duration - 0.6;

// Layout
const yEyebrow = 150;
const yHead = 210;
const ySub = 330;
const yCard = 500;
const yCta = 1740;

// Karten bauen (Standbilder mit Alpha)
const cards = [];
for (const p of picked) {
  const cardPath = path.join(path.dirname(out), `_card-${p.slug}.png`);
  cards.push({ product: p, path: cardPath, size: await buildCard(mainImage(p), cardPath) });
}
const cardH = cards[0].size.height;
const yName = yCard + cardH - 40;
const yLabel = yName + 52;

// ---------- Filtergraph ----------
const parts = [backgroundChain(duration)];
// Jede Karte: eigener Input, Ein-/Ausblendung im eigenen Zeitfenster
cards.forEach((c, i) => {
  const start = intro + i * per;
  const end = start + per;
  parts.push(
    `[${i + 1}:v]format=rgba,fade=t=in:st=${start}:d=0.3:alpha=1,fade=t=out:st=${(end - 0.3).toFixed(2)}:d=0.3:alpha=1,trim=duration=${duration},setpts=PTS-STARTPTS[c${i}]`
  );
});
// Karten nacheinander auf den Hintergrund legen (enable = nur im Zeitfenster)
let chain = "[bg]";
cards.forEach((c, i) => {
  const start = intro + i * per;
  const end = start + per;
  const outLabel = i === cards.length - 1 ? "[stack]" : `[s${i}]`;
  parts.push(`${chain}[c${i}]overlay=x=(W-w)/2:y=${yCard - 80}:shortest=1:enable='between(t,${start},${end})'${outLabel}`);
  chain = outLabel;
});

// Texte
const texts = [
  drawtext({ text: spaced(eyebrow), font: FONT.mono, size: 22, color: COLOR.gold, y: yEyebrow }),
  drawtext({ text: title.toUpperCase(), font: FONT.black, size: 96, color: COLOR.sand, y: yHead }),
];
if (sub) texts.push(drawtext({ text: sub, font: FONT.serifItalic, size: 92, color: COLOR.gold, y: ySub }));
cards.forEach((c, i) => {
  const start = intro + i * per;
  const end = start + per;
  const enable = `between(t,${start},${end})`;
  const name = c.product.name[locale];
  const price = `CHF ${Number(c.product.price).toFixed(2)}`;
  texts.push(drawtext({ text: `${i + 1} / ${cards.length}`, font: FONT.mono, size: 26, color: COLOR.gold, y: yCard - 60, x: W - 200, enable }));
  texts.push(drawtext({ text: `${name}  ·  ${price}`, font: FONT.mono, size: 30, color: COLOR.sand, y: yName, enable }));
  if (labels[i]) texts.push(drawtext({ text: labels[i], font: FONT.serifItalic, size: 44, color: COLOR.gold, y: yLabel, enable }));
});
texts.push(`drawbox=x=(iw-620)/2:y=${yCta}:w=620:h=96:color=0x${COLOR.gold}:t=fill`);
texts.push(drawtext({ text: spaced(cta.toUpperCase()), font: FONT.black, size: 30, color: COLOR.navy, y: yCta + 30 }));

parts.push(`[stack]${texts.join(",")},fade=t=in:st=0:d=0.5,fade=t=out:st=${fadeOut}:d=0.6,format=yuv420p[v]`);

const args = ["-y", "-hide_banner", "-loglevel", "error", "-i", clip];
for (const c of cards) args.push("-loop", "1", "-t", String(duration), "-i", c.path);
args.push("-filter_complex", parts.join(";"), "-map", "[v]", "-an", ...encodeArgs(out, duration));

execFileSync(ffmpegPath, args, { stdio: "inherit" });
console.log(`✅ ${path.relative(ROOT, out)}  (${title} ${sub} — ${picked.length} Produkte, ${duration}s)`);
