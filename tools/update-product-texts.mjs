/**
 * Produkttexte (Name, Beschreibung, Material, Pflege) im Live-Shop ändern.
 *
 * Nutzung:
 *   node tools/update-product-texts.mjs <texte.json> [--dry-run] [--only slug1,slug2]
 *
 * <texte.json> ist ein Objekt { "<slug>": { "name_de": "…", "description_de": "…", … } }.
 * Erlaubte Felder: name_de/en, description_de/en, material_de/en, care_de/en.
 * Slugs (= URLs, Merchant-Center-IDs, CJ-Zuordnung) bleiben immer unverändert.
 *
 * Vor dem Schreiben wird der aktuelle Stand aller betroffenen Produkte nach
 * .tmp/product-texts-backup-<zeitstempel>.json gesichert. Zurückspielen:
 * dieselbe Datei wieder als <texte.json> übergeben.
 *
 * Schreibt über PATCH /api/products/<slug> mit Header x-admin-key
 * (ADMIN_PASSWORD aus .env.local). SITE_URL überschreibbar per Umgebungsvariable.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const SITE = process.env.SITE_URL ?? "https://verano-exotico.ch";
const FIELDS = ["name_de", "name_en", "description_de", "description_en", "material_de", "material_en", "care_de", "care_en"];

function env(key) {
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const line = txt.split("\n").find((l) => l.startsWith(key + "="));
  if (!line) throw new Error(`${key} fehlt in .env.local`);
  return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
}

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");
const onlyArg = args[args.indexOf("--only") + 1];
const only = args.includes("--only") ? new Set(onlyArg.split(",")) : null;
if (!file) {
  console.error("Aufruf: node tools/update-product-texts.mjs <texte.json> [--dry-run] [--only slug1,slug2]");
  process.exit(1);
}

const texts = JSON.parse(readFileSync(file, "utf8"));
const slugs = Object.keys(texts).filter((s) => !only || only.has(s));

// Eingaben prüfen, bevor irgendetwas geschrieben wird
for (const slug of slugs) {
  const bad = Object.keys(texts[slug]).filter((k) => !FIELDS.includes(k));
  if (bad.length) throw new Error(`${slug}: unbekannte Felder ${bad.join(", ")}`);
}
const names = slugs.map((s) => texts[s].name_de).filter(Boolean);
const dupes = names.filter((n, i) => names.indexOf(n) !== i);
if (dupes.length) throw new Error(`Doppelte Namen: ${[...new Set(dupes)].join(", ")}`);

// Backup des aktuellen Stands
const backup = {};
for (const slug of slugs) {
  const res = await fetch(`${SITE}/api/products/${slug}`);
  if (!res.ok) throw new Error(`${slug}: GET ${res.status} — Produkt nicht gefunden oder inaktiv`);
  const p = await res.json();
  backup[slug] = {
    name_de: p.name.de, name_en: p.name.en,
    description_de: p.description.de, description_en: p.description.en,
    material_de: p.material.de, material_en: p.material.en,
    care_de: p.care.de, care_en: p.care.en,
  };
}
mkdirSync(new URL("../.tmp/", import.meta.url), { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = new URL(`../.tmp/product-texts-backup-${stamp}.json`, import.meta.url);
writeFileSync(backupPath, JSON.stringify(backup, null, 2));
console.log(`💾 Backup: ${backupPath.pathname}`);

if (dryRun) {
  for (const slug of slugs) console.log(`${slug}: "${backup[slug].name_de}" → "${texts[slug].name_de ?? "(unverändert)"}"`);
  console.log(`\n(Probelauf — nichts geschrieben, ${slugs.length} Produkte)`);
  process.exit(0);
}

const key = env("ADMIN_PASSWORD");
let ok = 0;
for (const slug of slugs) {
  const res = await fetch(`${SITE}/api/products/${slug}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-admin-key": key },
    body: JSON.stringify(texts[slug]),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`❌ ${slug}: ${res.status} ${data.error ?? ""}`);
    continue;
  }
  ok++;
  console.log(`✅ ${slug} — ${data.product?.name?.de ?? ""} (${data.updated.join(", ")})`);
}
console.log(`\n${ok}/${slugs.length} Produkte aktualisiert.`);
if (ok < slugs.length) process.exit(1);
