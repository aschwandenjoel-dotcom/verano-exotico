/**
 * Produktbilder im H&M-Stil: Packshot auf Weiss (Titelbild) + Model-Bild (beim Überfahren).
 *
 * Schritt 1 – Bilder umwandeln (lokal, danach committen und deployen):
 *   node tools/product-images.mjs convert --slug <slug> [--color <index>] [--packshot <datei>] [--model <datei>]
 *   Ab der zweiten Farbe (--color 1, 2 …) heissen die Dateien <slug>-c<index>-packshot.jpg /
 *   <slug>-c<index>-model.jpg; die erste Farbe behält <slug>-packshot.jpg / <slug>-model.jpg.
 *   --indexed: auch Farbe 0 als <slug>-c0-… speichern (wenn <slug>-packshot.jpg schon zu
 *   einer anderen Farbe gehört und nicht überschrieben werden darf).
 *   → public/products/<slug>-packshot.jpg  (auf 4:5 erweitert, nichts abgeschnitten)
 *   → public/products/<slug>-model.jpg     (4:5 wie die Produktkarte, Kopf bis Fuss bleibt drin)
 *   Beide 1600×2000 mit IPTC-Kennzeichnung "KI-generiert" (Google Merchant Center verlangt sie).
 *
 * Hintergrund weiss ziehen (bestehende Packshots reparieren):
 *   node tools/product-images.mjs whiten --slug <slug>|--all
 *   Gemini liefert Packshots oft auf hellgrauem Grund; zusammen mit dem angesetzten
 *   Rand ergibt das einen sichtbaren Kasten (Shop-Kachel, Google Shopping). `convert`
 *   macht das seit 13.10.2026 automatisch.
 *
 * Schritt 2 – im Live-Shop eintragen (erst wenn die Dateien deployed sind):
 *   node tools/product-images.mjs apply --slug <slug> [--color <index>] [--dry-run]
 *   → color_images[index] = Packshot (das bisherige Farbbild rückt in die Galerie)
 *   → images = [Model-Bild, …bisherige Galerie] – bei weiteren Farben kommt das
 *     Model-Bild ans Ende (die Karte zeigt beim Überfahren das Model der ersten Farbe)
 *   --color = Index der Farbe, die der Packshot zeigt (Default 0). Prüft vorher, dass beide
 *   Bilder live erreichbar sind, und sichert den alten Stand nach .tmp/.
 *
 * Schreibt über PATCH /api/products/<slug> (x-admin-key = ADMIN_PASSWORD aus .env.local).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import sharp from "sharp";

const ROOT = new URL("..", import.meta.url).pathname;
const SITE = process.env.SITE_URL ?? "https://verano-exotico.ch";
const W = 1600, H = 2000; // 4:5 – Format der Produktkarten

// IPTC DigitalSourceType: Bild wurde von einer KI erzeugt
const AI_XMP =
  '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
  '<rdf:Description rdf:about="" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" ' +
  'Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia"/>' +
  "</rdf:RDF></x:xmpmeta>";

/**
 * Zieht den Hintergrund eines Packshots auf reines Weiss: Hintergrundfarbe aus
 * dem Bildrand schätzen, alle Kanäle so strecken, dass sie 255 wird, und fast
 * weisse Pixel ganz weiss setzen. Das Produkt wird dabei nur so stark
 * aufgehellt, wie der Grund grau war (meist 2–6 %). Träger und Bänder bleiben
 * erhalten — es wird nichts freigestellt.
 */
async function whiteBackground(input) {
  const { data, info } = await sharp(input).flatten({ background: "#ffffff" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  // Hintergrund = Median der Randpixel (je Kanal)
  const samples = [[], [], []];
  const take = (x, y) => { const i = (y * w + x) * 3; for (let c = 0; c < 3; c++) samples[c].push(data[i + c]); };
  for (let x = 0; x < w; x += 4) { take(x, 2); take(x, h - 3); }
  for (let y = 0; y < h; y += 4) { take(2, y); take(w - 3, y); }
  const med = samples.map((a) => a.sort((p, q) => p - q)[a.length >> 1]);
  // Weisses Produkt? Dann nicht aufhellen — es verschwände im weissen Grund
  // (Häkel-, Sol-, Duna-Bikini). Zurück kommt null, der Aufrufer behält den Grund.
  let n = 0, lum = 0;
  for (let i = 0; i < data.length; i += 3 * 7) {
    const d = Math.abs(data[i] - med[0]) + Math.abs(data[i + 1] - med[1]) + Math.abs(data[i + 2] - med[2]);
    if (d > 36) { n++; lum += (data[i] + data[i + 1] + data[i + 2]) / 3; }
  }
  if (n && lum / n > 205) return null;
  const gain = med.map((m) => 255 / Math.max(m, 200));
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 3) {
    let mn = 255;
    for (let c = 0; c < 3; c++) { const v = Math.min(255, Math.round(data[i + c] * gain[c])); out[i + c] = v; if (v < mn) mn = v; }
    // weicher Übergang: ab 244 schrittweise, ab 250 ganz weiss (keine harte Kante)
    if (mn >= 244) { const k = Math.min(1, (mn - 244) / 6); for (let c = 0; c < 3; c++) out[i + c] = Math.round(out[i + c] + (255 - out[i + c]) * k); }
  }
  return sharp(out, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer();
}

/**
 * 4:5-Ausschnitt aus einem höheren Bild (z. B. 3:4), wenn das Produkt mit
 * mindestens 3 % Luft oben und unten hineinpasst — sonst null. Das Produkt
 * wird über die Abweichung vom Grund (Median der Randpixel) gefunden.
 */
async function cropToFormat(input, width, height) {
  const targetH = Math.round(width * (H / W));
  if (targetH >= height) return null; // nicht höher als 4:5 → nichts zu beschneiden
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const at = (x, y, c) => data[(y * w + x) * 3 + c];
  const edge = [[], [], []];
  for (let x = 0; x < w; x += 4) for (const y of [2, h - 3]) for (let c = 0; c < 3; c++) edge[c].push(at(x, y, c));
  const bg = edge.map((a) => a.sort((p, q) => p - q)[a.length >> 1]);
  let top = -1, bottom = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x += 2) {
      const d = Math.abs(at(x, y, 0) - bg[0]) + Math.abs(at(x, y, 1) - bg[1]) + Math.abs(at(x, y, 2) - bg[2]);
      if (d > 36) { if (top < 0) top = y; bottom = y; break; }
    }
  }
  if (top < 0) return null;
  const margin = Math.round(height * 0.03);
  if (bottom - top + 2 * margin > targetH) return null; // Produkt zu hoch → erweitern
  const center = Math.round((top + bottom) / 2);
  const y0 = Math.min(Math.max(center - Math.round(targetH / 2), 0), height - targetH);
  if (top - y0 < margin || y0 + targetH - bottom < margin) return null;
  return sharp(input).extract({ left: 0, top: y0, width, height: targetH }).png().toBuffer();
}

function env(key) {
  const txt = readFileSync(`${ROOT}.env.local`, "utf8");
  const line = txt.split("\n").find((l) => l.startsWith(key + "="));
  if (!line) throw new Error(`${key} fehlt in .env.local`);
  return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
}

const [cmd, ...rest] = process.argv.slice(2);
const arg = (name) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : undefined; };
const slug = arg("slug");
if (cmd === "whiten") {
  const all = rest.includes("--all");
  if (!all && !slug) throw new Error("--slug <slug> oder --all angeben");
  const { readdirSync } = await import("node:fs");
  const files = readdirSync(`${ROOT}public/products`).filter((f) => f.endsWith("-packshot.jpg") && (all || f.startsWith(`${slug}-`)));
  for (const f of files) {
    const file = `${ROOT}public/products/${f}`;
    const before = await sharp(file).stats();
    if (before.channels.slice(0, 3).every((c) => c.max === 255) && (await isWhiteEdge(file))) continue;
    const white = await whiteBackground(file);
    if (!white) { console.log(`⏭  ${f}: weisses Produkt, Grund bleibt`); continue; }
    await sharp(white).withXmp(AI_XMP).jpeg({ quality: 88, mozjpeg: true }).toFile(file + ".tmp");
    const { renameSync } = await import("node:fs");
    renameSync(file + ".tmp", file);
    console.log(`⬜ ${f}`);
  }
  process.exit(0);
}

/** Rand schon reinweiss? (dann nichts tun) */
async function isWhiteEdge(file) {
  const { data, info } = await sharp(file).resize(160, 200).raw().toBuffer({ resolveWithObject: true });
  for (let x = 0; x < 160; x++) for (const y of [0, 199]) { const i = (y * 160 + x) * info.channels; if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) return false; }
  for (let y = 0; y < 200; y++) for (const x of [0, 159]) { const i = (y * 160 + x) * info.channels; if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) return false; }
  return true;
}

if (!["convert", "apply"].includes(cmd) || !slug) {
  console.error("Aufruf: node tools/product-images.mjs convert|apply|whiten --slug <slug> …  (Details im Kopf der Datei)");
  process.exit(1);
}
const color = Number(arg("color") ?? 0);
const suffix = color > 0 || rest.includes("--indexed") ? `-c${color}` : "";
const packshotPath = `/products/${slug}${suffix}-packshot.jpg`;
const modelPath = `/products/${slug}${suffix}-model.jpg`;

if (cmd === "convert") {
  const packshot = arg("packshot");
  const model = arg("model");
  if (!packshot && !model) throw new Error("--packshot und/oder --model angeben");

  if (packshot) {
    // Erst den Grund auf Weiss ziehen — sonst entsteht zwischen grauem Bild und
    // weissem Rand ein sichtbarer Kasten
    const whitened = await whiteBackground(packshot);
    const source = whitened ?? (await sharp(packshot).flatten({ background: "#ffffff" }).png().toBuffer());
    const { width, height } = await sharp(source).metadata();

    // Gemini liefert 3:4 (1792×2400). Passt das Produkt mit Luft in einen
    // 4:5-Ausschnitt, oben/unten beschneiden statt erweitern: kein angesetzter
    // Rand, also auch kein Kasten (18.10.2026, Duo- und Rayas-Bikini).
    const cropped = await cropToFormat(source, width, height);
    let framed = cropped;
    if (!framed) {
      // Sonst auf 4:5 erweitern – nur so viel wie nötig und nur in der Richtung,
      // die fehlt (bei 3:4 links/rechts je ~4 %). Ein Rand rundherum setzte
      // auch unten an, wo der Schatten liegt — das ergab Streifen.
      const cw = Math.max(width, Math.round(height * (W / H)));
      const ch = Math.max(height, Math.round(cw * (H / W)));
      const padX = Math.floor((cw - width) / 2), padY = Math.floor((ch - height) / 2);
      const ext = { left: padX, right: cw - width - padX, top: padY, bottom: ch - height - padY };
      // Randpixel fortsetzen statt mit einer Einheitsfarbe auffüllen: Der
      // Gemini-Grund hat einen Verlauf, den auch whiteBackground nicht überall
      // ganz auf 255 bringt — reines Weiss daneben ergab einen Kasten.
      // Zwei Durchgänge: sharp verkleinert sonst immer vor dem Erweitern
      framed = await sharp(source).extend({ ...ext, extendWith: "copy" }).toBuffer();
    }
    await sharp(framed)
      .resize(W, H, { withoutEnlargement: true }) // kleine Bilder nicht aufblasen
      .withXmp(AI_XMP)
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(`${ROOT}public${packshotPath}`);
    console.log(`🖼  public${packshotPath}${cropped ? "  (auf 4:5 zugeschnitten)" : "  (auf 4:5 erweitert)"}`);
  }
  if (model) {
    // Gemini liefert fast genau 4:5 – nur ein paar Pixel Rand fallen weg
    await sharp(model)
      .resize(W, H, { fit: "cover", position: "centre", withoutEnlargement: true }) // kleine Bilder nicht aufblasen
      .withXmp(AI_XMP)
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(`${ROOT}public${modelPath}`);
    console.log(`🖼  public${modelPath}`);
  }
  console.log("Nächster Schritt: committen + deployen, dann `apply`.");
  process.exit(0);
}

// ── apply ────────────────────────────────────────────────────────
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
if (hasModel) {
  const others = images.filter((s) => s !== modelPath);
  images = color > 0 ? [...others, modelPath] : [modelPath, ...others];
}

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
