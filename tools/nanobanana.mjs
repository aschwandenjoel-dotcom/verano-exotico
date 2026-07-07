#!/usr/bin/env node
/**
 * Nano Banana (Gemini Image) – Bildgenerierung & -bearbeitung.
 *
 * Ruft Googles Gemini-Bildmodell "Nano Banana Pro" (gemini-3-pro-image-preview,
 * aka "Nano Banana 2") über die Generative-Language-API auf.
 *
 * Voraussetzung:  GEMINI_API_KEY in .env.local (oder als Umgebungsvariable).
 *
 * Beispiele:
 *   # Neues Bild erzeugen
 *   node tools/nanobanana.mjs --prompt "Ein tropisches Bikini-Produktfoto, weisser Hintergrund" --out public/images/x.png
 *
 *   # Bild bearbeiten (ein oder mehrere Eingabebilder anhängen)
 *   node tools/nanobanana.mjs --prompt "Entferne den Hintergrund, mach ihn rein weiss" \
 *     --in public/images/brand-logo.png --out public/images/brand-logo-clean.png
 *
 *   # Seitenverhältnis / Auflösung steuern
 *   node tools/nanobanana.mjs --prompt "..." --aspect 4:5 --resolution 2K --out out.png
 *
 * Flags:
 *   --prompt <text>        (Pflicht) Beschreibung / Anweisung
 *   --out <pfad>           Ausgabedatei (Default: .tmp/nanobanana-<zeit>.png)
 *   --in <pfad>            Eingabebild zum Bearbeiten (mehrfach erlaubt)
 *   --model <id>           Default: gemini-3-pro-image-preview
 *   --aspect <r>           z.B. 1:1, 4:5, 16:9, 9:16, 3:4, 4:3
 *   --resolution <r>       1K | 2K | 4K   (nur Nano Banana Pro)
 *   --list-models          Verfügbare Modelle auflisten und beenden
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, extname } from "node:path";

// ── .env.local laden (nur GEMINI_API_KEY nötig) ────────────────────
async function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    if (!existsSync(f)) continue;
    const txt = await readFile(f, "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  }
}

// ── Args parsen ────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = { in: [] };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--in") a.in.push(argv[++i]);
    else if (k === "--prompt") a.prompt = argv[++i];
    else if (k === "--out") a.out = argv[++i];
    else if (k === "--model") a.model = argv[++i];
    else if (k === "--aspect") a.aspect = argv[++i];
    else if (k === "--resolution") a.resolution = argv[++i];
    else if (k === "--list-models") a.listModels = true;
  }
  return a;
}

const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

async function main() {
  await loadEnv();
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) {
    console.error("✗ GEMINI_API_KEY fehlt. Key holen: https://aistudio.google.com/apikey\n  Dann in .env.local eintragen:  GEMINI_API_KEY=...");
    process.exit(1);
  }
  const args = parseArgs(process.argv.slice(2));
  const BASE = "https://generativelanguage.googleapis.com/v1beta";

  if (args.listModels) {
    const r = await fetch(`${BASE}/models?key=${key}`);
    const j = await r.json();
    for (const m of j.models ?? []) {
      if ((m.supportedGenerationMethods ?? []).includes("generateContent")) {
        console.log(m.name.replace("models/", ""));
      }
    }
    return;
  }

  if (!args.prompt) { console.error("✗ --prompt fehlt"); process.exit(1); }

  const model = args.model || "gemini-3-pro-image-preview";
  const out = args.out || `.tmp/nanobanana-${Date.now()}.png`;

  // Parts: Text + optionale Eingabebilder
  const parts = [{ text: args.prompt }];
  for (const p of args.in) {
    if (!existsSync(p)) { console.error(`✗ Eingabebild fehlt: ${p}`); process.exit(1); }
    const data = await readFile(p);
    parts.push({ inline_data: { mime_type: MIME[extname(p).toLowerCase()] || "image/png", data: data.toString("base64") } });
  }

  const imageConfig = {};
  if (args.aspect) imageConfig.aspectRatio = args.aspect;
  if (args.resolution) imageConfig.imageSize = args.resolution;

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["Image"],
      ...(Object.keys(imageConfig).length ? { imageConfig } : {}),
    },
  };

  const res = await fetch(`${BASE}/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error(`✗ API-Fehler ${res.status}:\n${t.slice(0, 1200)}`);
    process.exit(1);
  }

  const json = await res.json();
  const cand = json.candidates?.[0];
  const outParts = cand?.content?.parts ?? [];
  const img = outParts.find((p) => p.inlineData || p.inline_data);
  const textOut = outParts.filter((p) => p.text).map((p) => p.text).join(" ").trim();

  if (!img) {
    console.error("✗ Kein Bild in der Antwort." + (textOut ? `\n  Modell sagte: ${textOut}` : "") + `\n  Feedback: ${JSON.stringify(cand?.finishReason ?? json.promptFeedback ?? {})}`);
    process.exit(1);
  }

  const inline = img.inlineData || img.inline_data;
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, Buffer.from(inline.data, "base64"));
  console.log(`✓ ${out}` + (textOut ? `\n  ${textOut}` : ""));
}

main().catch((e) => { console.error(e); process.exit(1); });
