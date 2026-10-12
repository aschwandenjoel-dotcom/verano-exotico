/**
 * Doppelte Produktfotos aus der Galerie (Spalte `images`) entfernen.
 *
 * CJ liefert dasselbe Foto oft unter mehreren Dateinamen (…-1.jpg, …-c0.jpg,
 * …-2-fit.jpg) – auf der Produktseite stand es dann mehrfach untereinander.
 *
 * Nutzung:
 *   node tools/dedupe-product-images.mjs                       # Vorschau, schreibt nichts
 *   node tools/dedupe-product-images.mjs --apply               # im Live-Shop speichern
 *   node tools/dedupe-product-images.mjs --remove slug=datei.jpg,datei2.jpg --remove …
 *   node tools/dedupe-product-images.mjs --only slug1,slug2
 *
 * Automatisch erkannt werden exakte Kopien: Farb-Miniatur (32×32) mit mittlerer
 * Abweichung unter THRESHOLD gegenüber einem schon behaltenen Bild. Ausschnitte
 * oder Varianten desselben Fotos erkennt das nicht – die per --remove angeben
 * (nach Sichtkontrolle).
 *
 * Nie entfernt: Packshot, Model-Bild und Farbbilder (`color_images` bleibt
 * unverändert). Vor dem Schreiben Backup nach .tmp/. Schreibt über
 * PATCH /api/products/<slug> (x-admin-key = ADMIN_PASSWORD aus .env.local).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import sharp from "sharp";

const ROOT = new URL("..", import.meta.url).pathname;
const SITE = process.env.SITE_URL ?? "https://verano-exotico.ch";
// Mittlere Abweichung pro Farbkanal (0–255). Exakte Kopien liegen unter 1; schon
// ab ~2 kommen Varianten derselben Pose in anderer Farbe (z. B. Schwarz/Dunkelblau)
const THRESHOLD = 1;

function env(key) {
  const txt = readFileSync(`${ROOT}.env.local`, "utf8");
  const line = txt.split("\n").find((l) => l.startsWith(key + "="));
  if (!line) throw new Error(`${key} fehlt in .env.local`);
  return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
}

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const onlyArg = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const only = onlyArg ? new Set(onlyArg.split(",")) : null;
const manual = {};
args.forEach((a, i) => {
  if (a !== "--remove") return;
  const [slug, files] = args[i + 1].split("=");
  manual[slug] = new Set(files.split(",").map((f) => `/products/${f}`));
});

const thumbs = new Map();
async function thumb(src) {
  if (!thumbs.has(src)) {
    const file = `${ROOT}public${src}`;
    thumbs.set(src, existsSync(file)
      ? await sharp(file).resize(32, 32, { fit: "fill" }).removeAlpha().raw().toBuffer()
      : null);
  }
  return thumbs.get(src);
}
const diff = (a, b) => a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / a.length;
const isProtected = (src) => src.includes("-packshot") || src.includes("-model");

let list = await (await fetch(`${SITE}/api/products`)).json();
list = list.products ?? list;
const changes = [];

for (const p of list) {
  if (only && !only.has(p.slug)) continue;
  const colorImages = (p.colorImages ?? []).filter(Boolean);
  const images = p.images ?? [];
  const kept = [];
  const removed = [];
  // Farbbilder gelten als schon behalten – Galeriebilder, die eine Kopie davon sind, fliegen raus
  const reference = [...colorImages];
  for (const src of images) {
    if (isProtected(src)) { kept.push(src); reference.push(src); continue; }
    // Von Hand entfernte Bilder bleiben Vergleichsbasis – sonst überlebt eine Kopie davon
    if (manual[p.slug]?.has(src)) { removed.push(`${src} (von Hand)`); reference.push(src); continue; }
    if (kept.includes(src) || colorImages.includes(src)) { removed.push(`${src} (gleicher Pfad)`); continue; }
    const t = await thumb(src);
    let dup = null;
    if (t) for (const r of reference) {
      const rt = await thumb(r);
      if (rt && diff(t, rt) < THRESHOLD) { dup = r; break; }
    }
    if (dup) { removed.push(`${src} (= ${dup.split("/").pop()})`); continue; }
    kept.push(src);
    reference.push(src);
  }
  const unknownManual = [...(manual[p.slug] ?? [])].filter((s) => !images.includes(s));
  if (unknownManual.length) console.warn(`⚠ ${p.slug}: nicht in images: ${unknownManual.join(", ")}`);
  if (removed.length) changes.push({ slug: p.slug, before: images, after: kept, removed });
}

for (const c of changes) {
  console.log(`${c.slug}: ${c.before.length} → ${c.after.length}`);
  for (const r of c.removed) console.log(`   − ${r}`);
}
console.log(`\n${changes.length} Produkte betroffen${apply ? "" : " (Vorschau – mit --apply speichern)"}`);
if (!apply || !changes.length) process.exit(0);

mkdirSync(`${ROOT}.tmp`, { recursive: true });
const backup = `${ROOT}.tmp/dedupe-images-backup-${Date.now()}.json`;
writeFileSync(backup, JSON.stringify(Object.fromEntries(changes.map((c) => [c.slug, { images: c.before }])), null, 2));
console.log(`Backup: ${backup.replace(ROOT, "")}`);
const key = env("ADMIN_PASSWORD");
for (const c of changes) {
  const res = await fetch(`${SITE}/api/products/${c.slug}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-admin-key": key },
    body: JSON.stringify({ images: c.after }),
  });
  console.log(`${res.ok ? "✅" : "❌"} ${c.slug}${res.ok ? "" : ` (${res.status}: ${await res.text()})`}`);
}
