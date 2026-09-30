#!/usr/bin/env node
/**
 * Erzeugt pro Produkt den fertigen Bild-zu-Video-Prompt für Veo (Gemini-App
 * oder Flow) — und legt das Ausgangsfoto daneben, damit Joel nur noch
 * hochladen und den Prompt einfügen muss.
 *
 * Warum Bild-zu-Video und nicht Text-zu-Video: Das Lieferantenfoto zeigt das
 * echte Produkt. Veo animiert es (Wind im Haar, Licht auf dem Wasser, ruhige
 * Kamerafahrt), der Bikini bleibt exakt der, den die Kundin bekommt. Ein frei
 * erfundenes Video würde ein Produkt zeigen, das es so nicht gibt.
 *
 * Aufruf:
 *   node tools/ai-clip-prompts.mjs --product safari-blau-fiesta
 *   node tools/ai-clip-prompts.mjs --products a,b,c
 *   node tools/ai-clip-prompts.mjs --count 5            # die 5 neuesten Produkte
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
 * Markenlook, den jeder Prompt trägt (aus der Bildsprache der Website:
 * goldene Stunde, Gegenlicht, Atlantik, warme Hauttöne, ruhig, kein Kitsch).
 */
const LOOK =
  "Golden hour light, warm skin tones, soft backlight, natural and unretouched, " +
  "shot on a phone camera, shallow depth of field, calm and premium editorial mood.";

/** Was Veo NICHT tun soll — verhindert veränderte Muster und Zusatzelemente. */
const KEEP =
  "Keep the swimwear exactly as in the photo: same cut, same colors, same print, same fit. " +
  "Do not add text, logos, captions, watermarks or extra people. Keep the face and body natural, no morphing.";

/** Drei Bewegungsvarianten — Variante 1 ist die sicherste. */
function variants(product, locale = "de") {
  const name = product.name[locale];
  return [
    {
      title: "Variante 1 · Ruhige Kamerafahrt (empfohlen für den ersten Test)",
      prompt:
        `Animate this photo of a woman wearing the ${name}. Slow, smooth camera push-in toward her, ` +
        `she shifts her weight slightly and looks toward the sea, hair moves gently in a light breeze. ` +
        `Vertical 9:16, 8 seconds, photorealistic. ${LOOK} ${KEEP}`,
    },
    {
      title: "Variante 2 · Wind und Wasser",
      prompt:
        `Bring this photo to life: a soft ocean breeze moves her hair and the fabric ties of the ${name}, ` +
        `sunlight sparkles on the water behind her, she takes one relaxed step and smiles slightly. ` +
        `Handheld feel, very subtle motion. Vertical 9:16, 8 seconds, photorealistic. ${LOOK} ${KEEP}`,
    },
    {
      title: "Variante 3 · Detail zuerst (für Schnitt-Material)",
      prompt:
        `Start close on the fabric and straps of the ${name}, then slowly pull back to reveal her standing ` +
        `at the beach in the same pose as the photo. Gentle motion only. Vertical 9:16, 8 seconds, ` +
        `photorealistic. ${LOOK} ${KEEP}`,
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
    return p;
  });
} else {
  picked = products.slice().reverse().slice(0, Number(arg("count", "5")));
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
