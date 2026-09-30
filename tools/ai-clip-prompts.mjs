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
 * Negativ-Prompt für Kling. Bewusst kurz (Kling empfiehlt 3–7 Punkte; mehr
 * verwirrt das Modell). Deckt die Fehler ab, die bei Flatlays auftreten:
 * auftauchende Hände, verzerrte Muster, Flackern, eingeblendeter Text.
 */
const NEGATIVE = "people, hands, text, logo, watermark, distorted pattern, flicker, morphing";

/**
 * Kling-Prompts für Produktaufnahmen ohne Menschen.
 *
 * Bei Bild-zu-Video legt das Foto das Aussehen fest — der Prompt steuert nur
 * die BEWEGUNG. Deshalb kurz (20–40 Wörter) und mit ausdrücklicher
 * Kameraanweisung; lange Beschreibungen des Motivs schaden hier eher.
 */
function variants(product, locale = "de") {
  const name = product.name[locale];
  return [
    {
      title: "Variante 1 · Langsame Kamerafahrt (empfohlen für den ersten Test)",
      prompt:
        "Camera slowly pushes in on the swimwear, smooth and steady. Sunlight shifts gently across " +
        "the fabric, soft shadows move. The fabric breathes almost imperceptibly. Nothing else moves.",
    },
    {
      title: "Variante 2 · Wind im Stoff",
      prompt:
        "A light breeze lifts the ties and straps, the fabric ripples softly. Camera holds almost " +
        "still with a barely noticeable drift. Warm golden hour light, soft moving shadows.",
    },
    {
      title: "Variante 3 · Makro zuerst (Einstiegsmaterial)",
      prompt:
        "Camera starts extremely close on the fabric texture and stitching, then slowly pulls back " +
        "to reveal the whole piece. One continuous smooth move, no cuts.",
    },
  ];
}

/** Längere Fassung für Veo (Gemini/Flow), falls dort gearbeitet wird. */
function veoPrompt(product, locale = "de") {
  const name = product.name[locale];
  return (
    `Animate this product photo of the ${name} swimwear, laid out flat. Very slow, smooth camera ` +
    `push-in and slight drift across the fabric. The light shifts gently as if the sun is moving, ` +
    `the fabric breathes almost imperceptibly. Nothing else moves. Vertical 9:16, 8 seconds, ` +
    `photorealistic. Golden hour light, warm tones, soft directional sunlight, shallow depth of field, ` +
    `calm premium product film. Keep the swimwear exactly as in the photo: same cut, colors, print. ` +
    `Do not add people, hands, text, logos or watermarks.`
  );
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
  `# KI-Clips\n\nJe Produkt ein Ordner mit \`ausgangsbild.jpg\` (hochladen) und \`PROMPT.md\`.\n` +
    `Fertige Clips als \`clip-1.mp4\`, \`clip-2.mp4\` … in denselben Ordner legen.\n\n` +
    `## Kling (klingai.com)\n\n` +
    `1. **AI Video → Image to Video**\n2. Bild hochladen\n3. Prompt aus \`PROMPT.md\` einfügen\n` +
    `4. **Negative Prompt** ausklappen und den Negativ-Prompt einfügen\n` +
    `5. Dauer **5 s**, Seitenverhältnis **9:16** → Generate\n\n` +
    `Gratis: 66 Credits pro Tag, jeden Tag neu. Ein 5-Sekunden-Clip im Standardmodus kostet wenige\n` +
    `Credits — es reicht für mehrere Versuche pro Produkt.\n\n` +
    `## Veo (Gemini-App oder Flow)\n\n` +
    `Werkzeug „Videos" → Foto hochladen → den längeren Veo-Prompt aus \`PROMPT.md\`.\n` +
    `Achtung: Veo animiert keine realen Personen — nur die Flatlay-Fotos hier funktionieren.\n`
);

for (const product of picked) {
  const dir = path.join(OUT, product.slug);
  mkdirSync(dir, { recursive: true });
  const src = mainImage(product);
  const img = path.join(dir, "ausgangsbild" + path.extname(src).toLowerCase());
  if (!existsSync(img)) copyFileSync(src, img);

  const vs = variants(product);
  const md =
    `# ${product.name.de} — Clip-Prompts\n\n` +
    `**Bild hochladen:** \`${path.relative(ROOT, img)}\`\n\n` +
    `## Einstellungen in Kling\n\n` +
    `| Feld | Wert |\n|---|---|\n` +
    `| Modus | **Image to Video** (Bild zuerst hochladen) |\n` +
    `| Dauer | **5 s** (reicht fürs Reel, spart Credits) |\n` +
    `| Seitenverhältnis | **9:16** |\n` +
    `| Qualität | Professional, wenn Credits reichen — sonst Standard |\n` +
    `| Ton | egal, wird durch den Instagram-Sound ersetzt |\n\n` +
    `**Negativ-Prompt** (ins eigene Feld, gilt für alle Varianten):\n\n\`\`\`\n${NEGATIVE}\n\`\`\`\n\n` +
    vs.map((v) => `## ${v.title}\n\n\`\`\`\n${v.prompt}\n\`\`\`\n`).join("\n") +
    `\n## Falls du es in Veo (Gemini/Flow) versuchst\n\nDort gehören Aussehen und Bewegung in einen Prompt:\n\n` +
    `\`\`\`\n${veoPrompt(product)}\n\`\`\`\n` +
    `\n## Danach\n\nClip als \`clip-1.mp4\` (bzw. clip-2, clip-3) in diesen Ordner speichern.\n` +
    `Beim Posten wird „KI-generiert" markiert — das Produkt ist echt, nur die Bewegung ist erzeugt.\n`;
  writeFileSync(path.join(dir, "PROMPT.md"), md);
  console.log(`✅ ${product.slug}  →  ${path.relative(ROOT, dir)}/  (Bild: ${path.basename(src)})`);
}

// Den ersten Prompt gleich zum Kopieren ausgeben
if (picked.length === 1) {
  const v = variants(picked[0])[0];
  console.log(`\n--- Kling · ${v.title} ---\n${v.prompt}`);
  console.log(`\n--- Kling · Negativ-Prompt ---\n${NEGATIVE}\n`);
}
