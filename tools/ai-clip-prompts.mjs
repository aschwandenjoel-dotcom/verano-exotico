#!/usr/bin/env node
/**
 * Erzeugt pro Produkt den fertigen Bild-zu-Video-Prompt für Veo (Gemini-App
 * oder Flow) — und legt das Ausgangsfoto daneben, damit Joel nur noch
 * hochladen und den Prompt einfügen muss.
 *
 * NUR Produktfotos ohne Menschen. Veo verweigert das Animieren realer
 * Personen (getestet am 30.09.2026: "I can't make videos of real people in
 * situations like that"), und das ist richtig so: Die Models auf den
 * CJ-Lieferantenfotos haben in ein Foto eingewilligt, nicht in ein KI-Video
 * ihres Abbilds als Werbung. Ein Bikini am Körper braucht echte Aufnahmen.
 *
 * Warum Bild-zu-Video und nicht Text-zu-Video: Das Lieferantenfoto zeigt das
 * echte Produkt. Veo animiert nur Licht, Stoff und Kamera — der Bikini bleibt
 * exakt der, den die Kundin bekommt.
 *
 * Aufruf:
 *   node tools/ai-clip-prompts.mjs                      # alle 15 Flatlay-Produkte
 *   node tools/ai-clip-prompts.mjs --product tanga-leopard
 *   node tools/ai-clip-prompts.mjs --products a,b,c
 *   node tools/ai-clip-prompts.mjs --count 5
 *
 * Ergebnis je Produkt in .tmp/ai-clips/<slug>/:
 *   ausgangsbild.jpg   das Foto zum Hochladen
 *   PROMPT.md          Prompt-Varianten (englisch, Veo versteht das am besten)
 * Fertige Clips dort als clip-1.mp4, clip-2.mp4 … ablegen — die Reel-Pipeline
 * holt sie von dort.
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { arg, loadProducts, mainImage } from "./make-reel.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.resolve(ROOT, arg("out", ".tmp/ai-clips"));

/**
 * Produkte, deren Hauptbild OHNE Menschen auskommt (Flatlay auf Holz, Sand,
 * Stoff oder Freisteller). Nur diese lassen sich animieren: Veo verweigert
 * das Animieren realer Personen — zu Recht, denn die Frauen auf den
 * Lieferantenfotos haben in ein Foto eingewilligt, nicht in ein KI-Video
 * ihres Abbilds. Liste per Sichtprüfung des Katalogs erstellt (30.09.2026).
 */
export const FLATLAY_SLUGS = [
  "marea-bikini",
  "ola-tie-dye-bikini",
  "brillo-sequin-bikini",
  "malla-rope-bikini",
  "fiesta-halter-bikini",
  "tierra-threepiece-bikini",
  "rayas-striped-bikini",
  "selva-floral-bikini",
  "ondas-ruched-bikini",
  "cumbre-highwaist-bikini",
  "tejido-crochet-bikini",
  "tanga-leopard",
  "cumbre-blueten-weiss",
  "costa-beach-dress-set-aquarell",
  "cumbre-leopard",
];

/**
 * Markenlook, den jeder Prompt trägt (Bildsprache der Website: goldene Stunde,
 * Gegenlicht, warme Töne, ruhig, kein Kitsch).
 */
const LOOK =
  "Golden hour light, warm tones, soft directional sunlight with long gentle shadows, " +
  "shallow depth of field, calm and premium editorial product film, subtle film grain.";

/** Was Veo NICHT tun soll — hält das Produkt exakt so, wie es die Kundin bekommt. */
const KEEP =
  "Keep the swimwear exactly as in the photo: same cut, same colors, same print, same proportions. " +
  "Do not add people, hands, text, logos, captions or watermarks. No morphing of the fabric pattern.";

/**
 * Drei Bewegungsvarianten für Produktaufnahmen ohne Menschen.
 * Variante 1 ist die ruhigste und damit die sicherste.
 */
function variants(product, locale = "de") {
  const name = product.name[locale];
  return [
    {
      title: "Variante 1 · Langsame Kamerafahrt über das Produkt (empfohlen)",
      prompt:
        `Animate this product photo of the ${name} swimwear, laid out flat. Very slow, smooth camera ` +
        `push-in and slight drift across the fabric. The light shifts gently as if the sun is moving, ` +
        `the fabric breathes almost imperceptibly. Nothing else moves. ` +
        `Vertical 9:16, 8 seconds, photorealistic. ${LOOK} ${KEEP}`,
    },
    {
      title: "Variante 2 · Wind und Stoff",
      prompt:
        `Bring this flat-lay photo of the ${name} to life: a light breeze lifts the ties and straps, ` +
        `the fabric ripples softly, a faint shadow moves across the surface. The camera stays almost ` +
        `still with a barely noticeable drift. Vertical 9:16, 8 seconds, photorealistic. ${LOOK} ${KEEP}`,
    },
    {
      title: "Variante 3 · Makro zuerst (Schnittmaterial für den Einstieg)",
      prompt:
        `Start extremely close on the fabric texture and stitching of the ${name}, then slowly pull back ` +
        `to reveal the full piece laid out as in the photo. Smooth continuous motion, no cuts. ` +
        `Vertical 9:16, 8 seconds, photorealistic. ${LOOK} ${KEEP}`,
    },
  ];
}

const slugs = arg("product")
  ? [arg("product")]
  : arg("products", "").split(",").map((s) => s.trim()).filter(Boolean);

const products = await loadProducts();
let picked;
if (slugs.length) {
  picked = slugs.map((s) => {
    const p = products.find((x) => x.slug === s);
    if (!p) throw new Error(`Produkt nicht gefunden: ${s}`);
    if (!FLATLAY_SLUGS.includes(s)) {
      console.warn(`⚠️  ${s}: Hauptbild zeigt eine Person — Veo wird das ablehnen. Nur Flatlays animieren.`);
    }
    return p;
  });
} else {
  // Standard: alle Produkte mit menschenfreiem Hauptbild
  const all = FLATLAY_SLUGS.map((s) => products.find((p) => p.slug === s)).filter(Boolean);
  picked = all.slice(0, Number(arg("count", String(all.length))));
}

mkdirSync(OUT, { recursive: true });
writeFileSync(
  path.join(OUT, "README.md"),
  `# KI-Clips\n\nJe Produkt ein Ordner. Darin \`ausgangsbild.jpg\` (in Gemini/Flow hochladen) und \`PROMPT.md\`.\n` +
    `Fertige Clips als \`clip-1.mp4\`, \`clip-2.mp4\` … in den Produktordner legen — die Reel-Pipeline\n` +
    `(tools/make-ai-reel.mjs) holt sie von dort.\n\nGemini-App: Werkzeug „Videos" → Foto hochladen → Prompt einfügen.\n` +
    `Flow: Neues Projekt → „Frames to Video" → Foto als Startbild → Prompt.\n`
);

for (const product of picked) {
  const dir = path.join(OUT, product.slug);
  mkdirSync(dir, { recursive: true });
  const src = mainImage(product);
  const img = path.join(dir, "ausgangsbild" + path.extname(src).toLowerCase());
  if (!existsSync(img)) copyFileSync(src, img);

  const vs = variants(product);
  const md =
    `# ${product.name.de} — Veo-Prompts\n\n` +
    `**Hochladen:** \`${path.relative(ROOT, img)}\`  \n` +
    `**Einstellungen:** Hochformat 9:16, 8 Sekunden, höchste Qualität. Ton egal (wird durch den Instagram-Sound ersetzt).\n\n` +
    vs.map((v) => `## ${v.title}\n\n\`\`\`\n${v.prompt}\n\`\`\`\n`).join("\n") +
    `\n## Danach\n\nClip als \`clip-1.mp4\` (bzw. clip-2, clip-3) in diesen Ordner speichern.\n` +
    `Beim Posten wird „KI-generiert" markiert — das Produkt ist echt, nur die Bewegung ist erzeugt.\n`;
  writeFileSync(path.join(dir, "PROMPT.md"), md);
  console.log(`✅ ${product.slug}  →  ${path.relative(ROOT, dir)}/  (Bild: ${path.basename(src)})`);
}

// Den ersten Prompt gleich zum Kopieren ausgeben
if (picked.length === 1) {
  const v = variants(picked[0])[0];
  console.log(`\n--- Zum Kopieren (${v.title}) ---\n${v.prompt}\n`);
}
