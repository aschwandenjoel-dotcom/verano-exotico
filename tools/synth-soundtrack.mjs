#!/usr/bin/env node
/**
 * Erzeugt die Tonspur für einen Code-Spot — Musik und Geräusche komplett
 * synthetisiert, ohne Samples und ohne Lizenzfragen.
 *
 * Warum eingebaut statt über Instagrams Musikbibliothek: Der Parameter
 * audio_configuration wird beim Reel-Upload stillschweigend ignoriert (zwei
 * Posts gingen ohne Ton raus, 02.10. und 06.10.2026). Ein Ton in der MP4
 * selbst funktioniert auf jeder Plattform.
 *
 * Liest `window.SOUND` aus der HTML-Datei des Spots (zwischen "SOUND-START"
 * und "SOUND-END"): bpm, duration, sections {intro, groove, pause, outro},
 * cues [{ t, type }] mit type = tap | swipe | whoosh | pop | success |
 * shimmer | riser | hit | impact.
 *
 * Musik: sommerlicher House-Loop (Am–F–C–G), Kick/Clap/Hats, Offbeat-Bass,
 * Flächen und gezupfte Arpeggios. Intro gefiltert, Groove ab "groove",
 * Pause nur Fläche, Outro mit Schlussakkord.
 *
 * Aufruf:
 *   node tools/synth-soundtrack.mjs --html assets/ads/kauf-in-3-taps.html --out .tmp/ads/kauf-in-3-taps.wav
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : fallback;
}

const htmlFile = arg("html");
if (!htmlFile) {
  console.error("Aufruf: node tools/synth-soundtrack.mjs --html <spot.html> --out <ton.wav>");
  process.exit(1);
}
const block = readFileSync(htmlFile, "utf8").match(/SOUND-START\s*\n\s*window\.SOUND\s*=\s*([\s\S]*?);\s*\n\s*\/\/ SOUND-END/);
if (!block) {
  console.error("❌ Kein window.SOUND zwischen SOUND-START und SOUND-END gefunden.");
  process.exit(1);
}
// Objekt-Literal mit Kommentaren → auswerten (eigene Datei, kein Fremdinhalt)
const SOUND = Function(`"use strict"; return (${block[1]});`)();
const out = path.resolve(arg("out", htmlFile.replace(/\.html$/, ".wav")));

const SR = 44100;
const DUR = SOUND.duration;
const N = Math.ceil(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const BEAT = 60 / SOUND.bpm;
const S = SOUND.sections;
const inSec = (t, [a, b]) => t >= a && t < b;

// ---------- Bausteine ----------
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
let seed = 12345;
const noise = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

function add(t0, samples, gain = 1, pan = 0) {
  const start = Math.round(t0 * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < samples.length; i++) {
    const k = start + i;
    if (k < 0 || k >= N) continue;
    L[k] += samples[i] * gl;
    R[k] += samples[i] * gr;
  }
}

/** RBJ-Biquad, in place */
function biquad(buf, type, freqAt, q = 0.707) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < buf.length; i++) {
    const f = typeof freqAt === "function" ? freqAt(i / SR) : freqAt;
    const w = (2 * Math.PI * Math.min(f, SR * 0.45)) / SR;
    const cs = Math.cos(w), al = Math.sin(w) / (2 * q);
    let b0, b1, b2;
    if (type === "lp") { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; }
    else if (type === "hp") { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; }
    else { b0 = al; b1 = 0; b2 = -al; } // bandpass
    const a0 = 1 + al, a1 = -2 * cs, a2 = 1 - al;
    const x = buf[i];
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    buf[i] = y;
  }
  return buf;
}

function render(len, fn) {
  const b = new Float32Array(Math.round(len * SR));
  for (let i = 0; i < b.length; i++) b[i] = fn(i / SR, i);
  return b;
}

// ---------- Schlagzeug ----------
const kick = () => {
  let ph = 0;
  return render(0.45, (t) => {
    const f = 45 + 110 * Math.exp(-t * 28);
    ph += (2 * Math.PI * f) / SR;
    return Math.sin(ph) * Math.exp(-t * 7) * (t < 0.003 ? t / 0.003 : 1);
  });
};
const clap = () => biquad(render(0.25, (t) => noise() * (Math.exp(-t * 22) + (t > 0.012 && t < 0.03 ? 0.6 : 0))), "bp", 1400, 0.9);
const hat = (open = false) => biquad(render(open ? 0.18 : 0.05, (t) => noise() * Math.exp(-t * (open ? 18 : 70))), "hp", 8000);

// ---------- Harmonie ----------
// Am – F – C – G, je ein Takt; Akkordtöne als MIDI-Noten
const CHORDS = [
  { root: 45, notes: [57, 60, 64, 67] }, // Am7
  { root: 41, notes: [57, 60, 65, 69] }, // Fmaj7
  { root: 48, notes: [55, 60, 64, 71] }, // Cmaj7
  { root: 43, notes: [55, 59, 62, 67] }, // G
];
const BAR = BEAT * 4;
const chordAt = (t) => CHORDS[Math.floor(t / BAR) % CHORDS.length];

function saw(freq, len, detune = 0) {
  let ph = (noise() + 1) / 2; // deterministisch: gleiche Datei bei jedem Lauf
  const f = freq * Math.pow(2, detune / 1200);
  return render(len, () => { ph = (ph + f / SR) % 1; return ph * 2 - 1; });
}

function pad(t0, len, notes, cutoff) {
  const mix = new Float32Array(Math.round(len * SR));
  for (const n of notes) {
    for (const d of [-9, 0, 8]) {
      const s = saw(midi(n), len, d);
      for (let i = 0; i < mix.length; i++) mix[i] += s[i] / 12;
    }
  }
  biquad(mix, "lp", cutoff, 0.8);
  for (let i = 0; i < mix.length; i++) {
    const t = i / SR;
    mix[i] *= Math.min(1, t / 0.25) * Math.min(1, (len - t) / 0.3);
  }
  add(t0, mix, 0.85, 0);
}

function bass(t0, note, len = BEAT * 0.45) {
  let ph = 0;
  const f = midi(note);
  const b = render(len, (t) => {
    ph = (ph + f / SR) % 1;
    const tri = 1 - 4 * Math.abs(ph - 0.5);
    return (tri * 0.8 + Math.sin(ph * 2 * Math.PI * 2) * 0.2) * Math.exp(-t * 5) * Math.min(1, t / 0.004);
  });
  add(t0, biquad(b, "lp", 900), 0.75);
}

function pluck(t0, note, pan) {
  let ph = 0;
  const f = midi(note);
  const b = render(0.6, (t) => {
    ph = (ph + f / SR) % 1;
    return (Math.sin(ph * 2 * Math.PI) + 0.3 * Math.sin(ph * 4 * Math.PI)) * Math.exp(-t * 9);
  });
  add(t0, b, 0.32, pan);
  add(t0 + BEAT * 0.75, b, 0.12, -pan); // Echo
}

// ---------- Geräusche ----------
const SFX = {
  tap: (t) => {
    add(t, render(0.06, (x) => Math.sin(2 * Math.PI * 1900 * x) * Math.exp(-x * 90)), 0.5);
    add(t, biquad(render(0.02, () => noise()), "hp", 3000), 0.35);
  },
  pop: (t) => {
    let ph = 0;
    add(t, render(0.14, (x) => { ph += (2 * Math.PI * (700 + 900 * Math.min(1, x / 0.05))) / SR; return Math.sin(ph) * Math.exp(-x * 30); }), 0.45);
  },
  swipe: (t) => add(t - 0.05, biquad(render(0.4, (x) => noise() * Math.sin(Math.PI * x / 0.4) ** 2), "bp", (x) => 600 + 4000 * (x / 0.4), 1.2), 0.5, 0.3),
  whoosh: (t) => add(t - 0.3, biquad(render(0.9, (x) => noise() * Math.sin(Math.PI * x / 0.9) ** 3), "bp", (x) => 300 + 2500 * Math.sin(Math.PI * x / 0.9), 0.9), 0.9),
  riser: (t, c) => {
    const len = c.len ?? 1;
    add(t, biquad(render(len, (x) => noise() * (x / len) ** 2), "bp", (x) => 400 + 6000 * (x / len) ** 2, 2), 0.45);
  },
  shimmer: (t) => [88, 91, 95, 100].forEach((n, i) => {
    let ph = 0;
    add(t + i * 0.07, render(1.2, (x) => { ph += (2 * Math.PI * midi(n)) / SR; return Math.sin(ph) * Math.exp(-x * 4); }), 0.12, i % 2 ? 0.5 : -0.5);
  }),
  success: (t) => [76, 83, 88].forEach((n, i) => {
    let ph = 0;
    add(t + i * 0.11, render(1.4, (x) => { ph += (2 * Math.PI * midi(n)) / SR; return (Math.sin(ph) + 0.25 * Math.sin(ph * 2.76)) * Math.exp(-x * 3.5); }), 0.28);
  }),
  hit: (t) => {
    add(t, kick(), 0.65);
    add(t, biquad(render(1.2, (x) => noise() * Math.exp(-x * 4)), "hp", 5000), 0.25);
  },
  impact: (t) => {
    add(t, kick(), 0.7);
    add(t, biquad(render(2.0, (x) => noise() * Math.exp(-x * 2.2)), "hp", 4000), 0.3);
  },
};

// ---------- Arrangement ----------
for (let bar = 0; bar * BAR < DUR; bar++) {
  const t = bar * BAR;
  const c = chordAt(t);
  // Fläche immer — im Intro und in der Pause stark gefiltert
  const open = inSec(t, S.groove) || inSec(t, S.outro);
  pad(t, BAR + 0.3, c.notes, open ? 2600 : 700);
}

for (let b = 0; b * BEAT < DUR; b++) {
  const t = b * BEAT;
  const c = chordAt(t);
  if (inSec(t, S.groove)) {
    add(t, kick(), 0.6);
    if (b % 2 === 1) add(t, clap(), 0.5, 0.05);
    add(t + BEAT / 2, hat(b % 4 === 3), 0.28, 0.25);
    add(t + BEAT / 4, hat(), 0.1, -0.3);
    add(t + (BEAT * 3) / 4, hat(), 0.1, -0.3);
    bass(t + BEAT / 2, c.root);
    // Arpeggio in Sechzehnteln, jede zweite Note
    for (let s = 0; s < 4; s += 2) pluck(t + (s * BEAT) / 4, c.notes[(b * 2 + s) % 4] + 12, s ? 0.4 : -0.4);
  } else if (inSec(t, S.intro) && t >= BAR) {
    add(t + BEAT / 2, hat(), 0.12, 0.25); // leise Hats im zweiten Intro-Takt
  } else if (inSec(t, S.outro) && t < S.outro[0] + BEAT * 0.5) {
    bass(t, c.root, 1.5);
  }
}

for (const cue of SOUND.cues) {
  const fn = SFX[cue.type];
  if (!fn) console.warn(`⚠️  Unbekannter Cue-Typ: ${cue.type}`);
  else fn(cue.t, cue);
}

// ---------- Mastering: Fades, Sanft-Limiter, Normalisieren ----------
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fadeIn = Math.min(1, t / 0.3);
  const fadeOut = Math.min(1, (DUR - t) / 1.2);
  const g = fadeIn * fadeOut;
  L[i] = Math.tanh(L[i] * 0.9) * g;
  R[i] = Math.tanh(R[i] * 0.9) * g;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = peak > 0 ? 0.89 / peak : 1; // ca. -1 dBFS

// ---------- WAV schreiben (16 Bit, Stereo) ----------
const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), i * 4);
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), i * 4 + 2);
}
const header = Buffer.alloc(44);
header.write("RIFF", 0); header.writeUInt32LE(36 + data.length, 4); header.write("WAVE", 8);
header.write("fmt ", 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22);
header.writeUInt32LE(SR, 24); header.writeUInt32LE(SR * 4, 28); header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34);
header.write("data", 36); header.writeUInt32LE(data.length, 40);
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, Buffer.concat([header, data]));
console.log(`🎵 ${path.relative(process.cwd(), out)} — ${DUR} s, ${SOUND.bpm} BPM, ${SOUND.cues.length} Geräusche`);
