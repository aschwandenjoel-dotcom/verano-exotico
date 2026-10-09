/**
 * Produktbilder im H&M-Stil: Packshot auf Weiss (Titelbild) + Model-Bild (beim Überfahren).
 *
 * Schritt 1 – Bilder umwandeln (lokal, danach committen und deployen):
 *   node tools/product-images.mjs convert --slug <slug> [--packshot <datei>] [--model <datei>]
 *   → public/products/<slug>-packshot.jpg  (auf weisses Quadrat erweitert, nichts abgeschnitten)
 *   → public/products/<slug>-model.jpg     (quadratisch, oben ausgerichtet, Kopf bleibt drin)
 *   Beide 1600×1600 mit IPTC-Kennzeichnung "KI-generiert" (Google Merchant Center verlangt sie).
 *
 * Schritt 2 – im Live-Shop eintragen (erst wenn die Dateien deployed sind):
 *   node tools/product-images.mjs apply --slug <slug> [--color <index>] [--dry-run]
 *   → color_images[index] = Packshot (das bisherige Farbbild rückt in die Galerie)
 *   → images = [Model-Bild, …bisherige Galerie]
 *   --color = Index der Farbe, die der Packshot zeigt (Default 0). Prüft vorher, dass beide
 *   Bilder live erreichbar sind, und sichert den alten Stand nach .tmp/.
 *
 * Schreibt über PATCH /api/products/<slug> (x-admin-key = ADMIN_PASSWORD aus .env.local).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import sharp from "sharp";

const ROOT = new URL("..", import.meta.url).pathname;
const SITE = process.env.SITE_URL ?? "https://verano-exotico.ch";
const SIZE = 1600;

// IPTC DigitalSourceType: Bild wurde von einer KI erzeugt
const AI_XMP =
  '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
  '<rdf:Description rdf:about="" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" ' +
  'Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia"/>' +
  "</rdf:RDF></x:xmpmeta>";

function env(key) {
  const txt = readFileSync(`${ROOT}.env.local`, "utf8");
  const line = txt.split("\n").find((l) => l.startsWith(key + "="));
  if (!line) throw new Error(`${key} fehlt in .env.local`);
  return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
}

const [cmd, ...rest] = process.argv.slice(2);
const arg = (name) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : undefined; };
const slug = arg("slug");
if (!["convert", "apply"].includes(cmd) || !slug) {
  console.error("Aufruf: node tools/product-images.mjs convert|apply --slug <slug> …  (Details im Kopf der Datei)");
  process.exit(1);
}
const packshotPath = `/products/${slug}-packshot.jpg`;
const modelPath = `/products/${slug}-model.jpg`;

if (cmd === "convert") {
  const packshot = arg("packshot");
  const model = arg("model");
  if (!packshot && !model) throw new Error("--packshot und/oder --model angeben");

  if (packshot) {
    // Auf weisses Quadrat erweitern statt zuschneiden – Träger und Bänder bleiben sichtbar
    const { width, height } = await sharp(packshot).metadata();
    const side = Math.round(Math.max(width, height) * 1.08); // etwas Weissraum rundherum
    const padX = Math.floor((side - width) / 2), padY = Math.floor((side - height) / 2);
    // Zwei Durchgänge: sharp verkleinert sonst immer vor dem Erweitern
    const square = await sharp(packshot)
      .flatten({ background: "#ffffff" })
      .extend({ left: padX, right: side - width - padX, top: padY, bottom: side - height - padY, background: "#ffffff" })
      .toBuffer();
    await sharp(square)
      .resize(SIZE, SIZE)
      .withXmp(AI_XMP)
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(`${ROOT}public${packshotPath}`);
    console.log(`🖼  public${packshotPath}`);
  }
  if (model) {
    // Quadrat von oben – Kopf und Pose bleiben, unten fällt der Kniebereich weg
    await sharp(model)
      .resize(SIZE, SIZE, { fit: "cover", position: "top" })
      .withXmp(AI_XMP)
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(`${ROOT}public${modelPath}`);
    console.log(`🖼  public${modelPath}`);
  }
  console.log("Nächster Schritt: committen + deployen, dann `apply`.");
  process.exit(0);
}

// ── apply ────────────────────────────────────────────────────────
const color = Number(arg("color") ?? 0);
const dryRun = rest.includes("--dry-run");
const hasPackshot = existsSync(`${ROOT}public${packshotPath}`);
const hasModel = existsSync(`${ROOT}public${modelPath}`);
if (!hasPackshot && !hasModel) throw new Error(`Keine Bilder für ${slug} in public/products/ – zuerst convert`);

for (const p of [hasPackshot && packshotPath, hasModel && modelPath].filter(Boolean)) {
  const r = await fetch(SITE + p, { method: "HEAD" });
  if (!r.ok) throw new Error(`${SITE}${p} ist nicht erreichbar (${r.status}) – erst deployen`);
}

const res = await fetch(`${SITE}/api/products/${slug}`);
if (!res.ok) throw new Error(`${slug}: Produkt nicht gefunden (${res.status})`);
const product = await res.json();
const colorImages = [...(product.colorImages ?? [])];
let images = [...(product.images ?? [])];

if (hasPackshot) {
  if (color >= Math.max(colorImages.length, 1)) throw new Error(`--color ${color} gibt es nicht (${colorImages.length} Farben)`);
  const old = colorImages[color];
  colorImages[color] = packshotPath;
  if (old && old !== packshotPath && !images.includes(old)) images.push(old);
}
if (hasModel) images = [modelPath, ...images.filter((s) => s !== modelPath)];

const body = { images, color_images: colorImages };
console.log(`${slug}${dryRun ? " (dry-run)" : ""}`);
console.log("  color_images:", JSON.stringify(colorImages));
console.log("  images:      ", JSON.stringify(images));
if (dryRun) process.exit(0);

mkdirSync(`${ROOT}.tmp`, { recursive: true });
const backup = `${ROOT}.tmp/product-images-backup-${slug}-${Date.now()}.json`;
writeFileSync(backup, JSON.stringify({ images: product.images, color_images: product.colorImages }, null, 2));
console.log(`  Backup: ${backup.replace(ROOT, "")}`);

const patch = await fetch(`${SITE}/api/products/${slug}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", "x-admin-key": env("ADMIN_PASSWORD") },
  body: JSON.stringify(body),
});
const out = await patch.json();
if (!patch.ok) throw new Error(`PATCH fehlgeschlagen (${patch.status}): ${JSON.stringify(out)}`);
console.log("  ✅ gespeichert");
