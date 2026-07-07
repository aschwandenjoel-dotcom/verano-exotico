/**
 * KI-Produktbilder mit fal.ai (FLUX) generieren — im Verano-Exotico-Look.
 *
 * Nutzung:
 *   node tools/generate-product-image.mjs            # generiert alle unten definierten Jobs
 *   node tools/generate-product-image.mjs <slug>     # nur ein bestimmtes Produkt
 *
 * Braucht Guthaben auf fal.ai (fal.ai/dashboard/billing). Liest FAL_KEY aus .env.local.
 * Speichert die Bilder nach public/products/ai-preview/ — überschreibt NICHTS Bestehendes.
 * Erst nach Sichtung entscheidest du, ob wir sie als Produktbilder übernehmen.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname;
const env = readFileSync(`${ROOT}/.env.local`, "utf8");
const FAL_KEY = (env.split("\n").find((l) => l.startsWith("FAL_KEY=")) || "").slice("FAL_KEY=".length).trim();
if (!FAL_KEY) { console.error("FAL_KEY fehlt in .env.local"); process.exit(1); }

const MODEL = "fal-ai/flux/dev"; // fotorealistisch; für Schnelltests: "fal-ai/flux/schnell"

// Gemeinsamer Stil-Rahmen (Marke: sonnig, exotisch, hochwertig, editorial)
const STYLE =
  "professional high-end swimwear e-commerce photograph, full-body, a confident woman modelling on a sunny tropical beach, " +
  "turquoise sea and softly blurred palm trees in the background, warm golden-hour light, natural relaxed pose, " +
  "editorial catalog quality, sharp focus, realistic skin texture, shot on 35mm, no text, no watermark, no logo";

// Die zu generierenden Bilder (Bikini-Beschreibung so nah wie möglich am echten Produkt)
const JOBS = [
  { slug: "sol-solid-bikini",     desc: "wearing a simple solid bright-red two-piece triangle bikini" },
  { slug: "bahia-bandeau-bikini", desc: "wearing an elegant solid white bandeau bikini with mid-waist bottoms" },
];

const only = process.argv[2];
const jobs = only ? JOBS.filter((j) => j.slug === only) : JOBS;
if (jobs.length === 0) { console.error(`Kein Job für "${only}"`); process.exit(1); }

const OUT = `${ROOT}/public/products/ai-preview`;
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

for (const job of jobs) {
  const prompt = `${job.desc}, ${STYLE}`;
  console.log(`\n🎨 ${job.slug} …`);
  const t0 = Date.now();
  const res = await fetch(`https://fal.run/${MODEL}`, {
    method: "POST",
    headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, image_size: "portrait_4_3", num_images: 2, enable_safety_checker: true }),
  });
  const j = await res.json();
  if (!j.images) { console.log(`   ❌ ${res.status}:`, JSON.stringify(j).slice(0, 200)); continue; }
  for (let i = 0; i < j.images.length; i++) {
    const img = await fetch(j.images[i].url);
    const buf = Buffer.from(await img.arrayBuffer());
    const fname = `${job.slug}-ai-${i + 1}.jpg`;
    writeFileSync(`${OUT}/${fname}`, buf);
    console.log(`   🖼  ai-preview/${fname} (${(buf.length / 1024).toFixed(0)} KB)`);
  }
  console.log(`   ⏱  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
console.log("\n✅ Fertig. Bilder liegen in public/products/ai-preview/");
