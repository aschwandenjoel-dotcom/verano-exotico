/**
 * Echte Käuferkommentare von CJdropshipping holen → src/data/customer-voices.json
 *
 * CJ liefert zu jedem Produkt die Kommentare der Käufer (Originaltexte aus dem
 * Marktplatz, aus dem CJ das Modell bezieht). Genau die Modelle, die dieser Shop
 * verkauft. Die Kommentare werden NICHT erfunden, NICHT übersetzt und NICHT
 * umgeschrieben — nur ausgewählt (Sprache, Mindeststerne, Mindestlänge).
 *
 *   node tools/cj-reviews.mjs                      # alle aktiven, gemappten Produkte
 *   node tools/cj-reviews.mjs marea-bikini sol-solid-bikini
 *   node tools/cj-reviews.mjs --dry-run            # nur Bericht, nichts schreiben
 *
 * Flags:
 *   --lang de,en       welche Sprachen behalten (Standard: de,en; "all" = alle)
 *   --min-score 4      Mindeststerne (Standard 4)
 *   --per-product 3    höchstens so viele Kommentare je Produkt (Standard 3)
 *   --max 60           höchstens so viele Kommentare insgesamt (Standard 60)
 *   --pages 1          Kommentarseiten je Produkt, 20 Stück pro Seite (Standard 1)
 *   --site https://…   Shop-URL für die Produktnamen (Standard NEXT_PUBLIC_SITE_URL)
 *   --dry-run          nichts schreiben
 *
 * Braucht CJ_API_KEY in .env.local (CJ-Dashboard → Authorization → API-Key,
 * derselbe Key wie für die Bestellabwicklung, siehe DROPSHIPPING_SETUP.md).
 *
 * Gelerntes über die CJ-API (bitte beim Anpassen beachten):
 *   • /product/productComments antwortet mit {success:true, code:0} — NICHT mit
 *     code 200 wie die übrigen Endpunkte. Wer nur auf 200 prüft, wirft bei
 *     jeder erfolgreichen Antwort einen Fehler.
 *   • Die Kommentare hängen an der pid (Produkt), nicht an der vid (Variante).
 *     src/lib/cjMapping.ts kennt nur vids → /product/variant/queryByVid liefert
 *     die pid dazu. Die pids landen im Ergebnis-JSON und werden beim nächsten
 *     Lauf wiederverwendet (spart je Produkt einen API-Call).
 *   • getAccessToken ist auf einen Aufruf pro 300 Sekunden begrenzt, der Token
 *     hält 15 Tage → wird in .tmp/cj-token.json zwischengespeichert.
 *   • Alle übrigen Endpunkte: etwa 1 Aufruf pro Sekunde. Deshalb 1.2 s Pause.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = join(ROOT, "src/data/customer-voices.json");
const TOKEN_CACHE = join(ROOT, ".tmp/cj-token.json");
const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";
const PAUSE_MS = 1200;

// ── .env.local laden ──────────────────────────────────────────────
for (const file of [".env.local", ".env"]) {
  const path = join(ROOT, file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

// ── Argumente ─────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(name, fallback) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = args[i + 1];
  args.splice(i, v && !v.startsWith("--") ? 2 : 1);
  return v && !v.startsWith("--") ? v : true;
}
const DRY_RUN = !!flag("dry-run", false);
const LANGS = String(flag("lang", "de,en")).split(",").map((s) => s.trim().toLowerCase());
const MIN_SCORE = Number(flag("min-score", 4));
const PER_PRODUCT = Number(flag("per-product", 3));
const MAX_TOTAL = Number(flag("max", 60));
const PAGES = Number(flag("pages", 1));
const SITE = String(flag("site", process.env.NEXT_PUBLIC_SITE_URL || "https://verano-exotico.ch")).replace(/\/$/, "");
const ONLY_SLUGS = args.filter((a) => !a.startsWith("--"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── CJ-Zugriff ────────────────────────────────────────────────────
async function cjGet(path) {
  const token = await getAccessToken();
  const res = await fetch(`${CJ_BASE}${path}`, {
    headers: { "CJ-Access-Token": token, "Content-Type": "application/json" },
  });
  const json = await res.json().catch(() => null);
  if (!json) throw new Error(`CJ: keine JSON-Antwort (HTTP ${res.status}) für ${path}`);
  // code 200 (die meisten Endpunkte) und code 0 (productComments) sind beides Erfolg
  const ok = json.result === true || json.success === true || json.code === 200 || json.code === 0;
  if (!ok) throw new Error(`CJ-Fehler ${json.code}: ${json.message ?? "unbekannt"} (${path})`);
  return json.data;
}

async function getAccessToken() {
  if (process.env.CJ_ACCESS_TOKEN) return process.env.CJ_ACCESS_TOKEN;
  if (globalThis.__cjToken) return globalThis.__cjToken;

  if (existsSync(TOKEN_CACHE)) {
    try {
      const c = JSON.parse(readFileSync(TOKEN_CACHE, "utf8"));
      if (c.token && c.expiresAt > Date.now() + 3600_000) {
        globalThis.__cjToken = c.token;
        return c.token;
      }
    } catch { /* kaputter Cache → neu holen */ }
  }

  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) {
    console.error(
      "❌ CJ_API_KEY fehlt in .env.local.\n" +
      "   CJ-Dashboard → Authorization → API-Key, dann in .env.local eintragen:\n" +
      "   CJ_API_KEY=CJUserNum@api@xxxxxxxx"
    );
    process.exit(1);
  }

  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  const json = await res.json().catch(() => null);
  if (!json?.data?.accessToken) {
    throw new Error(`CJ-Login fehlgeschlagen: ${json?.message ?? `HTTP ${res.status}`}`);
  }
  globalThis.__cjToken = json.data.accessToken;
  mkdirSync(dirname(TOKEN_CACHE), { recursive: true });
  writeFileSync(TOKEN_CACHE, JSON.stringify({
    token: json.data.accessToken,
    expiresAt: new Date(json.data.accessTokenExpiryDate).getTime(),
  }, null, 2));
  return globalThis.__cjToken;
}

// ── vids aus src/lib/cjMapping.ts lesen ───────────────────────────
/**
 * Erste vid je Slug. Kommentare hängen am Produkt, die Variante ist beliebig.
 * Achtung: CJ-vids sind teils rein numerisch ("1796048609918595072"), teils
 * UUIDs ("285F18DA-0690-…"). Ein Zahlen-Muster verliert fünf Produkte.
 */
function readVidsFromMapping() {
  const src = readFileSync(join(ROOT, "src/lib/cjMapping.ts"), "utf8");
  const body = src.slice(src.indexOf("cjProductMap"), src.indexOf("export function resolveVid"));
  const out = {};
  const re = /^ {2}"([a-z0-9-]+)":\s*\{([\s\S]*?)^ {2}\},/gm;
  let m;
  while ((m = re.exec(body))) {
    const vid = m[2].match(/(?:"[^"]*"|defaultVid)\s*:\s*"([^"]{8,})"/);
    if (vid) out[m[1]] = vid[1];
  }
  return out;
}

// ── Produktnamen aus dem laufenden Shop (nur aktive Produkte) ─────
async function fetchShopProducts() {
  try {
    const res = await fetch(`${SITE}/api/products`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const list = await res.json();
    if (!Array.isArray(list)) throw new Error("unerwartete Antwort");
    const map = {};
    for (const p of list) if (p?.slug) map[p.slug] = { de: p.name?.de ?? p.slug, en: p.name?.en ?? p.slug };
    return map;
  } catch (err) {
    console.warn(
      `⚠️  Produktliste von ${SITE}/api/products nicht erreichbar (${err.message}).\n` +
      "   Es werden alle gemappten Produkte abgefragt, Namen aus dem Slug gebildet."
    );
    return null;
  }
}

const titleFromSlug = (slug) =>
  slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

// ── Sprache erkennen (ohne Abhängigkeiten, bewusst grob) ──────────
const STOPWORDS = {
  de: ["und","ist","sehr","die","der","das","nicht","mit","für","fuer","auch","aber","gut","gute","schön","schoen","ich","wie","als","schnell","qualität","qualitaet","passt","größe","groesse","grösse","bestellt","alles","danke","ware","empfehlung","stoff","sitzt","genau","wieder"],
  en: ["the","and","is","very","good","nice","quality","fast","size","fits","fit","love","it","this","was","great","thanks","thank","shipping","received","described","material","cute","perfect","little","but","not","my","bikini","swimsuit","beautiful","recommend","comfortable","arrived","expected","exactly","super","well","made"],
  es: ["muy","bueno","buena","calidad","que","por","con","para","llegó","llego","talla","gracias","pero","todo","bien","rápido","rapido","producto","como","tela","excelente","recomiendo"],
  pt: ["muito","bom","boa","qualidade","chegou","produto","obrigada","como","não","nao","tudo","bem","rápido","rapido","veio","tamanho","gostei"],
  fr: ["très","tres","bien","qualité","qualite","pas","est","pour","avec","taille","merci","reçu","recu","bonne","conforme","rapide","joli"],
  it: ["molto","bello","bella","qualità","qualita","come","per","con","non","tutto","arrivato","taglia","grazie","buona","perfetto"],
  nl: ["heel","goed","mooi","kwaliteit","maar","niet","met","voor","snel","bedankt","zoals"],
  pl: ["bardzo","dobry","dobra","jakość","jakosc","szybko","ale","nie","jest","dla","polecam"],
  tr: ["çok","cok","güzel","guzel","kalite","hızlı","hizli","ama","değil","degil","için","icin","teşekkürler"],
};

function detectLang(text) {
  const letters = [...text].filter((c) => /\p{L}/u.test(c));
  if (letters.length === 0) return "other";
  const latin = letters.filter((c) => /\p{Script=Latin}/u.test(c)).length;
  if (latin / letters.length < 0.8) return "other"; // kyrillisch, arabisch, CJK …

  const words = text.toLowerCase().match(/[\p{L}äöüßàâçéèêëîïôùûœ]+/gu) ?? [];
  let best = null;
  let bestScore = 0;
  for (const [lang, list] of Object.entries(STOPWORDS)) {
    const score = words.filter((w) => list.includes(w)).length;
    if (score > bestScore) { best = lang; bestScore = score; }
  }
  if (bestScore === 0) {
    // Kein Treffer: reines ASCII ohne Diakritika ist mit grosser Wahrscheinlichkeit Englisch
    return /^[\x00-\x7F]*$/.test(text) ? "en" : "other";
  }
  return best;
}

// ── Kommentare filtern ────────────────────────────────────────────
/**
 * CJ liefert HTML-Entities im Klartext — numerisch ("seller&#39;s") und
 * benannt ("qualit&eacute;", "&uuml;ber"). Node bringt dafür nichts mit, und
 * eine Abhängigkeit lohnt für diese Handvoll Zeichen nicht.
 */
const NAMED_ENTITIES = {
  quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", laquo: "«", raquo: "»",
  ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’",
  hellip: "…", ndash: "–", mdash: "—", deg: "°", euro: "€", eacute: "é",
  egrave: "è", ecirc: "ê", euml: "ë", aacute: "á", agrave: "à", acirc: "â",
  auml: "ä", aring: "å", atilde: "ã", aelig: "æ", iacute: "í", igrave: "ì",
  icirc: "î", iuml: "ï", oacute: "ó", ograve: "ò", ocirc: "ô", ouml: "ö",
  oslash: "ø", otilde: "õ", uacute: "ú", ugrave: "ù", ucirc: "û", uuml: "ü",
  yacute: "ý", yuml: "ÿ", ccedil: "ç", ntilde: "ñ", szlig: "ß",
  Eacute: "É", Egrave: "È", Aacute: "Á", Agrave: "À", Auml: "Ä", Ouml: "Ö",
  Uuml: "Ü", Ccedil: "Ç", Ntilde: "Ñ", Oslash: "Ø", Aring: "Å", AElig: "Æ",
};

function decodeEntities(s) {
  return String(s ?? "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-zA-Z]+);/g, (whole, name) => NAMED_ENTITIES[name] ?? whole)
    .replace(/&amp;/g, "&"); // zuletzt, sonst würde "&amp;#39;" doppelt aufgelöst
}

const normalize = (s) =>
  decodeEntities(s).replace(/\s*\n\s*/g, " ").replace(/\s{2,}/g, " ").trim();

const dedupeKey = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "").slice(0, 120);

function usable(comment) {
  const text = normalize(comment.comment);
  if (text.length < 20 || text.length > 400) return null;      // zu dünn / zu lang für die Bühne
  const words = text.split(/\s+/).filter((w) => /\p{L}/u.test(w));
  if (words.length < 4) return null;                            // "good", "ok", "👍"
  if (/(.)\1{5,}/.test(text)) return null;                      // "aaaaaaa"
  const score = Number(comment.score);
  if (!Number.isFinite(score) || score < MIN_SCORE) return null;
  const lang = detectLang(text);
  if (!LANGS.includes("all") && !LANGS.includes(lang)) return null;
  return { text, score: Math.round(score), lang };
}

// ── Lauf ──────────────────────────────────────────────────────────
const previous = existsSync(OUT_FILE)
  ? JSON.parse(readFileSync(OUT_FILE, "utf8"))
  : { pids: {}, voices: [] };
const pids = { ...(previous.pids ?? {}) };

const vids = readVidsFromMapping();
const shopProducts = await fetchShopProducts();

let slugs = Object.keys(vids);
if (shopProducts) slugs = slugs.filter((s) => shopProducts[s]);      // nur was aktiv im Shop steht
if (ONLY_SLUGS.length) slugs = slugs.filter((s) => ONLY_SLUGS.includes(s));

if (slugs.length === 0) {
  console.error("❌ Keine Produkte zu prüfen. Slug falsch geschrieben, oder Produkt nicht in src/lib/cjMapping.ts?");
  process.exit(1);
}

console.log(`CJ-Kommentare für ${slugs.length} Produkt(e) · Sprachen: ${LANGS.join(",")} · ab ${MIN_SCORE}★\n`);

const perProduct = [];   // [[voice, …], …] — für die Reihum-Mischung
const seen = new Set();
let apiCalls = 0;

for (const [i, slug] of slugs.entries()) {
  const label = `[${String(i + 1).padStart(2)}/${slugs.length}] ${slug}`;
  try {
    if (!pids[slug]) {
      const variant = await cjGet(`/product/variant/queryByVid?vid=${encodeURIComponent(vids[slug])}`);
      apiCalls++;
      if (!variant?.pid) throw new Error("keine pid zur vid — Variante bei CJ gelöscht?");
      pids[slug] = variant.pid;
      await sleep(PAUSE_MS);
    }

    const kept = [];
    let total = null;
    for (let page = 1; page <= PAGES && kept.length < PER_PRODUCT; page++) {
      const data = await cjGet(
        `/product/productComments?pid=${encodeURIComponent(pids[slug])}&pageNum=${page}&pageSize=20`
      );
      apiCalls++;
      total = Number(data?.total ?? 0);
      const list = Array.isArray(data?.list) ? data.list : [];
      for (const c of list) {
        const ok = usable(c);
        if (!ok) continue;
        const key = dedupeKey(ok.text);
        if (seen.has(key)) continue;                             // CJ zeigt denselben Text an mehreren Modellen
        seen.add(key);
        kept.push({
          // NICHT c.commentId: CJ vergibt dieselbe ID an verschiedene
          // Kommentare (bei costa-alta-highwaist-bikini teilten sich drei
          // Texte eine). Als React-key führt das zu verschluckten Einträgen.
          // Hash über Slug + Text ist eindeutig und über Läufe hinweg stabil.
          id: createHash("sha1").update(`${slug}|${ok.text}`).digest("hex").slice(0, 12),
          cjCommentId: String(c.commentId),
          slug,
          product: shopProducts?.[slug] ?? { de: titleFromSlug(slug), en: titleFromSlug(slug) },
          rating: ok.score,
          comment: ok.text,
          lang: ok.lang,
          author: normalize(c.commentUser) || "Anonym",
          country: String(c.countryCode ?? "").slice(0, 2).toUpperCase() || null,
          date: String(c.commentDate ?? "").slice(0, 10) || null,
        });
        if (kept.length >= PER_PRODUCT) break;
      }
      if (list.length < 20) break;                               // letzte Seite
      await sleep(PAUSE_MS);
    }

    console.log(`${label} — ${total ?? 0} Kommentare bei CJ, ${kept.length} übernommen`);
    if (kept.length) perProduct.push(kept);
    await sleep(PAUSE_MS);
  } catch (err) {
    console.log(`${label} — übersprungen: ${err.message}`);
    await sleep(PAUSE_MS);
  }
}

// Reihum einsammeln, damit im Ticker nicht dreimal dasselbe Produkt hintereinander kommt
const voices = [];
for (let round = 0; voices.length < MAX_TOTAL; round++) {
  const before = voices.length;
  for (const list of perProduct) {
    if (list[round] && voices.length < MAX_TOTAL) voices.push(list[round]);
  }
  if (voices.length === before) break;
}

const payload = {
  generatedAt: new Date().toISOString(),
  source: "cjdropshipping",
  note: "Originalkommentare von Käufern derselben Modelle über CJdropshipping. Ausgewählt (Sprache, Sterne, Länge), im Wortlaut unverändert.",
  filter: { langs: LANGS, minScore: MIN_SCORE, perProduct: PER_PRODUCT, max: MAX_TOTAL },
  pids,
  voices,
};

console.log(
  `\n${voices.length} Kommentare aus ${perProduct.length} Produkt(en) · ${apiCalls} API-Aufrufe`
);

if (DRY_RUN) {
  console.log("\n--dry-run: nichts geschrieben. Vorschau:\n");
  for (const v of voices.slice(0, 8)) {
    console.log(`  ${"★".repeat(v.rating)} ${v.author} (${v.country ?? "??"}) · ${v.product.de}`);
    console.log(`    ${v.comment}\n`);
  }
} else {
  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + "\n");
  console.log(`→ ${OUT_FILE.replace(ROOT + "/", "")} geschrieben`);
  if (voices.length === 0) {
    console.log("   (leer → die Sektion auf der Startseite bleibt unsichtbar, statt Platzhalter zu zeigen)");
  }
}
