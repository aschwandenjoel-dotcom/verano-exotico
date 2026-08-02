#!/usr/bin/env node
/**
 * Entfernt die vierzackige Stern-Einblendung, die die Gemini-App in generierte
 * Bilder setzt.
 *
 * Der Stern ist eine halbtransparente weisse Ueberlagerung:
 *
 *     beobachtet = (1 - a) * original + a * 255
 *
 * Nach `original` aufgeloest laesst sich der Untergrund exakt zurueckrechnen,
 * solange a bekannt ist. Dadurch bleiben Strukturen unter dem Stern erhalten,
 * statt geklont oder geraten zu werden.
 *
 * Das Tool kalibriert sich selbst:
 *   1. Stern finden        - Ueberhelligkeit gegen weichgezeichneten Hintergrund
 *   2. Form anpassen       - Superellipse |dx/R|^k + |dy/R|^k, k < 1 (vier Zacken)
 *   3. Deckkraft MESSEN    - Median je Formwert-Band, nicht modelliert
 *   4. Zurueckrechnen      - obige Gleichung, Kanalwerte begrenzt
 *
 * Schritt 3 ist der entscheidende. Ein modellierter Kantenverlauf (volle
 * Deckkraft bis t=1, dann Abfall) hinterlaesst einen dunklen Saum: real bricht
 * die Deckkraft schon ab t=0.95 ein. Der Median macht die Messung unempfindlich
 * gegen helle Bildinhalte, die den Stern zufaellig kreuzen.
 *
 * Aufruf:
 *   node tools/remove-sparkle.mjs --in <bild> --out <bild> [--verify <png>]
 *   node tools/remove-sparkle.mjs --in a.png --out b.png --center 807,1031 --radius 29
 *
 * Flags:
 *   --in <pfad>        (Pflicht) Eingabebild
 *   --out <pfad>       (Pflicht) Ausgabebild
 *   --center x,y       Mitte des Sterns. Ohne Angabe: automatische Suche
 *   --radius <n>       Radius. Ohne Angabe: automatisch angepasst
 *   --k <n>            Formexponent, Default 0.6
 *   --gain <n>         Faktor auf die gemessene Deckkraft, Default 1
 *   --search x,y,w,h   Suchbereich fuer die Automatik, Default: Ecke unten rechts
 *   --verify <pfad>    Vergleichsbild vorher/nachher schreiben
 *   --dry              Nur messen und berichten, nichts schreiben
 */
import sharp from 'sharp';

const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : def;
};
const has = (name) => args.includes(`--${name}`);

const IN = flag('in');
const OUT = flag('out');
const DRY = has('dry');
if (!IN || (!OUT && !DRY)) {
  console.error('Aufruf: node tools/remove-sparkle.mjs --in <bild> --out <bild>');
  process.exit(1);
}

const K = Number(flag('k', '0.6'));
const GAIN = Number(flag('gain', '1'));
const VERIFY = flag('verify');
const R_LIST = [16, 20, 24, 28, 32, 36, 40];
const MIN_LIFT = Number(flag('min-lift', '12')); // Mindestaufhellung des Kerns in Stufen

const { data, info } = await sharp(IN).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

const lumAt = (x, y) => {
  const i = (y * W + x) * C;
  return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
};

/**
 * Separable Boxweichzeichnung mit gleitender Summe - Laufzeit unabhaengig vom
 * Radius. Das ist noetig, weil der Hintergrund mit grossem Radius geschaetzt
 * werden muss (siehe locate): ein zu kleiner Radius mittelt den Stern selbst
 * mit ein und laesst ihn dadurch verschwinden.
 */
function boxBlur(src, w, h, r) {
  const tmp = new Float64Array(w * h);
  const out = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let s = 0;
    for (let x = 0; x <= Math.min(r, w - 1); x++) s += src[row + x];
    for (let x = 0; x < w; x++) {
      const lo = Math.max(0, x - r), hi = Math.min(w - 1, x + r);
      tmp[row + x] = s / (hi - lo + 1);
      if (x + r + 1 < w) s += src[row + x + r + 1];
      if (x - r >= 0) s -= src[row + x - r];
    }
  }
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let y = 0; y <= Math.min(r, h - 1); y++) s += tmp[y * w + x];
    for (let y = 0; y < h; y++) {
      const lo = Math.max(0, y - r), hi = Math.min(h - 1, y + r);
      out[y * w + x] = s / (hi - lo + 1);
      if (y + r + 1 < h) s += tmp[(y + r + 1) * w + x];
      if (y - r >= 0) s -= tmp[(y - r) * w + x];
    }
  }
  return out;
}

// ── 1. Stern finden ───────────────────────────────────────────────
/**
 * Sucht den Stern per Formabgleich.
 *
 * "Hellster kompakter Fleck" genuegt NICHT - helle Bildinhalte (ein weisses
 * Kleidungsstueck, Sand in der Sonne) gewinnen dagegen immer. Zwei Merkmale
 * unterscheiden die Einblendung zuverlaessig:
 *
 *   Form    - vier konkave Zacken, nicht irgendein runder Klecks
 *   Kerben  - die Einbuchtungen zwischen den Zacken liegen auf Hintergrund-
 *             niveau; ein runder heller Fleck fuellt sie mit aus
 *
 * Gesucht wird grob auf 1/3-Aufloesung, danach fein bei voller.
 */
function locate(region) {
  const { left, top, width: rw, height: rh } = region;
  const lum = new Float64Array(rw * rh);
  for (let y = 0; y < rh; y++)
    for (let x = 0; x < rw; x++) lum[y * rw + x] = lumAt(left + x, top + y);

  /**
   * Aufhellung gegen den Hintergrund, MASSGESCHNEIDERT auf eine Sterngroesse.
   *
   * Der Filterradius muss mit R skalieren, und zwar in beide Richtungen:
   * zu klein (Radius 34 bei R=32) mittelt den Stern mit ein und laesst ihn
   * verschwinden; ein fuer alle Groessen fester grosser Radius macht dagegen
   * jede grossflaechig helle Zone zum Treffer. Deshalb wird je Kandidaten-
   * radius ein eigener Bandpass gerechnet.
   */
  const excessFor = (R) => {
    const bg = boxBlur(lum, rw, rh, Math.round(R * 2.5));
    const fine = boxBlur(lum, rw, rh, Math.max(1, Math.round(R / 5)));
    const e = new Float64Array(rw * rh);
    for (let p = 0; p < rw * rh; p++) e[p] = fine[p] - bg[p];
    return e;
  };

  const D = 3;
  const dw = Math.floor(rw / D), dh = Math.floor(rh / D);
  const downsample = (src) => {
    const E = new Float64Array(dw * dh);
    for (let y = 0; y < dh; y++)
      for (let x = 0; x < dw; x++) {
        let s = 0;
        for (let j = 0; j < D; j++) for (let i = 0; i < D; i++) s += src[(y * D + j) * rw + x * D + i];
        E[y * dw + x] = s / (D * D);
      }
    return E;
  };

  /**
   * Bewertung einer Position.
   *
   * Entscheidend sind die KERBEN zwischen den Zacken: beim echten Stern liegen
   * sie auf Hintergrundniveau, waehrend ein heller Bildinhalt (Stoff, Reflex)
   * sie mit anhebt. Reine Helligkeit taugt nicht - gemessen an einem echten
   * Beispiel hob ein weisses Kleidungsstueck den Kern um 95 Stufen, der Stern
   * nur um 45. Ueber das Kerbenverhaeltnis kippt der Vergleich eindeutig.
   */
  const evaluate = (buf, bw, bh, px, py, rad) => {
    const rr = Math.ceil(rad * 1.5);
    let sP = 0, sT = 0, n = 0;
    let sIn = 0, nIn = 0, sOut = 0, nOut = 0, sNotch = 0, nNotch = 0;
    const P = [], T = [];
    // px/py duerfen gebrochen sein - das Raster bleibt ganzzahlig, nur der
    // Formwert wird gegen die gebrochene Mitte gerechnet (Subpixel-Genauigkeit)
    for (let y = Math.floor(py - rr); y <= Math.ceil(py + rr); y++) {
      for (let x = Math.floor(px - rr); x <= Math.ceil(px + rr); x++) {
        const dx = x - px, dy = y - py;
        if (x < 0 || y < 0 || x >= bw || y >= bh) return null;
        const t = Math.pow(Math.abs(dx / rad), K) + Math.pow(Math.abs(dy / rad), K);
        const r = Math.hypot(dx, dy) / rad;
        const v = buf[y * bw + x];
        const tv = t <= 1 ? 1 : 0;
        P.push(v); T.push(tv); sP += v; sT += tv; n++;
        if (t <= 0.6) { sIn += v; nIn++; }
        else if (t > 1.25 && r < 1.5) { sOut += v; nOut++; }
        if (t > 1.3 && r > 0.5 && r < 0.95) { sNotch += v; nNotch++; }
      }
    }
    if (nIn < 6 || nOut < 6 || nNotch < 4) return null;
    const mIn = sIn / nIn, mOut = sOut / nOut, mNotch = sNotch / nNotch;
    const lift = mIn - mOut;
    // Eine echte Einblendung hebt den Kern deutlich an (gemessen ~45 Stufen).
    // Ohne diese Untergrenze passt sich die Korrelation an blosses Rauschen an.
    if (lift < MIN_LIFT || mIn <= 0) return null;

    // Normierte Kreuzkorrelation mit der Sternform. Sie bewertet die FORM und
    // ist unabhaengig vom Kontrast - anders als die blosse Aufhellung, die
    // zwangslaeufig jeden kleinen hellen Fleck bevorzugt.
    const mP = sP / n, mT = sT / n;
    let num = 0, dP = 0, dT = 0;
    for (let i = 0; i < n; i++) {
      const p = P[i] - mP, t = T[i] - mT;
      num += p * t; dP += p * p; dT += t * t;
    }
    if (dP <= 0 || dT <= 0) return null;
    const ncc = num / Math.sqrt(dP * dT);

    // Kerben duerfen hoechstens ein Viertel der Kernaufhellung erreichen.
    // Begrenzung auf [0,1], sonst laesst eine negative Kerbe die Guete explodieren.
    const purity = Math.max(0, Math.min(1, 1 - mNotch / (0.25 * mIn)));
    return { lift, notch: mNotch, ncc, score: ncc * purity };
  };

  // Grobsuche: je Kandidatenradius mit dem dazu passenden Bandpass
  const excCache = new Map();
  let coarse = null;
  for (const R of R_LIST) {
    const exc = excessFor(R);
    excCache.set(R, exc);
    const E = downsample(exc);
    const rd = R / D;
    for (let y = 0; y < dh; y++)
      for (let x = 0; x < dw; x++) {
        const e = evaluate(E, dw, dh, x, y, rd);
        if (e && (!coarse || e.score > coarse.score)) coarse = { ...e, x, y, R };
      }
  }
  if (!coarse) return null;

  // Feinsuche bei voller Aufloesung um den Grobtreffer
  const exc = excCache.get(coarse.R);
  let fine = null;
  const gx = coarse.x * D, gy = coarse.y * D;
  for (let y = gy - 5; y <= gy + 5; y++)
    for (let x = gx - 5; x <= gx + 5; x++)
      for (let R = coarse.R - 6; R <= coarse.R + 6; R++) {
        if (R < 12) continue;
        const e = evaluate(exc, rw, rh, x, y, R);
        if (e && (!fine || e.score > fine.score)) fine = { ...e, x, y, R };
      }
  if (!fine) return null;

  return {
    cx: left + fine.x, cy: top + fine.y, R: fine.R,
    lift: fine.lift, notch: fine.notch, ncc: fine.ncc, score: fine.score,
  };
}

// ── 2./3. Hintergrund schaetzen und Deckkraft messen ──────────────
/**
 * Hintergrund innerhalb der Box per normalisierter Faltung: Pixel unter dem
 * Stern bekommen Gewicht 0, der Rest wird glatt darueber interpoliert.
 */
function backgroundBox(box, cx, cy, R) {
  const { left, top, width: bw, height: bh } = box;
  const out = [];
  const wgt = new Float64Array(bw * bh);
  for (let y = 0; y < bh; y++)
    for (let x = 0; x < bw; x++) {
      const t = shapeVal(left + x, top + y, cx, cy, R);
      wgt[y * bw + x] = t > 1.45 ? 1 : 0;
    }
  const wb = boxBlur(wgt, bw, bh, Math.round(R * 1.1));
  for (let c = 0; c < 3; c++) {
    const v = new Float64Array(bw * bh);
    for (let y = 0; y < bh; y++)
      for (let x = 0; x < bw; x++) v[y * bw + x] = data[((top + y) * W + left + x) * C + c] * wgt[y * bw + x];
    const vb = boxBlur(v, bw, bh, Math.round(R * 1.1));
    const g = new Float64Array(bw * bh);
    for (let p = 0; p < bw * bh; p++) g[p] = wb[p] > 1e-6 ? vb[p] / wb[p] : 0;
    out.push(g);
  }
  return out;
}

const shapeVal = (x, y, cx, cy, R) =>
  Math.pow(Math.abs((x - cx) / R), K) + Math.pow(Math.abs((y - cy) / R), K);

/** Median der beobachteten Deckkraft je Formwert-Band. */
function measureProfile(cx, cy, R) {
  const half = Math.ceil(R * 2.2);
  const box = {
    left: Math.max(0, Math.round(cx - half)),
    top: Math.max(0, Math.round(cy - half)),
    width: 0, height: 0,
  };
  box.width = Math.min(W - box.left, Math.round(cx + half) - box.left);
  box.height = Math.min(H - box.top, Math.round(cy + half) - box.top);

  const bg = backgroundBox(box, cx, cy, R);
  const bins = new Map();
  for (let y = 0; y < box.height; y++) {
    for (let x = 0; x < box.width; x++) {
      const gx = box.left + x, gy = box.top + y;
      const t = shapeVal(gx, gy, cx, cy, R);
      if (t > 3) continue;
      const p = y * box.width + x;
      let s = 0;
      for (let c = 0; c < 3; c++) {
        const o = data[(gy * W + gx) * C + c];
        s += (o - bg[c][p]) / (255 - bg[c][p]);
      }
      const b = Math.round(t / 0.05);
      if (!bins.has(b)) bins.set(b, []);
      bins.get(b).push(s / 3);
    }
  }
  const med = (b) => {
    const v = bins.get(b).sort((a, z) => a - z);
    return v[v.length >> 1];
  };
  const keys = [...bins.keys()].sort((a, z) => a - z);
  const far = keys.filter((b) => b * 0.05 > 2.0);
  const base = far.length ? far.reduce((s, b) => s + med(b), 0) / far.length : 0;

  const prof = [];
  for (const b of keys) {
    const t = b * 0.05;
    if (t > 1.6) break;
    prof.push([t, Math.max(0, med(b) - base)]);
  }
  // Ab dem ersten vernachlaessigbaren Wert jenseits der Kante auf 0 zwingen
  let cut = prof.length;
  for (let i = 0; i < prof.length; i++) {
    if (prof[i][0] > 1.0 && prof[i][1] < 0.012) { cut = i; break; }
  }
  const trimmed = prof.slice(0, cut);
  trimmed.push([trimmed.length ? trimmed[trimmed.length - 1][0] + 0.05 : 1.25, 0]);
  return trimmed;
}

// ── Ablauf ────────────────────────────────────────────────────────
let cx, cy, R, autoR = null;
const centerArg = flag('center');
if (centerArg) {
  [cx, cy] = centerArg.split(',').map(Number);
} else {
  const s = flag('search');
  const region = s
    ? (([l, t, w, h]) => ({ left: l, top: t, width: w, height: h }))(s.split(',').map(Number))
    // Die App setzt den Stern in die Ecke unten rechts (gemessen: rund 13% der
    // Breite und 10% der Hoehe eingerueckt). Ein enger Suchbereich ist der
    // wirksamste Schutz gegen Fehltreffer auf hellen Bildinhalten.
    : { left: Math.round(W * 0.70), top: Math.round(H * 0.76),
        width: W - Math.round(W * 0.70), height: H - Math.round(H * 0.76) };
  const found = locate(region);
  if (!found) {
    console.error('Kein Stern gefunden - Suchbereich mit --search eingrenzen oder --center setzen.');
    process.exit(2);
  }
  cx = found.cx;
  cy = found.cy;
  autoR = found.R;
  console.log(
    `gefunden bei ${cx.toFixed(1)}, ${cy.toFixed(1)} ` +
    `(Aufhellung ${found.lift.toFixed(1)}, Kerbe ${found.notch.toFixed(1)}, Form ${found.ncc.toFixed(2)}, Guete ${found.score.toFixed(2)}, Radius ~${found.R})`,
  );
}

const radiusArg = flag('radius');
if (radiusArg) {
  R = Number(radiusArg);
} else if (autoR) {
  R = autoR;                       // aus dem Formabgleich, zuverlaessiger als eine Kantenheuristik
} else {
  console.error('Ohne --center muss die Automatik laufen; sonst --radius angeben.');
  process.exit(2);
}

/**
 * Verfeinert Mitte und Radius auf Subpixel.
 *
 * Die Formkorrelation peilt die Mitte nur grob an - bei starkem Bildmotiv
 * (hier eine diagonale Tischkante) lag sie 3 px daneben, was die Korrektur
 * seitlich versetzt: eine Haelfte bleibt zu hell, die andere wird zu dunkel.
 *
 * Kriterium hier ist darum direkt das, worauf es ankommt: die gemessene
 * Deckkraft muss an der Sternkante moeglichst abrupt abfallen. Sitzt die Mitte
 * daneben, verschmiert der Abfall ueber mehrere Baender.
 *
 * Der Hintergrund wird dafuer einmal geschaetzt und wiederverwendet - er haengt
 * kaum von der genauen Mitte ab, und eine Neuschaetzung je Kandidat waere um
 * Groessenordnungen teurer.
 */
function refine(cx0, cy0, R0) {
  const half = Math.ceil(R0 * 2.2);
  const box = {
    left: Math.max(0, Math.round(cx0 - half)),
    top: Math.max(0, Math.round(cy0 - half)),
    width: 0, height: 0,
  };
  box.width = Math.min(W - box.left, Math.round(cx0 + half) - box.left);
  box.height = Math.min(H - box.top, Math.round(cy0 + half) - box.top);

  const bg = backgroundBox(box, cx0, cy0, R0);
  const pts = [];
  for (let y = 0; y < box.height; y++)
    for (let x = 0; x < box.width; x++) {
      const p = y * box.width + x;
      let s = 0;
      for (let c = 0; c < 3; c++) {
        const o = data[((box.top + y) * W + box.left + x) * C + c];
        s += (o - bg[c][p]) / (255 - bg[c][p]);
      }
      pts.push({ x: box.left + x, y: box.top + y, a: s / 3 });
    }

  let best = { cx: cx0, cy: cy0, R: R0, sharp: -Infinity };
  for (let cy = cy0 - 3; cy <= cy0 + 3; cy += 0.5)
    for (let cx = cx0 - 3; cx <= cx0 + 3; cx += 0.5)
      for (let R = Math.max(12, R0 - 4); R <= R0 + 4; R += 0.5) {
        let sIn = 0, nIn = 0, sOut = 0, nOut = 0;
        for (const q of pts) {
          const t = shapeVal(q.x, q.y, cx, cy, R);
          if (t >= 0.75 && t <= 0.95) { sIn += q.a; nIn++; }
          else if (t >= 1.05 && t <= 1.25) { sOut += q.a; nOut++; }
        }
        if (nIn < 10 || nOut < 10) continue;
        const sharp = sIn / nIn - sOut / nOut;
        if (sharp > best.sharp) best = { cx, cy, R, sharp };
      }
  return best;
}

if (!radiusArg && !centerArg) {
  const r = refine(cx, cy, R);
  cx = r.cx; cy = r.cy; R = r.R;
  console.log(`verfeinert auf ${cx.toFixed(1)}, ${cy.toFixed(1)}, Radius ${R} (Kantenschaerfe ${r.sharp.toFixed(3)})`);
}

const PROFILE = measureProfile(cx, cy, R);
const T_MAX = PROFILE[PROFILE.length - 1][0];
console.log('gemessenes Profil:', PROFILE.map(([t, a]) => `${t.toFixed(2)}:${a.toFixed(3)}`).join(' '));

function alphaAt(t) {
  if (t >= T_MAX) return 0;
  if (t <= PROFILE[0][0]) return PROFILE[0][1];
  for (let i = 1; i < PROFILE.length; i++) {
    const [t1, a1] = PROFILE[i];
    if (t <= t1) {
      const [t0, a0] = PROFILE[i - 1];
      return a0 + ((a1 - a0) * (t - t0)) / (t1 - t0);
    }
  }
  return 0;
}

if (DRY) {
  console.log('--dry: nichts geschrieben.');
  process.exit(0);
}

const out = Buffer.from(data);
let touched = 0, clipped = 0;
const pad = Math.ceil(R * T_MAX) + 2;
for (let y = Math.max(0, Math.floor(cy - pad)); y <= Math.min(H - 1, Math.ceil(cy + pad)); y++) {
  for (let x = Math.max(0, Math.floor(cx - pad)); x <= Math.min(W - 1, Math.ceil(cx + pad)); x++) {
    const a = alphaAt(shapeVal(x, y, cx, cy, R)) * GAIN;
    if (a <= 0) continue;
    const i = (y * W + x) * C;
    for (let c = 0; c < 3; c++) {
      const v = (data[i + c] - a * 255) / (1 - a);
      if (v < 0 || v > 255) clipped++;
      out[i + c] = Math.round(Math.max(0, Math.min(255, v)));
    }
    touched++;
  }
}

await sharp(out, { raw: { width: W, height: H, channels: C } })
  .png({ compressionLevel: 9 })
  .toFile(OUT);
console.log(`${touched} Pixel korrigiert (${clipped} Kanalwerte begrenzt) -> ${OUT}`);

if (VERIFY) {
  const cw = Math.min(W, pad * 4), ch = Math.min(H, pad * 4);
  const cl = Math.max(0, Math.min(W - cw, Math.round(cx - cw / 2)));
  const ct = Math.max(0, Math.min(H - ch, Math.round(cy - ch / 2)));
  const crop = (buf) =>
    sharp(buf, { raw: { width: W, height: H, channels: C } })
      .extract({ left: cl, top: ct, width: cw, height: ch })
      .png()
      .toBuffer();
  const [a, b] = await Promise.all([crop(data), crop(out)]);
  await sharp({ create: { width: cw * 2 + 12, height: ch, channels: 3, background: '#222222' } })
    .composite([{ input: a, left: 0, top: 0 }, { input: b, left: cw + 12, top: 0 }])
    .png()
    .toFile(VERIFY);
  console.log(`Vergleich (links vorher, rechts nachher) -> ${VERIFY}`);
}
