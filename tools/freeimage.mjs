#!/usr/bin/env node
/**
 * Gratis-Bildgenerierung über Pollinations.ai – KEIN API-Key nötig.
 *
 * Beispiele:
 *   node tools/freeimage.mjs --prompt "Tropisches Bikini-Produktfoto, weisser Hintergrund" --out .tmp/x.png
 *   node tools/freeimage.mjs --prompt "..." --width 1024 --height 1280 --model flux --out out.png
 *
 * Flags:
 *   --prompt <text>   (Pflicht)
 *   --out <pfad>      Default: .tmp/free-<zeit>.png
 *   --width <n>       Default 1024
 *   --height <n>      Default 1024
 *   --model <id>      flux (Default) | turbo
 *   --seed <n>        für reproduzierbare Ergebnisse
 */

import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i].replace(/^--/, "");
    a[k] = argv[++i];
  }
  return a;
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  if (!a.prompt) { console.error("✗ --prompt fehlt"); process.exit(1); }

  const out = a.out || `.tmp/free-${Date.now()}.png`;
  const params = new URLSearchParams({
    width: a.width || "1024",
    height: a.height || "1024",
    model: a.model || "flux",
    nologo: "true",
    ...(a.seed ? { seed: a.seed } : {}),
  });
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(a.prompt)}?${params}`;

  const res = await fetch(url, { headers: { "User-Agent": "verano-exotico/1.0" } });
  if (!res.ok) { console.error(`✗ Fehler ${res.status}: ${(await res.text()).slice(0, 400)}`); process.exit(1); }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) { console.error("✗ Antwort zu klein – wahrscheinlich kein Bild."); process.exit(1); }

  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, buf);
  console.log(`✓ ${out}  (${(buf.length / 1024).toFixed(0)} KB)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
