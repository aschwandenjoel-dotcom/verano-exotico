#!/usr/bin/env node
/**
 * Stellt das TikTok-Wochenpaket zusammen: Videos in Posting-Reihenfolge,
 * TikTok-taugliche Captions zum Kopieren, Termine und Sound-Vorschläge.
 * Joel lädt das Paket in TikTok Studio (Computer) hoch, wählt den Sound und
 * plant die Posts — TikTok veröffentlicht dann selbst.
 *
 * Warum kein Auto-Posting: Die TikTok-API veröffentlicht für nicht geprüfte
 * Apps nur privat, und die Prüfung schliesst Werkzeuge fürs eigene Konto aus
 * ("Not acceptable: A utility tool to help upload contents to the account(s)
 * you or your team manages"). Trend-Sounds lassen sich über keine API
 * anhängen. Planen in TikTok Studio geht bis 10 Tage im Voraus.
 *
 * Aufruf:
 *   node tools/tiktok-package.mjs --reels cumbre-leopard,liste-5-ferienbikinis-unter-40,safari-leopard
 *   node tools/tiktok-package.mjs --reels … --start 2026-10-12 --days mo,mi,fr --time 19:00
 *
 *   --reels   Namen der Reels in .tmp/reels (ohne .mp4) oder Pfade, Reihenfolge = Posting-Reihenfolge
 *   --start   erster möglicher Tag (Standard: morgen)
 *   --days    Wochentage für die Posts (Standard: mo,mi,fr)
 *   --time    Uhrzeit (Standard: 19:00, Schweizer Zeit)
 *
 * Quelle der Texte: die .md neben dem Video. Gibt es dort einen Abschnitt
 * "## TikTok", gilt er (Zeilen "Sounds: A | B" und optional "Caption:" mit
 * Text darunter). Sonst wird "## Caption DE" für TikTok umgebaut: Shop-URL
 * raus (Links sind in TikTok-Texten nicht klickbar), höchstens 5 Hashtags.
 *
 * Ausgabe: .tmp/tiktok/<datum-erster-post>/ mit PLAN.md, den Videos
 * (1_Mo-06-10_cumbre-leopard.mp4 …) und je einer .txt mit der Caption.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REELS = path.join(ROOT, ".tmp", "reels");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : fallback;
}

/** TikTok empfiehlt wenige, passende Hashtags — mehr wirkt wie Spam. */
const MAX_HASHTAGS = 5;
/** TikTok Studio plant höchstens 10 Tage im Voraus. */
const MAX_DAYS_AHEAD = 10;

const DAY_KEYS = { so: 0, mo: 1, di: 2, mi: 3, do: 4, fr: 5, sa: 6 };
const DAY_LABEL = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

const reelArg = arg("reels");
if (!reelArg) {
  console.error("Aufruf: node tools/tiktok-package.mjs --reels name1,name2,name3 [--start JJJJ-MM-TT] [--days mo,mi,fr] [--time 19:00]");
  process.exit(1);
}

const days = arg("days", "mo,mi,fr")
  .split(",")
  .map((d) => DAY_KEYS[d.trim().toLowerCase().slice(0, 2)]);
if (days.some((d) => d === undefined)) {
  console.error("❌ --days: Kürzel mo,di,mi,do,fr,sa,so");
  process.exit(1);
}
const time = arg("time", "19:00");
if (!/^\d{1,2}:\d{2}$/.test(time)) {
  console.error("❌ --time im Format 19:00");
  process.exit(1);
}

const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today.getTime() + 86400000);
const start = arg("start") ? new Date(`${arg("start")}T00:00:00`) : tomorrow;
if (Number.isNaN(start.getTime())) {
  console.error("❌ --start im Format JJJJ-MM-TT");
  process.exit(1);
}

// ---------- Reels einsammeln ----------
function resolveReel(name) {
  const base = name.replace(/\.(mp4|md)$/, "");
  const video = existsSync(`${base}.mp4`) ? path.resolve(`${base}.mp4`) : path.join(REELS, `${base}.mp4`);
  const md = video.replace(/\.mp4$/, ".md");
  if (!existsSync(video)) throw new Error(`Video nicht gefunden: ${path.relative(ROOT, video)}`);
  if (!existsSync(md)) throw new Error(`Caption-Datei fehlt: ${path.relative(ROOT, md)}`);
  return { name: path.basename(video, ".mp4"), video, md };
}

function section(text, title) {
  const m = text.match(new RegExp(`##\\s*${title}\\s*\\n+([\\s\\S]*?)(?=\\n##\\s|$)`));
  return m ? m[1].trim() : null;
}

/** Instagram-Caption → TikTok: Shop-URL raus, höchstens 5 Hashtags. */
function toTikTok(caption) {
  const lines = caption.split("\n");
  const tags = [];
  const body = [];
  for (const line of lines) {
    const words = line.trim().split(/\s+/);
    if (line.trim() && words.every((w) => w.startsWith("#"))) {
      tags.push(...words);
      continue;
    }
    if (/https?:\/\//.test(line)) {
      body.push("Link in Bio 🔗");
      continue;
    }
    body.push(line);
  }
  const text = body.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  // Auswahl: die zwei wichtigsten (stehen vorne), ein Schweiz-Tag für die
  // lokale Reichweite, ein Ferien-/Themen-Tag, dazu immer die eigene Marke.
  const unique = [...new Set(tags.map((t) => t.toLowerCase()))].filter((t) => t !== "#veranoexotico");
  const swiss = unique.find((t) => ["#schweiz", "#zürich", "#zurich", "#switzerland", "#swissbrand"].includes(t));
  const picked = unique.slice(0, 2);
  if (swiss && !picked.includes(swiss)) picked.push(swiss);
  for (const t of unique.slice(2)) {
    if (picked.length >= MAX_HASHTAGS - 1) break;
    // Fast gleiche Tags (#bikini/#bikinis) bringen nichts zusätzlich.
    if (!picked.includes(t) && !picked.some((p) => t.startsWith(p) || p.startsWith(t))) picked.push(t);
  }
  picked.push("#veranoexotico");
  return `${text}\n\n${picked.join(" ")}`;
}

function readTexts(md) {
  const text = readFileSync(md, "utf8");
  const tiktok = section(text, "TikTok");
  let caption = null;
  let sounds = [];
  if (tiktok) {
    const s = tiktok.match(/^Sounds?:\s*(.+)$/m);
    if (s) sounds = s[1].split("|").map((x) => x.trim()).filter(Boolean);
    const c = tiktok.match(/^Caption:\s*\n([\s\S]*)$/m);
    if (c) caption = c[1].trim();
  }
  if (!caption) {
    const de = section(text, "Caption DE");
    if (!de) throw new Error(`Weder "## TikTok" mit Caption noch "## Caption DE" in ${path.relative(ROOT, md)}`);
    caption = toTikTok(de);
  }
  return { caption, sounds };
}

function probe(video) {
  const ffprobe = require("ffprobe-static").path;
  const r = spawnSync(ffprobe, [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height:format=duration", "-of", "json", video,
  ]);
  const j = JSON.parse(r.stdout.toString() || "{}");
  return {
    width: j.streams?.[0]?.width,
    height: j.streams?.[0]?.height,
    duration: Number(j.format?.duration ?? 0),
  };
}

// ---------- Termine ----------
function slots(count) {
  const [h, m] = time.split(":").map(Number);
  const out = [];
  const d = new Date(start);
  while (out.length < count) {
    if (days.includes(d.getDay())) {
      const slot = new Date(d);
      slot.setHours(h, m, 0, 0);
      out.push(slot);
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const label = (d) => `${DAY_LABEL[d.getDay()]} ${pad(d.getDate())}.${pad(d.getMonth() + 1)}. ${pad(d.getHours())}:${pad(d.getMinutes())}`;

// ---------- Paket bauen ----------
try {
  const reels = reelArg.split(",").map((r) => resolveReel(r.trim()));
  const when = slots(reels.length);
  const outDir = path.join(ROOT, ".tmp", "tiktok", isoDate(when[0]));
  mkdirSync(outDir, { recursive: true });

  const warnings = [];
  const lastAllowed = new Date(today.getTime() + MAX_DAYS_AHEAD * 86400000);
  const entries = reels.map((reel, i) => {
    const slot = when[i];
    const { caption, sounds } = readTexts(reel.md);
    const info = probe(reel.video);
    const prefix = `${i + 1}_${DAY_LABEL[slot.getDay()]}-${pad(slot.getDate())}-${pad(slot.getMonth() + 1)}_${reel.name}`;

    copyFileSync(reel.video, path.join(outDir, `${prefix}.mp4`));
    writeFileSync(path.join(outDir, `${prefix}.txt`), `${caption}\n`);

    if (info.width && info.height && Math.abs(info.width / info.height - 9 / 16) > 0.01) {
      warnings.push(`${reel.name}: Format ${info.width}×${info.height} ist nicht 9:16 — TikTok zeigt Ränder.`);
    }
    if (info.duration && info.duration < 3) warnings.push(`${reel.name}: kürzer als 3 s — TikTok lehnt das ab.`);
    if (!sounds.length) warnings.push(`${reel.name}: keine Sound-Vorschläge — in der .md einen Abschnitt "## TikTok" mit "Sounds: …" ergänzen.`);
    if (slot > lastAllowed) {
      warnings.push(`${reel.name}: ${label(slot)} liegt mehr als ${MAX_DAYS_AHEAD} Tage voraus — erst später in TikTok Studio planen.`);
    }
    return { reel, slot, caption, sounds, info, prefix };
  });

  const plan = [
    `# TikTok-Paket ab ${label(when[0]).slice(3, 9)}`,
    "",
    "## So planst du die Woche (ca. 15–20 Minuten)",
    "",
    "1. Am Computer **tiktok.com/tiktokstudio** öffnen → links **Hochladen**.",
    "2. Video aus diesem Ordner hineinziehen (Reihenfolge = Nummer im Dateinamen).",
    "3. **Beschreibung:** Inhalt der gleichnamigen `.txt` einfügen.",
    "4. **Sound:** über *Bearbeiten → Sounds* einen der Vorschläge unten wählen. Nur Sounds aus der",
    "   kommerziellen Bibliothek sind für unser Business-Konto erlaubt — andere bietet TikTok gar nicht an.",
    "   Lautstärke des Original-Tons auf 0, falls das Video schon Musik hat.",
    "5. **Titelbild:** ein Bild wählen, auf dem Produkt und Preis gut lesbar sind.",
    "6. **Offenlegung von Inhalten:** *Werbeinhalte → Deine Marke* einschalten (wir bewerben eigene Produkte).",
    "7. Bei *Wann posten* **Planen** wählen, Datum und Uhrzeit aus der Tabelle eintragen → **Planen**.",
    "",
    "Geplante Posts lassen sich in TikTok nicht mehr bearbeiten, nur löschen und neu planen.",
    "",
    "| # | Termin | Video | Länge | Sound-Vorschläge |",
    "|---|---|---|---|---|",
    ...entries.map((e, i) =>
      `| ${i + 1} | ${label(e.slot)} | ${e.prefix}.mp4 | ${e.info.duration ? `${Math.round(e.info.duration)} s` : "?"} | ${e.sounds.join(" · ") || "—"} |`
    ),
    "",
    ...entries.flatMap((e, i) => [
      `## ${i + 1} · ${label(e.slot)} · ${e.reel.name}`,
      "",
      `**Sound-Vorschläge:** ${e.sounds.length ? e.sounds.join(" · ") : "—"}`,
      "",
      "```",
      e.caption,
      "```",
      "",
    ]),
  ];
  if (warnings.length) plan.push("## Hinweise", "", ...warnings.map((w) => `- ⚠️ ${w}`), "");
  writeFileSync(path.join(outDir, "PLAN.md"), plan.join("\n"));

  console.log(`📦 TikTok-Paket: ${path.relative(ROOT, outDir)}/`);
  for (const e of entries) console.log(`   ${label(e.slot)}  ${e.prefix}.mp4`);
  for (const w of warnings) console.log(`   ⚠️  ${w}`);
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exit(1);
}
