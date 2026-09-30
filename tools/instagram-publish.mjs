#!/usr/bin/env node
/**
 * Veröffentlicht ein Reel auf Instagram — direkt über die Graph API, ohne
 * Drittanbieter.
 *
 * Ablauf:
 *   1. Video in den Vercel-Blob-Speicher laden (Instagram braucht eine
 *      öffentlich erreichbare HTTPS-URL; der Blob ist danach sofort wieder
 *      löschbar und landet nicht im Git-Verlauf).
 *   2. Media-Container anlegen (media_type=REELS).
 *   3. Verarbeitungsstatus abfragen, bis FINISHED — nicht blind warten:
 *      Reels brauchen je nach Länge 20 s bis mehrere Minuten.
 *   4. Veröffentlichen.
 *   5. Blob wieder löschen.
 *
 * WICHTIG: Über die API veröffentlichte Reels tragen KEINEN Instagram-Sound.
 * Metas Musikbibliothek ist über die Schnittstelle nicht zugänglich. Reels,
 * die von einem Trend-Sound leben, von Hand posten.
 *
 * Aufruf:
 *   node tools/instagram-publish.mjs --video .tmp/reels/x.mp4 --caption-file .tmp/reels/x.md
 *   node tools/instagram-publish.mjs --video x.mp4 --caption "Text …"
 *   node tools/instagram-publish.mjs --video x.mp4 --caption-file x.md --dry-run
 *   node tools/instagram-publish.mjs --insights [--limit 10]
 *   node tools/instagram-publish.mjs --profile
 *   node tools/instagram-publish.mjs --refresh-token
 *
 * Voraussetzungen in .env.local (siehe workflows/instagram_automatisierung.md):
 *   INSTAGRAM_ACCESS_TOKEN   langlebiges Token (60 Tage)
 *   INSTAGRAM_USER_ID        ID des Instagram-Business-Kontos
 *   BLOB_READ_WRITE_TOKEN    Vercel Blob (Speicher für das Video)
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://graph.instagram.com/v23.0";

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
        "   Einrichtung: workflows/instagram_automatisierung.md (einmalig, ca. 45 Minuten).\n" +
        "   Bis dahin: Reel von Hand posten — dann kannst du ohnehin einen Trend-Sound wählen."
    );
    process.exit(1);
  }
}

/** Graph-API-Aufruf; Fehler werden im Klartext weitergereicht. */
async function graph(endpoint, params = {}, method = "GET") {
  const url = new URL(`${API}${endpoint}`);
  const body = { ...params, access_token: TOKEN };
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
    throw new Error(`${e.type ?? "Graph-Fehler"}: ${e.message}${e.error_user_msg ? ` — ${e.error_user_msg}` : ""}`);
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

  console.log(`📹 ${path.relative(ROOT, abs)} (${sizeMb.toFixed(1)} MB)`);
  console.log(`📝 ${caption.split("\n")[0].slice(0, 70)}…  (${caption.length} Zeichen)`);
  if (caption.length > 2200) throw new Error(`Caption ist ${caption.length} Zeichen lang — Instagram erlaubt 2200.`);

  if (DRY) {
    console.log("\n🔍 Probelauf — es wurde nichts hochgeladen und nichts veröffentlicht.");
    console.log("\n--- Caption ---\n" + caption);
    return;
  }

  requireAuth();
  process.stdout.write("⬆️  Video hochladen … ");
  const { url, cleanup } = await uploadVideo(abs);
  console.log("ok");

  try {
    process.stdout.write("📦 Media-Container anlegen … ");
    const container = await graph(`/${USER_ID}/media`, { media_type: "REELS", video_url: url, caption }, "POST");
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
    console.log("   Hinweis: ohne Instagram-Sound (über die API nicht möglich).");
  } finally {
    await cleanup();
  }
}

// ---------- Weitere Befehle ----------
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

/**
 * Langlebige Tokens laufen nach 60 Tagen ab und lassen sich verlängern, solange
 * sie mindestens 24 Stunden alt und noch gültig sind. Das neue Token muss von
 * Hand in .env.local und nach Vercel — deshalb nur ausgeben, nicht schreiben.
 */
async function refreshToken() {
  requireAuth();
  const res = await fetch(`${API}/refresh_access_token?grant_type=ig_refresh_token&access_token=${TOKEN}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const days = Math.round(data.expires_in / 86400);
  console.log(`✅ Neues Token (gültig ${days} Tage):\n\n${data.access_token}\n\nIn .env.local eintragen.`);
}

// ---------- Einstieg ----------
try {
  if (has("insights")) await showInsights(Number(arg("limit", "10")));
  else if (has("profile")) await showProfile();
  else if (has("refresh-token")) await refreshToken();
  else {
    const video = arg("video");
    const captionFile = arg("caption-file");
    const captionArg = arg("caption");
    if (!video || (!captionFile && !captionArg)) {
      console.error("Nutzung: --video <mp4> (--caption-file <md> | --caption \"Text\") [--dry-run]");
      console.error("         --insights [--limit 10] | --profile | --refresh-token");
      process.exit(1);
    }
    const caption = captionArg ?? captionFromFile(path.resolve(ROOT, captionFile));
    await publishReel({ video, caption });
  }
} catch (err) {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
}
