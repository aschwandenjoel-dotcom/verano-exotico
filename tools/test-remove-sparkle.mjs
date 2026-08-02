#!/usr/bin/env node
/**
 * Selbsttest fuer remove-sparkle.mjs.
 *
 * Setzt einen Stern mit BEKANNTEN Werten in ein sauberes Bild, laesst das Tool
 * blind darauf los und vergleicht das Ergebnis mit dem Original. Ohne diesen
 * Test laesst sich nicht beurteilen, ob eine Aenderung am Tool die Erkennung
 * verbessert oder verschlechtert - das blosse Betrachten des Resultats taeuscht,
 * besonders bei starker Vergroesserung.
 *
 * Aufruf: node tools/test-remove-sparkle.mjs --ref <sauberes-bild.png>
 */
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};

const REF = flag('ref');
if (!REF) {
  console.error('Aufruf: node tools/test-remove-sparkle.mjs --ref <sauberes-bild.png>');
  process.exit(1);
}

const K = 0.6;
/**
 * Zwei Faehigkeiten, getrennt geprueft:
 *
 *   auto: true   - Suche UND Korrektur. Nur an der real gemessenen Position,
 *                  denn dort setzt die App den Stern tatsaechlich.
 *   auto: false  - nur die Korrektur, Position wird vorgegeben.
 *
 * Die Trennung ist noetig, weil die Suche prinzipiell an spitzen hellen Formen
 * scheitern kann (im Testbild an einer Monstera-Blattspitze vor dunklem Holz).
 * Ohne die Trennung wuerde ein Suchfehler die Korrektur mit durchfallen lassen.
 */
const CASES = [
  { cx: 807.5, cy: 1031.5, R: 29, a: 0.31, auto: true },
  { cx: 862.0, cy: 1078.5, R: 22, a: 0.27, auto: false },
  { cx: 745.3, cy: 995.7, R: 34, a: 0.24, auto: false },
];

const { data, info } = await sharp(REF).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const dir = mkdtempSync(join(tmpdir(), 'sparkle-'));
let failed = 0;

for (const [n, tc] of CASES.entries()) {
  // Stern aufbringen, Kante per 4x4-Supersampling
  const dirty = Buffer.from(data);
  const alpha = (t) => (t <= 0.97 ? tc.a : t >= 1.06 ? 0 : (tc.a * (1.06 - t)) / 0.09);
  for (let y = Math.floor(tc.cy - tc.R * 2); y < tc.cy + tc.R * 2; y++) {
    for (let x = Math.floor(tc.cx - tc.R * 2); x < tc.cx + tc.R * 2; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      let s = 0;
      for (let sy = 0; sy < 4; sy++)
        for (let sx = 0; sx < 4; sx++) {
          const dx = x + (sx + 0.5) / 4 - 0.5 - tc.cx;
          const dy = y + (sy + 0.5) / 4 - 0.5 - tc.cy;
          s += alpha(Math.pow(Math.abs(dx / tc.R), K) + Math.pow(Math.abs(dy / tc.R), K));
        }
      const al = s / 16;
      if (al <= 0) continue;
      const i = (y * W + x) * C;
      for (let c = 0; c < 3; c++) dirty[i + c] = Math.round((1 - al) * data[i + c] + al * 255);
    }
  }

  const fDirty = join(dir, `dirty-${n}.png`);
  const fClean = join(dir, `clean-${n}.png`);
  await sharp(dirty, { raw: { width: W, height: H, channels: C } }).png().toFile(fDirty);

  const argv = ['tools/remove-sparkle.mjs', '--in', fDirty, '--out', fClean];
  if (!tc.auto) argv.push('--center', `${tc.cx},${tc.cy}`, '--radius', String(tc.R));
  const log = execFileSync('node', argv, { encoding: 'utf8' });
  const found = tc.auto
    ? log.match(/verfeinert auf ([\d.]+), ([\d.]+), Radius ([\d.]+)/)
    : [null, String(tc.cx), String(tc.cy), String(tc.R)];

  const got = await sharp(fClean).removeAlpha().raw().toBuffer();
  let sum = 0, max = 0, cnt = 0;
  const r2 = tc.R * 2;
  for (let y = Math.floor(tc.cy - r2); y < tc.cy + r2; y++)
    for (let x = Math.floor(tc.cx - r2); x < tc.cx + r2; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const i = (y * W + x) * C;
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(got[i + c] - data[i + c]);
        sum += d; cnt++; if (d > max) max = d;
      }
    }
  const mean = sum / cnt;
  const dist = found ? Math.hypot(+found[1] - tc.cx, +found[2] - tc.cy) : Infinity;
  // Schwelle 1.5 Stufen mittlerer Fehler: unterhalb der Sichtbarkeit. Sterne
  // dicht am Bildrand liegen systematisch hoeher, weil dort weniger Umfeld fuer
  // die Hintergrundschaetzung zur Verfuegung steht (Fall 2 erreicht ~1.3).
  const ok = dist <= 1.5 && mean <= 1.5;
  if (!ok) failed++;
  console.log(
    `Fall ${n + 1} (${tc.auto ? 'Suche+Korrektur' : 'nur Korrektur '}): ` +
    (tc.auto
      ? `Mitte ${found ? `${found[1]},${found[2]}` : 'NICHT GEFUNDEN'} (${dist.toFixed(1)} px daneben), `
      : '') +
    `Fehler Mittel ${mean.toFixed(2)} max ${max} -> ${ok ? 'OK' : 'FEHLGESCHLAGEN'}`,
  );
}

console.log(failed ? `${failed} von ${CASES.length} fehlgeschlagen` : `alle ${CASES.length} Faelle bestanden`);
process.exit(failed ? 1 : 0);
