#!/usr/bin/env node
/**
 * Beantwortet Kommentare unter den eigenen Instagram- und Facebook-Reels.
 *
 * Bewusst regelbasiert statt KI: jede Antwort stammt aus festen Bausteinen
 * mit echten Shopdaten (Preis, Grössen, Farben aus dem Google-Feed, Versand
 * aus der Versandseite). So kann das Tool nichts Falsches versprechen.
 *
 * Geantwortet wird nur auf klare Fälle:
 *   Preis · Grösse · Versand/Lieferzeit · Bezahlung · Wo kaufen · Farben ·
 *   genannte Lieblingsfarbe · genanntes Ferienziel · Kompliment/Emojis
 * Liegen bleiben (und werden gemeldet): unklare Fragen, Kritik/Reklamation,
 * Spam. Die beantwortet Joel selbst.
 *
 * Bereits beantwortete Kommentare erkennt das Tool an der eigenen Antwort im
 * Thread — es braucht keinen Zwischenspeicher und antwortet nie doppelt.
 *
 * Aufruf:
 *   node tools/instagram-comments.mjs                 Probelauf: zeigt, was es antworten würde
 *   node tools/instagram-comments.mjs --reply         antwortet wirklich
 *   node tools/instagram-comments.mjs --check         prüft die Rechte des Tokens
 *   Optionen: --posts 10 (letzte N Beiträge) · --days 14 (nur jüngere Kommentare)
 *             --max 15 (höchstens N Antworten pro Lauf) · --no-facebook
 *             --every 3 (nur laufen, wenn der letzte --reply-Lauf 3 Tage her ist)
 *
 * Rechte: Instagram instagram_manage_comments, Facebook pages_manage_engagement
 * (Seiten-Token aus .env.local, siehe workflows/instagram_automatisierung.md).
 * Protokoll: .tmp/comments/log.jsonl (gesendete Antworten)
 * Offene Kommentare für Joel: .tmp/comments/offen.md (wird jeden Lauf neu
 * geschrieben); neue davon melden sich auf dem Mac als Mitteilung.
 */
import { existsSync, readFileSync, writeFileSync, appendFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://graph.facebook.com/v23.0";
const SHOP = "https://verano-exotico.ch";

// ---------- .env.local ----------
const envPath = path.join(ROOT, ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const USER_ID = process.env.INSTAGRAM_USER_ID;
if (!TOKEN || !USER_ID) {
  console.error("❌ INSTAGRAM_ACCESS_TOKEN und INSTAGRAM_USER_ID fehlen in .env.local.");
  process.exit(1);
}

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : fallback;
}
const has = (name) => process.argv.includes(`--${name}`);
const REPLY = has("reply");
const POSTS = Number(arg("posts", "10"));
const DAYS = Number(arg("days", "14"));
const MAX = Number(arg("max", "15"));

async function graph(endpoint, params = {}, method = "GET") {
  const url = new URL(`${API}${endpoint}`);
  const body = { ...params, access_token: TOKEN };
  let res;
  if (method === "GET") {
    for (const [k, v] of Object.entries(body)) url.searchParams.set(k, String(v));
    res = await fetch(url);
  } else {
    res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }
  const data = await res.json().catch(() => ({}));
  if (data.error) {
    const e = data.error;
    throw new Error(`${e.type ?? "Graph-Fehler"} (#${e.code ?? "?"}): ${e.message}`);
  }
  return data;
}

// ---------- Shopdaten (öffentlicher Google-Feed) ----------
const SHIPPING = { days: "5–14 Werktage", daysEn: "5–14 working days", ch: "CHF 4.90" };

async function loadProducts() {
  const xml = await (await fetch(`${SHOP}/feed/google.xml`)).text();
  const bySlug = {};
  for (const it of xml.match(/<item>[\s\S]*?<\/item>/g) ?? []) {
    const get = (tag) => it.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1]?.trim();
    const link = get("g:link") ?? get("link") ?? "";
    const slug = link.match(/\/product\/([^/?#]+)/)?.[1];
    if (!slug) continue;
    const title = (get("g:title") ?? get("title") ?? "").replace(/&amp;/g, "&");
    const [name, color] = title.split(" – ");
    const p = (bySlug[slug] ??= { slug, name, price: get("g:price")?.replace(/\s*CHF/, ""), colors: [], sizes: new Set() });
    if (color && !p.colors.includes(color)) p.colors.push(color);
    const size = get("g:size");
    if (size) p.sizes.add(size);
  }
  return bySlug;
}
const sizeRange = (p) => {
  const order = ["XS", "S", "M", "L", "XL", "XXL"];
  const s = [...(p?.sizes ?? [])].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return s.length > 1 ? `${s[0]}–${s[s.length - 1]}` : s[0] ?? "S–L";
};

// ---------- Erkennen ----------
const norm = (s) => s.toLowerCase().replace(/ß/g, "ss");
const SPAM = /https?:\/\/|www\.|\bdm (us|me)\b|promot|collab|ambassador|brand ?partner|check (my|out my)|follow (me|back)|send (a )?pic|crypto|bitcoin|earn money|verdien/;
const NEGATIVE = /fake|betrug|scam|abzocke|nie angekommen|nicht angekommen|noch nicht da|reklamation|r(ü|ue)ckgabe|zur(ü|ue)ck ?schick|kaputt|schlecht|entt(ä|ae)uscht|schrott|wish|temu|shein|aliexpress|dropship/;
const EN = /\b(how|what|where|price|size|ship|love|beautiful|gorgeous|is it|do you|does|the|want)\b/;
const DE = /\b(wie|was|wo|der|die|das|ist|gibt|kostet|grösse|ich|du|mega|schön|hast|habt)\b/;

const COLORS = [
  [/neon ?gr(ü|ue)n|neon/, "Neongrün", "💚"], [/weinrot|bordeaux|dunkelrot/, "Weinrot", "❤️"], [/rosarot|pink|🩷|💗|💖/, "Pink", "💖"],
  [/rosa/, "Rosa", "🌸"], [/blau|blue|💙/, "Blau", "💙"], [/schwarz|black|🖤/, "Schwarz", "🖤"], [/weiss|white|🤍/, "Weiss", "🤍"],
  [/orange|🧡/, "Orange", "🧡"], [/gelb|yellow|💛/, "Gelb", "💛"], [/gr(ü|ue)n|green|💚/, "Grün", "💚"], [/\brot\b|red|❤️/, "Rot", "❤️"],
];
const PLACES = ["thailand", "malediven", "maldives", "dubai", "kanaren", "teneriffa", "gran canaria", "fuerteventura", "lanzarote", "bali", "mallorca", "ibiza",
  "griechenland", "kreta", "ägypten", "hurghada", "mexiko", "karibik", "dominikanische", "mauritius", "seychellen", "sri lanka", "vietnam", "phuket", "zypern", "portugal", "spanien", "italien", "türkei"];
const EMOJI_ONLY = /^[\p{Extended_Pictographic}\p{Emoji_Component}\s!.]+$/u;

function classify(text) {
  const t = norm(text);
  if (SPAM.test(t)) return { skip: "Spam?" };
  if (NEGATIVE.test(t)) return { skip: "Kritik/Reklamation — bitte selbst antworten" };
  const intents = [];
  if (/preis|kostet|kosten|wie ?viel|teuer|price|how much|cost|chf/.test(t)) intents.push("price");
  if (/gr(ö|oe|o)ss?e|size|passt|f(ä|ae)llt .* aus|\bx?xl\b|\bxs\b|cup|körbchen/.test(t)) intents.push("size");
  if (/versand|liefer|wie lange|wann .*(da|an)|shipping|deliver|schick(t|en) ihr/.test(t)) intents.push("shipping");
  if (/twint|bezahl|zahlung|kreditkarte|rechnung|paypal|\bpay\b/.test(t)) intents.push("payment");
  if (/wo .*(kauf|bestell|bekomm|gibt)|\blink\b|shop|where .*(buy|get)|bestellen/.test(t)) intents.push("where");
  if (/welche farben|andere farbe|farben gibt|in (\w+ )?anderen farben|colou?rs/.test(t)) intents.push("colors");
  if (intents.length) return { intents };
  const color = COLORS.find(([re]) => re.test(t));
  if (color) return { intents: ["pickColor"], color };
  const place = PLACES.find((p) => t.includes(p));
  if (place) return { intents: ["place"], place };
  if (EMOJI_ONLY.test(text.trim()) || /sch(ö|oe)n|wow|mega|hammer|toll|liebe|love|beautiful|gorgeous|nice|cute|traum|wunder|super|krass|geil|genial|perfekt|😍|🔥|❤|😻|🥰/.test(t)) return { intents: ["thanks"] };
  if (t.includes("?")) return { skip: "Frage, die das Tool nicht sicher beantworten kann" };
  return { skip: "nicht eindeutig" };
}

// ---------- Antworten ----------
const pick = (arr, seed) => arr[[...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % arr.length];

function compose(c, product, en, seed) {
  const name = product?.name;
  const parts = [];
  for (const i of c.intents) {
    if (i === "price") parts.push(product
      ? (en ? `The ${name} is CHF ${product.price}` : `Der ${name} kostet CHF ${product.price}`)
      : (en ? "Our holiday bikinis start at CHF 27" : "Unsere Ferienbikinis gibt's ab CHF 27"));
    if (i === "size") parts.push(en
      ? `Available in sizes ${sizeRange(product)}, the size chart is on the product page`
      : `Es gibt ihn in ${sizeRange(product)}, die Grössentabelle findest du auf der Produktseite`);
    if (i === "shipping") parts.push(en
      ? `Delivery takes ${SHIPPING.daysEn}, shipping within Switzerland from ${SHIPPING.ch}`
      : `Die Lieferung dauert ${SHIPPING.days}, Versand in die Schweiz ab ${SHIPPING.ch}`);
    if (i === "payment") parts.push(en ? "You can pay by card or TWINT" : "Bezahlen kannst du mit Karte oder TWINT");
    if (i === "colors") parts.push(product?.colors.length > 1
      ? (en ? `It comes in ${product.colors.length} colours: ${product.colors.join(", ")}` : `Es gibt ihn in ${product.colors.length} Farben: ${product.colors.join(", ")}`)
      : (en ? "All colours are on the product page" : "Alle Farben siehst du auf der Produktseite"));
    if (i === "where") parts.push(en ? "You'll find it on verano-exotico.ch (link in bio)" : "Du findest ihn auf verano-exotico.ch (Link in Bio)");
  }
  if (parts.length) {
    let msg = parts.slice(0, 3).join(". ") + ".";
    if (!c.intents.includes("where")) msg += en ? " Link in bio 🌴" : " Link in Bio 🌴";
    return msg;
  }
  const i = c.intents[0];
  if (i === "pickColor") {
    const [, label, emoji] = c.color;
    const ok = !product || product.colors.some((x) => norm(x).includes(norm(label)) || (label === "Pink" && /rosarot|pink/.test(norm(x))));
    if (!ok) return null; // Farbe gibt es bei diesem Produkt nicht → lieber Joel
    return pick(en
      ? [`Great choice ${emoji} ${label} is a favourite!`, `${label} it is ${emoji} Perfect for the holidays!`]
      : [`Gute Wahl ${emoji} ${label} ist auch unser Favorit!`, `${label}, sehr gute Wahl ${emoji} Perfekt für die Ferien!`, `Ui, ${label} ${emoji} Das wird ein Ferienlook!`], seed);
  }
  if (i === "place") {
    const p = c.place.charAt(0).toUpperCase() + c.place.slice(1);
    return pick(en ? [`${p} sounds amazing 🌴 Have the best holiday!`] : [`${p} klingt traumhaft 🌴 Schöne Ferien!`, `Ab nach ${p} ☀️ Wir sind neidisch, geniess es!`], seed);
  }
  if (i === "thanks") return pick(en
    ? ["Thank you so much 💛", "Aww thank you! 🌴", "So glad you like it ✨"]
    : ["Danke dir! 💛", "Merci viel mal 🌴", "Freut uns riesig ✨", "Danke! 😍"], seed);
  return null;
}

// ---------- Kommentare holen ----------
async function instagramThreads() {
  const me = await graph(`/${USER_ID}`, { fields: "username" });
  const media = await graph(`/${USER_ID}/media`, { fields: "id,caption,permalink,timestamp", limit: POSTS });
  const out = [];
  for (const m of media.data ?? []) {
    const cs = await graph(`/${m.id}/comments`, { fields: "id,text,username,timestamp,replies{username}", limit: 50 });
    for (const c of cs.data ?? []) {
      out.push({
        platform: "Instagram", post: m, id: c.id, text: c.text ?? "", user: c.username, time: c.timestamp,
        own: c.username === me.username,
        answered: (c.replies?.data ?? []).some((r) => r.username === me.username),
      });
    }
  }
  return out;
}

async function facebookThreads() {
  const page = await graph("/me", { fields: "id" });
  const reels = await graph("/me/video_reels", { fields: "id,description,permalink_url,created_time", limit: POSTS });
  const out = [];
  for (const v of reels.data ?? []) {
    const cs = await graph(`/${v.id}/comments`, { fields: "id,message,from,created_time,comments{from}", limit: 50 });
    for (const c of cs.data ?? []) {
      out.push({
        platform: "Facebook", post: { caption: v.description, permalink: `https://www.facebook.com${v.permalink_url ?? ""}` },
        id: c.id, text: c.message ?? "", user: c.from?.name ?? "?", time: c.created_time,
        own: c.from?.id === page.id,
        answered: (c.comments?.data ?? []).some((r) => r.from?.id === page.id),
      });
    }
  }
  return out;
}

async function sendReply(th, message) {
  if (th.platform === "Instagram") return graph(`/${th.id}/replies`, { message }, "POST");
  return graph(`/${th.id}/comments`, { message }, "POST");
}

// ---------- Ablauf ----------
// --every N: nur laufen, wenn der letzte Lauf N Tage her ist (für den
// täglichen LaunchAgent — so holt er einen verpassten Lauf am nächsten Tag nach)
const lastRunPath = path.join(ROOT, ".tmp", "comments", "last-run");
const every = Number(arg("every", "0"));
if (every && existsSync(lastRunPath)) {
  const last = new Date(readFileSync(lastRunPath, "utf8").trim()).getTime();
  if (Date.now() - last < (every - 0.1) * 86400e3) process.exit(0);
}
if (has("check")) {
  // Prüft, ob das Token antworten darf
  const need = ["instagram_manage_comments", "pages_manage_engagement", "pages_read_user_content",
    // fürs Posten (tools/instagram-publish.mjs) — beim Neu-Erzeugen des Tokens nicht vergessen
    "instagram_basic", "instagram_content_publish", "instagram_manage_insights", "pages_show_list", "pages_read_engagement", "pages_manage_posts"];
  const d = (await graph("/debug_token", { input_token: TOKEN })).data ?? {};
  const scopes = new Set([...(d.scopes ?? []), ...(d.granular_scopes ?? []).map((g) => g.scope)]);
  for (const s of need) console.log(`${scopes.has(s) ? "✅" : "❌"} ${s}`);
  process.exit(need.every((s) => scopes.has(s)) ? 0 : 1);
}
const products = await loadProducts();
let threads = await instagramThreads();
if (!has("no-facebook")) {
  try { threads = threads.concat(await facebookThreads()); }
  catch (err) { console.warn(`⚠️  Facebook übersprungen: ${err.message}`); }
}
const since = Date.now() - DAYS * 86400e3;
const open = threads.filter((th) => !th.own && !th.answered && new Date(th.time).getTime() >= since);

mkdirSync(path.join(ROOT, ".tmp", "comments"), { recursive: true });
const log = (entry) => appendFileSync(path.join(ROOT, ".tmp", "comments", "log.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n");

console.log(`${REPLY ? "💬 Antworten" : "🔍 Probelauf (nichts wird gesendet)"} — ${open.length} offene Kommentare aus ${threads.length}\n`);
let sent = 0;
const forJoel = [];
for (const th of open) {
  const slug = th.post.caption?.match(/\/product\/([a-z0-9-]+)/)?.[1];
  const product = slug ? products[slug] : null;
  const en = EN.test(norm(th.text)) && !DE.test(norm(th.text));
  const c = classify(th.text);
  const message = c.skip ? null : compose(c, product, en, th.id);
  if (!message) {
    forJoel.push({ th, why: c.skip ?? "keine passende Antwort" });
    continue;
  }
  if (sent >= MAX) { forJoel.push({ th, why: `Limit von ${MAX} Antworten erreicht` }); continue; }
  console.log(`${th.platform} · @${th.user}: „${th.text}"\n   ↳ ${message}`);
  if (REPLY) {
    try {
      await sendReply(th, message);
      log({ platform: th.platform, comment: th.id, user: th.user, text: th.text, reply: message });
      console.log("   ✅ gesendet");
      await new Promise((r) => setTimeout(r, 2500)); // kein Antwort-Sturm
    } catch (err) {
      console.log(`   ❌ ${err.message}`);
      if (/permission|#10\b|#200\b/i.test(err.message)) {
        console.error("\nDem Token fehlt das Recht zum Antworten (instagram_manage_comments / pages_manage_engagement). Siehe workflows/instagram_automatisierung.md.");
        process.exit(1);
      }
    }
  }
  sent++;
}

// Offene Kommentare für Joel: Liste neu schreiben, neue per Mitteilung melden
const offenPath = path.join(ROOT, ".tmp", "comments", "offen.md");
const before = existsSync(offenPath) ? readFileSync(offenPath, "utf8") : "";
if (forJoel.length) {
  console.log(`\n🙋 Für dich (${forJoel.length}):`);
  for (const { th, why } of forJoel) console.log(`   ${th.platform} · @${th.user}: „${th.text}" — ${why}\n     ${th.post.permalink ?? ""}`);
}
if (REPLY) {
  const md = forJoel.map(({ th, why }) => `- ${th.platform} · @${th.user}: „${th.text}" — ${why} <!-- ${th.id} -->\n  ${th.post.permalink ?? ""}`).join("\n");
  writeFileSync(offenPath, `# Kommentare für Joel\n\nStand ${new Date().toLocaleString("de-CH")}\n\n${md || "Nichts offen. 🌴"}\n`);
  const fresh = forJoel.filter(({ th }) => !before.includes(th.id));
  if (fresh.length && process.platform === "darwin") {
    const text = `${fresh.length} neue${fresh.length > 1 ? "" : "r"} Kommentar${fresh.length > 1 ? "e" : ""} zum selbst Beantworten`.replace(/"/g, "");
    spawnSync("osascript", ["-e", `display notification "${text}" with title "Verano Exotico"`]);
  }
}
if (!open.length) console.log("Keine offenen Kommentare. 🌴");
if (REPLY) writeFileSync(lastRunPath, new Date().toISOString());
