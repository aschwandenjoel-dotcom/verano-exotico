#!/usr/bin/env node
/**
 * Veröffentlicht ein Reel auf Instagram — direkt über die Graph API, ohne
 * Drittanbieter — wahlweise MIT einem Sound aus Instagrams Musikbibliothek.
 *
 * Musik über die API (Instagram Audio API, Meta-Doku "Audio API"):
 *   GET /ig_audio                          ohne Suchbegriff: Trending-Sounds
 *   GET /ig_audio?search_query=…           Suche nach Musik / Original Sounds
 *   POST /{ig-user-id}/media  … audio_configuration={"audio_id":"…"}
 * Es kommt nur Musik, die Meta für Drittanbieter freigegeben hat — der
 * Katalog ist kleiner als in der App, Trending-Sounds und Original Sounds
 * sind aber drin. Der Sound startet bei Sekunde 0 (kein Trimmen).
 *
 * Ablauf beim Posten:
 *   1. Video in den Vercel-Blob-Speicher laden (Instagram braucht eine
 *      öffentliche HTTPS-URL; der Blob wird danach gelöscht, nichts landet im
 *      Git-Verlauf).
 *   2. Media-Container anlegen (media_type=REELS, optional audio_configuration).
 *   3. Verarbeitungsstatus abfragen, bis FINISHED — nicht blind warten.
 *   4. Veröffentlichen. 5. Blob löschen.
 *
 * Aufruf:
 *   node tools/instagram-publish.mjs --video x.mp4 --caption-file x.md [--audio trending|"<suche>"|--audio-id <id>]
 *   node tools/instagram-publish.mjs --list-audio [--query "summer beach"] [--limit 10]
 *   node tools/instagram-publish.mjs --video … --caption-file … --dry-run
 *   node tools/instagram-publish.mjs --insights [--limit 10] | --profile | --whoami
 *   node tools/instagram-publish.mjs --exchange-token <kurzlebiges-Token>   (Einrichtung)
 *
 * Voraussetzungen in .env.local (Einrichtung: workflows/instagram_automatisierung.md):
 *   INSTAGRAM_ACCESS_TOKEN   Seiten-Token aus Facebook Login (läuft nicht ab)
 *   INSTAGRAM_USER_ID        ID des Instagram-Business-Kontos
 *   BLOB_READ_WRITE_TOKEN    Vercel Blob (Zwischenspeicher fürs Video)
 *   FB_APP_ID / FB_APP_SECRET  nur für --exchange-token
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Facebook Login → graph.facebook.com (die Audio-API gibt es nur auf diesem Weg)
const API = "https://graph.facebook.com/v23.0";

// ---------- .env.local ----------
const envPath = path.join(ROOT, ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : fallback;
}
const has = (name) => process.argv.includes(`--${name}`);

const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const USER_ID = process.env.INSTAGRAM_USER_ID;
const DRY = has("dry-run");

function requireAuth() {
  if (!TOKEN || !USER_ID) {
    console.error(
      "❌ INSTAGRAM_ACCESS_TOKEN und INSTAGRAM_USER_ID fehlen in .env.local.\n" +
        "   Einrichtung: workflows/instagram_automatisierung.md (einmalig, ca. 45 Minuten)."
    );
    process.exit(1);
  }
}

/** Graph-API-Aufruf; Fehler werden im Klartext weitergereicht. */
async function graph(endpoint, params = {}, method = "GET", token = TOKEN) {
  const url = new URL(`${API}${endpoint}`);
  const body = { ...params, access_token: token };
  let res;
  if (method === "GET") {
    for (const [k, v] of Object.entries(body)) url.searchParams.set(k, String(v));
    res = await fetch(url);
  } else {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  const data = await res.json().catch(() => ({}));
  if (data.error) {
    const e = data.error;
    const err = new Error(`${e.type ?? "Graph-Fehler"} (#${e.code ?? "?"}): ${e.message}${e.error_user_msg ? ` — ${e.error_user_msg}` : ""}`);
    err.code = e.code;
    throw err;
  }
  return data;
}

/** Caption aus einer .md-Datei: der Block unter "## Caption DE". */
function captionFromFile(file) {
  const text = readFileSync(file, "utf8");
  const m = text.match(/##\s*Caption DE\s*\n+([\s\S]*?)(?=\n##\s|\n*$)/);
  if (!m) throw new Error(`Kein Abschnitt "## Caption DE" in ${path.relative(ROOT, file)}`);
  return m[1].trim();
}

// ---------- Musik ----------
/**
 * Sounds aus der Bibliothek holen. Ohne Suchbegriff liefert Meta die
 * Trending-Sounds. Die genaue Feldliste ist in Metas Doku nicht abschliessend
 * genannt; deshalb erst mit ausführlichen Feldern, bei Ablehnung ohne.
 */
async function listAudio(query, limit) {
  const base = { limit };
  if (query) base.search_query = query;
  const attempts = [
    { ...base, fields: "id,title,artist,duration_ms,music_type,is_explicit" },
    { ...base, fields: "id,title" },
    base,
  ];
  let lastErr;
  for (const params of attempts) {
    try {
      const data = await graph("/ig_audio", params);
      return data.data ?? [];
    } catch (err) {
      lastErr = err;
      if (!/field|nonexisting|Unsupported/i.test(err.message)) throw err;
    }
  }
  throw lastErr;
}

function describeAudio(a) {
  const dur = a.duration_ms ? ` · ${Math.round(a.duration_ms / 1000)} s` : "";
  return `${a.title ?? "(ohne Titel)"}${a.artist ? ` — ${a.artist}` : ""}${dur}${a.is_explicit ? " · explicit" : ""}`;
}

/** Aus --audio / --audio-id die audio_id ermitteln. */
async function resolveAudio() {
  const id = arg("audio-id");
  if (id) return { id, label: `ID ${id}` };
  const wish = arg("audio");
  if (!wish) return null;
  const list = await listAudio(wish === "trending" ? "" : wish, 5);
  if (list.length === 0) throw new Error(`Kein Sound gefunden für "${wish}".`);
  const pick = list[0];
  return { id: pick.id, label: describeAudio(pick) };
}

// ---------- Video öffentlich bereitstellen ----------
async function uploadVideo(file) {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN fehlt. Instagram braucht eine öffentlich erreichbare Video-URL.\n" +
        "   Vercel → Storage → Blob → Store anlegen → Token nach .env.local kopieren."
    );
  }
  let put, del;
  try {
    ({ put, del } = await import("@vercel/blob"));
  } catch {
    throw new Error("Paket @vercel/blob fehlt. Installieren mit: npm i @vercel/blob");
  }
  const name = `reels/${Date.now()}-${path.basename(file)}`;
  const blob = await put(name, readFileSync(file), {
    access: "public",
    token: blobToken,
    contentType: "video/mp4",
    addRandomSuffix: false,
  });
  return { url: blob.url, cleanup: () => del(blob.url, { token: blobToken }).catch(() => {}) };
}

// ---------- Reel veröffentlichen ----------
async function publishReel({ video, caption }) {
  const abs = path.resolve(ROOT, video);
  if (!existsSync(abs)) throw new Error(`Video nicht gefunden: ${video}`);
  const sizeMb = statSync(abs).size / 1048576;
  if (sizeMb > 100) throw new Error(`Video ist ${sizeMb.toFixed(1)} MB — Instagram erlaubt maximal 100 MB.`);
  if (caption.length > 2200) throw new Error(`Caption ist ${caption.length} Zeichen lang — Instagram erlaubt 2200.`);

  console.log(`📹 ${path.relative(ROOT, abs)} (${sizeMb.toFixed(1)} MB)`);
  console.log(`📝 ${caption.split("\n")[0].slice(0, 70)}…  (${caption.length} Zeichen)`);

  const audioWish = arg("audio") ?? (arg("audio-id") ? `ID ${arg("audio-id")}` : null);
  if (DRY) {
    console.log(`🎵 Sound: ${audioWish ?? "keiner (Video-Tonspur)"}`);
    console.log("\n🔍 Probelauf — es wurde nichts hochgeladen und nichts veröffentlicht.");
    console.log("\n--- Caption ---\n" + caption);
    return;
  }

  requireAuth();
  const audio = await resolveAudio();
  console.log(`🎵 Sound: ${audio ? audio.label : "keiner (Video-Tonspur)"}`);

  process.stdout.write("⬆️  Video hochladen … ");
  const { url, cleanup } = await uploadVideo(abs);
  console.log("ok");

  try {
    process.stdout.write("📦 Media-Container anlegen … ");
    const params = { media_type: "REELS", video_url: url, caption, share_to_feed: true };
    if (audio) {
      params.audio_configuration = JSON.stringify({
        audio_id: audio.id,
        audio_volume: Number(arg("audio-volume", "100")),
        video_volume: Number(arg("video-volume", "0")),
      });
    }
    const container = await graph(`/${USER_ID}/media`, params, "POST");
    console.log(container.id);

    // Status abfragen statt blind warten — Reels brauchen 20 s bis mehrere Minuten
    process.stdout.write("⏳ Instagram verarbeitet das Video ");
    const deadline = Date.now() + 10 * 60 * 1000;
    let status = "IN_PROGRESS";
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 5000));
      const s = await graph(`/${container.id}`, { fields: "status_code,status" });
      status = s.status_code;
      if (status === "FINISHED") break;
      if (status === "ERROR" || status === "EXPIRED") throw new Error(`Verarbeitung fehlgeschlagen: ${s.status ?? status}`);
      process.stdout.write(".");
    }
    if (status !== "FINISHED") throw new Error("Zeitüberschreitung: Instagram hat das Video nach 10 Minuten nicht verarbeitet.");
    console.log(" fertig");

    process.stdout.write("🚀 Veröffentlichen … ");
    const published = await graph(`/${USER_ID}/media_publish`, { creation_id: container.id }, "POST");
    console.log("ok");

    const permalink = await graph(`/${published.id}`, { fields: "permalink" }).catch(() => null);
    console.log(`\n✅ Veröffentlicht: ${permalink?.permalink ?? published.id}`);
  } finally {
    await cleanup();
  }
}

// ---------- Weitere Befehle ----------
async function showAudio() {
  requireAuth();
  const query = arg("query", "");
  const list = await listAudio(query, Number(arg("limit", "10")));
  console.log(query ? `Sounds für "${query}":` : "Trending-Sounds (für Drittanbieter freigegeben):");
  if (list.length === 0) console.log("  keine");
  for (const a of list) console.log(`  ${a.id}  ${describeAudio(a)}`);
  console.log('\nVerwenden mit: --audio-id <id>   oder   --audio "suchbegriff"   oder   --audio trending');
}

async function showInsights(limit) {
  requireAuth();
  const data = await graph(`/${USER_ID}/media`, {
    fields: "id,caption,media_type,timestamp,permalink,like_count,comments_count",
    limit,
  });
  const rows = (data.data ?? []).map((m) => ({
    Datum: new Date(m.timestamp).toLocaleDateString("de-CH"),
    Typ: m.media_type,
    "❤️": m.like_count ?? 0,
    "💬": m.comments_count ?? 0,
    Anfang: (m.caption ?? "").split("\n")[0].slice(0, 45),
  }));
  if (rows.length === 0) console.log("Noch keine Beiträge.");
  else console.table(rows);
}

async function showProfile() {
  requireAuth();
  const p = await graph(`/${USER_ID}`, { fields: "username,name,followers_count,media_count,biography,website" });
  console.log(`@${p.username} — ${p.followers_count} Follower, ${p.media_count} Beiträge`);
  console.log(`Bio: ${p.biography ?? "—"}`);
  console.log(`Link: ${p.website ?? "—"}`);
}

/** Zeigt, wofür das Token steht: Nutzer, Seiten, verknüpfte Instagram-Konten. */
async function whoami(token = TOKEN) {
  if (!token) throw new Error("Kein Token (INSTAGRAM_ACCESS_TOKEN oder Argument).");
  const me = await graph("/me", { fields: "id,name" }, "GET", token).catch(() => null);
  if (me) console.log(`Token gehört zu: ${me.name} (${me.id})`);
  const pages = await graph("/me/accounts", { fields: "id,name,access_token,instagram_business_account{id,username}" }, "GET", token);
  if (!pages.data?.length) {
    console.log("Keine Facebook-Seite gefunden — ohne Seite kein Instagram-Zugriff (Schritt 2 der Anleitung).");
    return;
  }
  for (const p of pages.data) {
    console.log(`\nSeite: ${p.name} (${p.id})`);
    if (p.instagram_business_account) {
      console.log(`  Instagram: @${p.instagram_business_account.username}  →  INSTAGRAM_USER_ID=${p.instagram_business_account.id}`);
      console.log(`  Seiten-Token (läuft nicht ab)  →  INSTAGRAM_ACCESS_TOKEN=${p.access_token}`);
    } else {
      console.log("  kein Instagram-Konto verknüpft");
    }
  }
}

/**
 * Einrichtung: kurzlebiges Nutzer-Token (aus dem Graph API Explorer) in ein
 * langlebiges tauschen und daraus die Seiten-Tokens holen. Seiten-Tokens aus
 * einem langlebigen Nutzer-Token laufen nicht ab — kein Kalendereintrag nötig.
 */
async function exchangeToken(shortToken) {
  const appId = process.env.FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  if (!appId || !appSecret) throw new Error("FB_APP_ID und FB_APP_SECRET fehlen in .env.local (Meta-App → Einstellungen → Allgemein).");
  const res = await fetch(
    `${API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  console.log(`✅ Langlebiges Nutzer-Token erhalten (${Math.round((data.expires_in ?? 5184000) / 86400)} Tage). Verknüpfte Seiten:`);
  await whoami(data.access_token);
  console.log("\nDie beiden Zeilen mit INSTAGRAM_USER_ID und INSTAGRAM_ACCESS_TOKEN in .env.local eintragen.");
}

// ---------- Einstieg ----------
try {
  if (has("list-audio")) await showAudio();
  else if (has("insights")) await showInsights(Number(arg("limit", "10")));
  else if (has("profile")) await showProfile();
  else if (has("whoami")) await whoami();
  else if (has("exchange-token")) await exchangeToken(arg("exchange-token"));
  else {
    const video = arg("video");
    const captionFile = arg("caption-file");
    const captionArg = arg("caption");
    if (!video || (!captionFile && !captionArg)) {
      console.error('Nutzung: --video <mp4> (--caption-file <md> | --caption "Text") [--audio trending|"<suche>" | --audio-id <id>] [--dry-run]');
      console.error("         --list-audio [--query …] | --insights [--limit 10] | --profile | --whoami | --exchange-token <token>");
      process.exit(1);
    }
    const caption = captionArg ?? captionFromFile(path.resolve(ROOT, captionFile));
    await publishReel({ video, caption });
  }
} catch (err) {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
}
