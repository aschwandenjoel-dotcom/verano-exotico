#!/usr/bin/env node
/**
 * Erzeugt eine Serie von Reels aus dem Katalog: pro Produkt ein Video
 * (tools/make-reel.mjs) plus eine Markdown-Datei mit Caption (DE + EN) und
 * Hashtags zum Kopieren. Clips und Headline-Varianten rotieren, damit die
 * Serie nicht uniform aussieht.
 *
 * Aufruf:
 *   node tools/make-reels-batch.mjs [--count 10] [--products slug1,slug2] [--locale de|en]
 *                                   [--clips .tmp/clips] [--out .tmp/reels] [--music pfad.mp3] [--new]
 *
 *   --products  feste Auswahl; sonst die zuletzt hinzugefügten Produkte
 *   --new       nur Produkte mit isNew (Headline "Neu im Shop")
 *
 * Voraussetzung: Clips in .tmp/clips (tools/pexels-clips.mjs --preset).
 * Ergebnis: .tmp/reels/<slug>.mp4 + .tmp/reels/<slug>.md + .tmp/reels/INDEX.md
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : fallback;
}
const COUNT = Number(arg("count", "10"));
const LOCALE = arg("locale", "de") === "en" ? "en" : "de";
const CLIPS = path.resolve(ROOT, arg("clips", ".tmp/clips"));
const OUT = path.resolve(ROOT, arg("out", ".tmp/reels"));
const MUSIC = arg("music");
const ONLY_NEW = process.argv.includes("--new");
const PICK = arg("products", "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** Headline-Paare wie im Hero: Zeile 1 versal, Zeile 2 kursiv gold. */
const HEADLINES = {
  de: [
    ["Ferien in Sicht?", "Dein Bikini wartet."],
    ["Golden Days,", "Timeless Wear."],
    ["Sommer", "das ganze Jahr."],
    ["Malediven-ready", "in 5–14 Tagen."],
    ["Pack ihn ein.", "Der Rest kommt von selbst."],
    ["Winter hier,", "Sommer dort."],
  ],
  en: [
    ["Holiday booked?", "Your bikini's waiting."],
    ["Golden Days,", "Timeless Wear."],
    ["Summer,", "all year long."],
    ["Beach-ready", "in 5–14 days."],
    ["Pack it.", "The rest takes care of itself."],
    ["Winter here,", "summer there."],
  ],
};
const NEW_HEADLINE = { de: ["Neu im Shop", "für deine Ferien."], en: ["New in", "for your getaway."] };

const HASHTAGS =
  "#bikini #bademode #swimwear #bikinis #ferien #winterflucht #malediven #thailand #kanaren #dubai #schweiz #swissbrand #veranoexotico #beachwear #bikinilove #summervibes #goldenhour";

function caption(product, locale) {
  const name = product.name[locale];
  const price = `CHF ${Number(product.price).toFixed(2)}`;
  const url = `https://verano-exotico.ch/${locale}/product/${product.slug}`;
  if (locale === "en") {
    return `${name} — ${price}\n\nHoliday booked? Then all that's missing is the bikini. Sizes S–L, delivery in 5–14 working days, pay by card or TWINT.\n\n→ ${url} (link in bio)`;
  }
  return `${name} — ${price}\n\nFerien gebucht? Dann fehlt nur noch der Bikini. Grössen S–L, Lieferung in 5–14 Werktagen, Zahlung per Karte oder TWINT.\n\n→ ${url} (Link in Bio)`;
}

// ---------- Eingaben prüfen ----------
const clips = existsSync(CLIPS)
  ? readdirSync(CLIPS)
      .filter((f) => f.endsWith(".mp4") && !f.startsWith("_"))
      .sort()
      .map((f) => path.join(CLIPS, f))
  : [];
if (clips.length === 0) {
  console.error(`Keine Clips in ${path.relative(ROOT, CLIPS)} — zuerst: node tools/pexels-clips.mjs --preset`);
  process.exit(1);
}

const cache = path.join(ROOT, ".tmp", "products.json");
if (!existsSync(cache)) {
  // make-reel.mjs legt den Cache an — einmal "trocken" aufrufen wäre umständlich,
  // deshalb hier dieselbe Quelle direkt laden.
  const res = await fetch("https://verano-exotico.ch/api/products");
  if (!res.ok) throw new Error(`Produkt-API: HTTP ${res.status}`);
  mkdirSync(path.dirname(cache), { recursive: true });
  writeFileSync(cache, JSON.stringify({ fetchedAt: 0, products: await res.json() }));
}
let products = JSON.parse(readFileSync(cache, "utf8")).products;
if (PICK.length) {
  products = PICK.map((slug) => products.find((p) => p.slug === slug)).filter(Boolean);
} else {
  if (ONLY_NEW) products = products.filter((p) => p.isNew);
  products = products.slice().reverse().slice(0, COUNT); // API liefert älteste zuerst → neueste nach vorn
}
if (products.length === 0) {
  console.error("Keine passenden Produkte.");
  process.exit(1);
}

// ---------- Rendern ----------
mkdirSync(OUT, { recursive: true });
const rows = [];
products.forEach((product, i) => {
  const clip = clips[i % clips.length];
  const [headline, sub] = ONLY_NEW || product.isNew ? NEW_HEADLINE[LOCALE] : HEADLINES[LOCALE][i % HEADLINES[LOCALE].length];
  const out = path.join(OUT, `${product.slug}${LOCALE === "en" ? "-en" : ""}.mp4`);
  const args = [
    path.join(ROOT, "tools", "make-reel.mjs"),
    "--clip", clip,
    "--product", product.slug,
    "--out", out,
    "--locale", LOCALE,
    "--headline", headline,
    "--sub", sub,
  ];
  if (MUSIC) args.push("--music", MUSIC);
  execFileSync(process.execPath, args, { stdio: "inherit" });

  const md = `# ${product.name[LOCALE]}\n\n**Video:** ${path.basename(out)}  \n**Clip:** ${path.basename(clip)} (Pexels, siehe .tmp/clips/index.json)  \n**Headline:** ${headline} ${sub}\n\n## Caption DE\n\n${caption(product, "de")}\n\n## Caption EN\n\n${caption(product, "en")}\n\n## Hashtags\n\n${HASHTAGS}\n`;
  writeFileSync(out.replace(/\.mp4$/, ".md"), md);
  rows.push(`| ${product.name[LOCALE]} | CHF ${Number(product.price).toFixed(2)} | ${path.basename(out)} | ${headline} ${sub} |`);
});

writeFileSync(
  path.join(OUT, "INDEX.md"),
  `# Reels — ${new Date().toISOString().slice(0, 10)}\n\n| Produkt | Preis | Datei | Headline |\n|---|---|---|---|\n${rows.join("\n")}\n\nCaptions und Hashtags: je eine .md neben dem Video.\n`
);
console.log(`\n✅ ${rows.length} Reel(s) in ${path.relative(ROOT, OUT)} — Übersicht in INDEX.md`);
