#!/usr/bin/env node
/**
 * Rendert eine HTML-Animation Bild für Bild zu einem MP4 — Videos komplett aus
 * Code, ohne Schnittprogramm.
 *
 * Die HTML-Seite muss eine Funktion `window.renderFrame(t)` bereitstellen, die
 * den Zustand zum Zeitpunkt t (Sekunden) setzt — keine CSS-Transitions oder
 * requestAnimationFrame. So ist jedes Bild exakt und das Video unabhängig von
 * der Rechenleistung. Optional `window.VIDEO = { duration, fps, width, height }`.
 *
 * Ablauf: Chrome headless (DevTools-Protokoll) → Screenshot pro Bild →
 * ffmpeg (H.264, yuv420p, 9:16) → .mp4. Optional Tonspur dazumischen.
 *
 * Aufruf:
 *   node tools/render-html-video.mjs --html assets/ads/kauf-in-3-taps.html --out .tmp/ads/kauf.mp4
 *   … --fps 30 --duration 17 --audio sfx.wav --preview 4.2   (nur ein Standbild bei 4.2 s als PNG)
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const WebSocket = require("ws");
const ffmpegPath = require("ffmpeg-static");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : fallback;
}

const htmlFile = arg("html");
if (!htmlFile || !existsSync(htmlFile)) {
  console.error("Aufruf: node tools/render-html-video.mjs --html <datei.html> --out <video.mp4> [--fps 30] [--duration s] [--audio ton.wav] [--preview s]");
  process.exit(1);
}
const out = path.resolve(arg("out", path.join(ROOT, ".tmp", "ads", `${path.basename(htmlFile, ".html")}.mp4`)));
const preview = arg("preview");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Chrome starten ----------
const port = 9300 + Math.floor(Math.random() * 500);
const userDir = path.join(ROOT, ".tmp", `chrome-render-${port}`);
const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDir}`,
  "--hide-scrollbars",
  "--force-device-scale-factor=1",
  "--allow-file-access-from-files",
  "--disable-gpu-vsync",
  "about:blank",
], { stdio: "ignore" });

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* Chrome startet noch */
    }
    await sleep(200);
  }
  throw new Error("Chrome antwortet nicht (CHROME_PATH prüfen)");
}

let ws;
let msgId = 0;
const pending = new Map();
function send(method, params = {}) {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function evaluate(expression) {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(`Fehler in der Seite: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
  return r.result.value;
}

try {
  ws = new WebSocket(await connect(), { maxPayload: 512 * 1024 * 1024 });
  await new Promise((r) => ws.on("open", r));
  ws.on("message", (data) => {
    const msg = JSON.parse(data);
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    if (msg.error) p.reject(new Error(msg.error.message));
    else p.resolve(msg.result);
  });

  await send("Page.enable");
  await send("Page.navigate", { url: pathToFileURL(path.resolve(htmlFile)).href });
  // Warten, bis Seite, Schriften und Bilder geladen sind
  for (let i = 0; i < 100; i++) {
    const ready = await evaluate(
      "document.readyState === 'complete' && typeof window.renderFrame === 'function' && [...document.images].every(i => i.complete)"
    ).catch(() => false);
    if (ready) break;
    await sleep(100);
  }
  await evaluate("document.fonts.ready.then(() => true)");

  const meta = (await evaluate("JSON.stringify(window.VIDEO || {})").then(JSON.parse)) || {};
  const width = Number(meta.width ?? 1080);
  const height = Number(meta.height ?? 1920);
  const fps = Number(arg("fps", meta.fps ?? 30));
  const duration = Number(arg("duration", meta.duration ?? 10));
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });

  mkdirSync(path.dirname(out), { recursive: true });

  if (preview !== undefined) {
    await evaluate(`window.renderFrame(${Number(preview)})`);
    const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width, height, scale: 1 } });
    const png = out.replace(/\.mp4$/, `-t${preview}.png`);
    writeFileSync(png, Buffer.from(shot.data, "base64"));
    console.log(`🖼  ${path.relative(ROOT, png)}`);
  } else {
    const audio = arg("audio");
    const ff = spawn(ffmpegPath, [
      "-y", "-loglevel", "error",
      "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-",
      ...(audio ? ["-i", audio, "-c:a", "aac", "-b:a", "192k", "-shortest"] : []),
      "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
      out,
    ], { stdio: ["pipe", "inherit", "inherit"] });

    const total = Math.round(duration * fps);
    const started = Date.now();
    for (let f = 0; f < total; f++) {
      await evaluate(`window.renderFrame(${f / fps})`);
      const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width, height, scale: 1 } });
      if (!ff.stdin.write(Buffer.from(shot.data, "base64"))) await new Promise((r) => ff.stdin.once("drain", r));
      if (f % fps === 0) process.stdout.write(`\r   Bild ${f}/${total}`);
    }
    ff.stdin.end();
    await new Promise((r) => ff.on("close", r));
    console.log(`\r✅ ${path.relative(ROOT, out)} — ${duration} s, ${fps} fps, ${width}×${height} (${Math.round((Date.now() - started) / 1000)} s Renderzeit)`);
  }
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exitCode = 1;
} finally {
  ws?.close();
  chrome.kill();
  await sleep(300);
  spawnSync("rm", ["-rf", userDir]);
}
