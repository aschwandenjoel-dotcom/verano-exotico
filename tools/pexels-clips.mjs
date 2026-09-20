#!/usr/bin/env node
/**
 * Lädt lizenzfreie Hochkant-Videoclips von Pexels als Stimmungs-Hintergrund
 * für Reels (tools/make-reel.mjs).
 *
 * Pexels-Lizenz: kommerzielle Nutzung erlaubt, keine Namensnennung nötig.
 * NICHT erlaubt: gezeigte Personen als Werbeträger für das eigene Produkt
 * darstellen. Deshalb hier nur Motive OHNE Menschen verwenden (Wellen,
 * Palmen, Sand, Poolwasser, Himmel) — siehe workflows/social_reels.md.
 *
 * Voraussetzung: PEXELS_API_KEY in .env.local (kostenlos: pexels.com/api).
 *
 * Aufruf:
 *   node tools/pexels-clips.mjs --query "ocean waves aerial" [--count 5] [--min 6] [--out .tmp/clips]
 *   node tools/pexels-clips.mjs --preset            # lädt den Standard-Motivsatz
 *
 * Jeder Download wird in .tmp/clips/index.json mit Pexels-ID, URL und
 * Urheber:in festgehalten — als Nachweis, woher das Material stammt.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// .env.local einlesen (wie tools/nanobanana.mjs)
const envPath = path.join(ROOT, ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) {
  console.error("PEXELS_API_KEY fehlt — in .env.local eintragen (kostenlos unter https://www.pexels.com/api/).");
  process.exit(1);
}

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : fallback;
}
const OUT = path.resolve(ROOT, arg("out", ".tmp/clips"));
const COUNT = Number(arg("count", "5"));
const MIN_DURATION = Number(arg("min", "6"));

/** Motive ohne Menschen, passend zur Bildsprache der Seite (Goldene Stunde, Atlantik, Palmen). */
const PRESET = [
  "ocean waves aerial",
  "palm trees sky sunset",
  "beach sand water golden hour",
  "swimming pool water surface",
  "tropical beach turquoise water",
  "sunset sea horizon",
];

const queries = process.argv.includes("--preset") ? PRESET : [arg("query")].filter(Boolean);
if (queries.length === 0) {
  console.error("Nutzung: --query <suchbegriff> | --preset");
  process.exit(1);
}

const indexPath = path.join(OUT, "index.json");
const index = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, "utf8")) : {};

/** Beste Hochkant-Datei: mind. 1080x1920 bevorzugt, sonst die grösste Hochkant-Variante. */
function pickFile(video) {
  const portrait = video.video_files.filter((f) => f.file_type === "video/mp4" && f.height > f.width);
  const hd = portrait.filter((f) => f.width >= 1080 && f.height >= 1920).sort((a, b) => a.width - b.width);
  if (hd.length) return hd[0];
  return portrait.sort((a, b) => b.width - a.width)[0] ?? null;
}

async function search(query, perPage) {
  const url = new URL("https://api.pexels.com/videos/search");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", "portrait");
  url.searchParams.set("size", "medium");
  url.searchParams.set("per_page", String(perPage));
  const res = await fetch(url, { headers: { Authorization: API_KEY } });
  if (res.status === 429) throw new Error("Pexels Rate-Limit (200 Anfragen/Stunde) — später erneut versuchen.");
  if (!res.ok) throw new Error(`Pexels: HTTP ${res.status}`);
  return (await res.json()).videos ?? [];
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download: HTTP ${res.status}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

mkdirSync(OUT, { recursive: true });
let total = 0;
for (const query of queries) {
  const slug = query.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  // Etwas mehr abfragen als nötig, weil kurze Clips und Querformat aussortiert werden
  const videos = await search(query, Math.min(COUNT * 3, 30));
  let got = 0;
  for (const v of videos) {
    if (got >= COUNT) break;
    if (v.duration < MIN_DURATION) continue;
    const file = pickFile(v);
    if (!file) continue;
    const dest = path.join(OUT, `${slug}-${v.id}.mp4`);
    if (!existsSync(dest)) {
      process.stdout.write(`↓ ${path.basename(dest)} (${file.width}x${file.height}, ${v.duration}s) … `);
      await download(file.link, dest);
      console.log("ok");
    }
    index[path.basename(dest)] = {
      pexelsId: v.id,
      query,
      url: v.url,
      author: v.user?.name,
      authorUrl: v.user?.url,
      width: file.width,
      height: file.height,
      duration: v.duration,
      license: "Pexels License — https://www.pexels.com/license/",
    };
    got++;
    total++;
  }
  console.log(`${query}: ${got} Clip(s)`);
}
writeFileSync(indexPath, JSON.stringify(index, null, 2));
console.log(`\n✅ ${total} Clip(s) in ${path.relative(ROOT, OUT)} — Nachweis in index.json`);
