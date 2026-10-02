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
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
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
/**
 * audio_type ist Pflicht:
 *   music           Metas "Sound Collection" (lizenzfreie Musik)
 *   original_sound  Original-Sounds von Creatorn — hier liegen die Sounds,
 *                   die auf Reels gerade die Runde machen
 * Ohne Angabe werden beide abgefragt und zusammengeführt.
 */
async function listAudioOfType(type, query, limit) {
  // ig_user_id ist Pflicht: Meta liefert nur Sounds, die für genau dieses
  // Konto (Region, Kontotyp) freigegeben sind.
  const params = { limit, ig_user_id: USER_ID, audio_type: type };
  if (query) params.search_query = query;
  const data = await graph("/ig_audio", params);
  // Die Antwort weicht vom Graph-Standard ab: Liste unter "audio" (nicht
  // "data"), ID als "audio_id", Dauer als "duration_in_ms", Künstler bei Musik
  // als "display_artist", bei Original Sounds als "ig_username". Hier auf
  // ein einheitliches Format bringen.
  return (data.audio ?? data.data ?? []).map((a) => ({
    id: a.audio_id ?? a.id,
    title: a.title,
    artist: a.display_artist ?? (a.ig_username ? `@${a.ig_username}` : undefined),
    duration_ms: a.duration_in_ms ?? a.duration_ms,
    audio_type: a.audio_type ?? type,
    preview: a.on_platform_audio_preview_link,
  }));
}

async function listAudio(query, limit) {
  const wanted = arg("audio-type");
  const types = wanted ? [wanted] : ["original_sound", "music"];
  const lists = await Promise.all(types.map((t) => listAudioOfType(t, query, limit).catch((e) => ({ error: e, type: t }))));
  const out = [];
  for (const l of lists) {
    if (Array.isArray(l)) out.push(...l);
    else console.warn(`⚠️  ${l.type}: ${l.error.message}`);
  }
  return out;
}

function describeAudio(a) {
  const dur = a.duration_ms ? ` · ${Math.round(a.duration_ms / 1000)} s` : "";
  const kind = a.audio_type === "music" ? "[Musik]   " : a.audio_type === "original_sound" ? "[Original]" : "";
  return `${kind} ${a.title ?? "(ohne Titel)"}${a.artist ? ` — ${a.artist}` : ""}${dur}${a.is_explicit ? " · explicit" : ""}`.trim();
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

/**
 * Maximale Lautstärke der Tonspur in dB (0 = Vollaussteuerung, -91 = digitale
 * Stille), oder null ohne Tonspur. Gemessen mit ffmpeg volumedetect.
 */
function videoLoudness(file) {
  let ffmpeg;
  try {
    ffmpeg = require("ffmpeg-static");
  } catch {
    return 0; // ohne ffmpeg nicht prüfbar — nicht blockieren
  }
  const r = spawnSync(ffmpeg, ["-hide_banner", "-i", file, "-map", "0:a:0", "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf8" });
  const out = `${r.stderr ?? ""}`;
  if (/does not contain any stream|matches no streams/i.test(out)) return null;
  const m = out.match(/max_volume:\s*(-?[\d.]+) dB/);
  return m ? Number(m[1]) : null;
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

// ---------- Reel oder Story veröffentlichen ----------
/**
 * story=true veröffentlicht als Story (media_type=STORIES): nur für
 * Business-Konten, 3–60 s, keine Caption (Stories haben keine), kein
 * Instagram-Sound. Reels erreichen auch Nicht-Follower, Stories nur Follower.
 */
async function publishReel({ video, caption, story = false }) {
  const abs = path.resolve(ROOT, video);
  if (!existsSync(abs)) throw new Error(`Video nicht gefunden: ${video}`);
  const sizeMb = statSync(abs).size / 1048576;
  if (sizeMb > 100) throw new Error(`Video ist ${sizeMb.toFixed(1)} MB — Instagram erlaubt maximal 100 MB.`);
  if (caption.length > 2200) throw new Error(`Caption ist ${caption.length} Zeichen lang — Instagram erlaubt 2200.`);
  if (story && (arg("audio") || arg("audio-id"))) {
    throw new Error("Stories unterstützen über die API keinen Instagram-Sound — die Tonspur des Videos wird verwendet.");
  }

  console.log(`📹 ${path.relative(ROOT, abs)} (${sizeMb.toFixed(1)} MB) → ${story ? "STORY" : "REEL"}`);
  if (!story) console.log(`📝 ${caption.split("\n")[0].slice(0, 70)}…  (${caption.length} Zeichen)`);

  const audioWish = arg("audio") ?? (arg("audio-id") ? `ID ${arg("audio-id")}` : null);
  if (DRY && !has("prepare-only")) {
    console.log(`🎵 Sound: ${audioWish ?? "keiner (Video-Tonspur)"}`);
    console.log("\n🔍 Probelauf — es wurde nichts hochgeladen und nichts veröffentlicht.");
    console.log("\n--- Caption ---\n" + caption);
    return;
  }

  requireAuth();
  const audio = await resolveAudio();
  console.log(`🎵 Sound: ${audio ? audio.label : "keiner (Video-Tonspur)"}`);

  // Sperre gegen stumme Posts (02.10.2026: ein Reel ging mit leerer
  // Platzhalter-Tonspur raus). Ohne Instagram-Sound muss das Video selbst
  // hörbaren Ton haben — sonst abbrechen, ausser es ist ausdrücklich gewollt.
  if (!audio && !has("allow-silent")) {
    const level = videoLoudness(abs);
    if (level === null || level < -60) {
      throw new Error(
        `Das Video ist stumm (${level === null ? "keine Tonspur" : `${level.toFixed(0)} dB`}) und es ist kein Sound gewählt.\n` +
          '   Sound anhängen: --list-audio --query "summer" → --audio-id <id>\n' +
          "   Oder bewusst stumm posten: --allow-silent"
      );
    }
    console.log(`🔊 Video-Tonspur hörbar (${level.toFixed(0)} dB)`);
  }

  // Standard: Video direkt bei Meta hochladen (upload_type=resumable) — keine
  // öffentliche URL, kein Zwischenspeicher nötig. Nur mit --via-blob über
  // Vercel Blob (Fallback, falls Meta den Direkt-Upload einmal ablehnt).
  const viaBlob = has("via-blob");
  let cleanup = async () => {};

  try {
    process.stdout.write("📦 Media-Container anlegen … ");
    const params = story ? { media_type: "STORIES" } : { media_type: "REELS", caption, share_to_feed: true };
    if (viaBlob) {
      const up = await uploadVideo(abs);
      cleanup = up.cleanup;
      params.video_url = up.url;
    } else {
      params.upload_type = "resumable";
    }
    if (audio && !story) {
      // Als OBJEKT, nicht als JSON-Text: graph() schickt den Body bereits als
      // JSON. Metas Doku-Beispiel ist form-kodiert ('audio_configuration={…}');
      // ein zusätzlich stringifizierter Wert wird im JSON-Body stillschweigend
      // ignoriert — so ging am 02.10. ein Reel als "Original-Audio" raus.
      params.audio_configuration = {
        audio_id: audio.id,
        audio_volume: Number(arg("audio-volume", "100")),
        video_volume: Number(arg("video-volume", "0")),
      };
    }
    const container = await graph(`/${USER_ID}/media`, params, "POST");
    console.log(container.id);

    if (!viaBlob) {
      process.stdout.write("⬆️  Video direkt zu Meta hochladen … ");
      const bytes = readFileSync(abs);
      const uploadUrl = container.uri ?? `https://rupload.facebook.com/ig-api-upload/v23.0/${container.id}`;
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { Authorization: `OAuth ${TOKEN}`, offset: "0", file_size: String(bytes.length) },
        body: bytes,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.success === false || body.error) {
        throw new Error(`Upload fehlgeschlagen (HTTP ${res.status}): ${body.error?.message ?? body.debug_info?.message ?? JSON.stringify(body).slice(0, 200)}`);
      }
      console.log("ok");
    }

    if (has("prepare-only")) {
      // Test des kompletten Wegs ohne Veröffentlichung: der Container verfällt
      // nach 24 Stunden von selbst.
      process.stdout.write("⏳ Instagram verarbeitet das Video ");
      const deadline = Date.now() + 10 * 60 * 1000;
      let s;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 5000));
        s = await graph(`/${container.id}`, { fields: "status_code,status" });
        if (s.status_code !== "IN_PROGRESS") break;
        process.stdout.write(".");
      }
      console.log(` ${s?.status_code}`);
      if (s?.status_code !== "FINISHED") throw new Error(`Verarbeitung: ${s?.status ?? s?.status_code}`);
      console.log("\n🧪 Bereit zum Veröffentlichen — NICHT veröffentlicht (--prepare-only). Container verfällt in 24 h.");
      return;
    }

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
  for (const a of list) {
    console.log(`  ${a.id}  ${describeAudio(a)}`);
    if (a.preview) console.log(`  ${" ".repeat(String(a.id).length)}  ▶ ${a.preview}`);
  }
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
/** Ersetzt oder ergänzt KEY=wert in .env.local, ohne andere Zeilen anzufassen. */
function setEnv(key, value) {
  const text = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  const next = re.test(text) ? text.replace(re, line) : `${text.replace(/\n*$/, "\n")}${line}\n`;
  writeFileSync(envPath, next);
}

const mask = (s) => (s ? `${s.slice(0, 6)}…${s.slice(-4)} (${s.length} Zeichen)` : "—");

/**
 * Tauscht das kurzlebige Token in ein dauerhaftes und trägt INSTAGRAM_USER_ID
 * und INSTAGRAM_ACCESS_TOKEN selbst in .env.local ein. Das kurzlebige Token
 * kommt aus FB_SHORT_TOKEN in .env.local (oder als Argument) und wird danach
 * gelöscht — so muss kein Token durch Chat oder Terminal-Verlauf.
 */
async function exchangeToken(shortArg) {
  const appId = process.env.FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  if (!appId || !appSecret) throw new Error("FB_APP_ID und FB_APP_SECRET fehlen in .env.local (Meta-App → Einstellungen → Allgemein).");
  const shortToken = shortArg ?? process.env.FB_SHORT_TOKEN;
  if (!shortToken || !shortToken.startsWith("EAA")) {
    throw new Error("Kein Token gefunden. In .env.local die Zeile FB_SHORT_TOKEN=EAA… mit dem Token aus dem Graph API Explorer füllen.");
  }
  const res = await fetch(
    `${API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`
  );
  const data = await res.json();
  if (data.error) throw new Error(`Tausch fehlgeschlagen: ${data.error.message}`);
  console.log("✅ Dauerhaftes Nutzer-Token erhalten.");

  const fields = "id,name,access_token,instagram_business_account{id,username}";
  const pages = await graph("/me/accounts", { fields }, "GET", data.access_token);
  let candidates = pages.data ?? [];

  // Seiten in einem Business-Portfolio fehlen in /me/accounts, obwohl sie
  // freigegeben sind. Die Seiten-IDs stehen dann in den granular_scopes des
  // Tokens — von dort direkt abfragen.
  if (!candidates.some((p) => p.instagram_business_account)) {
    const dbg = await graph("/debug_token", { input_token: data.access_token }, "GET", `${appId}|${appSecret}`);
    const pageIds = [
      ...new Set((dbg.data?.granular_scopes ?? []).filter((g) => g.scope.startsWith("pages_")).flatMap((g) => g.target_ids ?? [])),
    ];
    candidates = [];
    for (const id of pageIds) {
      const p = await graph(`/${id}`, { fields }, "GET", data.access_token).catch(() => null);
      if (p) candidates.push(p);
    }
  }

  const withIg = candidates.filter((p) => p.instagram_business_account && p.access_token);
  if (withIg.length === 0) {
    console.log("Seiten gefunden:", candidates.map((p) => p.name).join(", ") || "keine");
    throw new Error(
      "Keine Facebook-Seite mit verknüpftem Instagram-Business-Konto im Token.\n" +
        "   Instagram → Einstellungen → Professionelles Konto → Facebook „Verknüpfen\", dann Token neu erzeugen."
    );
  }
  const page = withIg.find((p) => /verano/i.test(p.instagram_business_account.username)) ?? withIg[0];
  setEnv("INSTAGRAM_USER_ID", page.instagram_business_account.id);
  setEnv("INSTAGRAM_ACCESS_TOKEN", page.access_token);
  setEnv("FB_SHORT_TOKEN", "");
  console.log(`   Seite:      ${page.name}`);
  console.log(`   Instagram:  @${page.instagram_business_account.username} (${page.instagram_business_account.id})`);
  console.log(`   Seiten-Token ${mask(page.access_token)} → in .env.local eingetragen (läuft nicht ab)`);
  console.log("   FB_SHORT_TOKEN wieder geleert.");
}

// ---------- Einstieg ----------
try {
  if (has("list-audio")) await showAudio();
  else if (has("insights")) await showInsights(Number(arg("limit", "10")));
  else if (has("profile")) await showProfile();
  else if (has("whoami")) await whoami();
  else if (has("exchange-token")) await exchangeToken(arg("exchange-token"));
  else if (has("setup")) await exchangeToken();
  else {
    const video = arg("video");
    const captionFile = arg("caption-file");
    const captionArg = arg("caption");
    const story = has("story");
    if (!video || (!story && !captionFile && !captionArg)) {
      console.error('Nutzung: --video <mp4> (--caption-file <md> | --caption "Text") [--audio trending|"<suche>" | --audio-id <id>] [--dry-run]');
      console.error("         --video <mp4> --story [--dry-run]          (Story: ohne Caption, ohne Instagram-Sound)");
      console.error("         --list-audio [--query …] | --insights [--limit 10] | --profile | --whoami | --exchange-token <token>");
      process.exit(1);
    }
    const caption = story ? "" : (captionArg ?? captionFromFile(path.resolve(ROOT, captionFile)));
    await publishReel({ video, caption, story });
  }
} catch (err) {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
}
