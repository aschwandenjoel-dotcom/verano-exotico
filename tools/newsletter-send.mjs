#!/usr/bin/env node
/**
 * Verschickt einen Newsletter an alle bestätigten Abonnenten — geschrieben als
 * Markdown-Datei in newsletters/, versandt über die Website
 * (/api/admin/newsletter → Resend). Datenbank und Resend-Schlüssel bleiben
 * auf Vercel; dieses Tool braucht nur das Admin-Passwort.
 *
 * Empfänger sind ausschliesslich Adressen mit bestätigter Anmeldung
 * (Double-Opt-in oder Häkchen beim Bestellen + bezahlt), nie abgemeldete.
 * Jede Mail hat einen eigenen Abmeldelink. Ein abgebrochener Lauf lässt sich
 * mit demselben Befehl fortsetzen — wer schon eine Mail hat, bekommt keine zweite.
 *
 * Aufruf (Reihenfolge vor jedem Versand):
 *   node tools/newsletter-send.mjs newsletters/x.md                 Vorschau + Empfängerzahl (verschickt nichts)
 *   node tools/newsletter-send.mjs newsletters/x.md --test du@x.ch  Testmail(s) an eine Adresse
 *   node tools/newsletter-send.mjs newsletters/x.md --senden        echter Versand an alle
 *
 * Dateiformat (Kampagnen-ID = Dateiname ohne .md):
 *   ---
 *   betreff_de: Neue Bikinis für den Herbsturlaub
 *   betreff_en: New bikinis for your autumn getaway      (optional)
 *   vorschau_de: Fünf neue Modelle, ab heute im Shop     (optional, Text nach dem Betreff)
 *   vorschau_en: …                                       (optional)
 *   button_de: Zur Kollektion                            (optional)
 *   button_en: Shop the collection                       (optional)
 *   link: /collection                                    (Ziel des Buttons; /… = eigene Seite)
 *   ---
 *   # de
 *   Text in Markdown: Absätze, **fett**, *kursiv*, [Link](/product/slug),
 *   ![Bild](https://…), Listen mit "- ", Zwischentitel mit "## ".
 *   # en
 *   English version (optional — ohne bekommen alle die deutsche Fassung)
 *
 * Eigene Links (/… oder verano-exotico.ch) erhalten die Sprache und
 * UTM-Parameter (utm_source=newsletter, utm_campaign=<ID>) — so sind die
 * Besuche in Vercel Analytics dem Newsletter zuzuordnen.
 *
 * Voraussetzungen in .env.local:
 *   ADMIN_PASSWORD   dasselbe wie in Vercel (Login /admin)
 *   SITE_URL         optional, Standard https://verano-exotico.ch
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

const SITE = (process.env.SITE_URL || "https://verano-exotico.ch").replace(/\/$/, "");
const SITE_HOST = new URL(SITE).hostname.replace(/^www\./, "");
const ADMIN = process.env.ADMIN_PASSWORD;

const file = process.argv.slice(2).find((a) => !a.startsWith("--") && a.endsWith(".md"));
if (!file) {
  console.error("Aufruf: node tools/newsletter-send.mjs newsletters/<name>.md [--test adresse | --senden]");
  process.exit(1);
}
if (!ADMIN) {
  console.error("❌ ADMIN_PASSWORD fehlt in .env.local (dasselbe Passwort wie für /admin auf der Website).");
  process.exit(1);
}

const campaign = path.basename(file, ".md").toLowerCase();
if (!/^[a-z0-9-]{3,80}$/.test(campaign)) {
  console.error(`❌ Dateiname "${campaign}" taugt nicht als Kampagnen-ID — nur a-z, 0-9 und -, z. B. 2026-10-herbst.md`);
  process.exit(1);
}

// ---------- Datei lesen ----------
const raw = readFileSync(path.resolve(file), "utf8");
const fm = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
if (!fm) {
  console.error("❌ Kopfbereich fehlt — die Datei muss mit --- … --- beginnen (siehe Kommentar oben im Tool).");
  process.exit(1);
}
const meta = Object.fromEntries(
  fm[1]
    .split("\n")
    .map((l) => l.match(/^([a-z_]+):\s*(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim()])
);
const sections = {};
let current = null;
for (const line of fm[2].split("\n")) {
  const h = line.match(/^#\s+(de|en)\s*$/i);
  if (h) {
    current = h[1].toLowerCase();
    sections[current] = [];
  } else if (current) {
    sections[current].push(line);
  }
}

// ---------- Links: Sprache + UTM ----------
function ownLink(href, locale) {
  let url;
  if (href.startsWith("/")) {
    const pathPart = /^\/(de|en)(\/|$)/.test(href) ? href : `/${locale}${href === "/" ? "" : href}`;
    url = new URL(SITE + pathPart);
  } else {
    try {
      url = new URL(href);
    } catch {
      return href;
    }
    if (url.hostname.replace(/^www\./, "") !== SITE_HOST) return href; // fremder Link: unverändert
  }
  url.searchParams.set("utm_source", "newsletter");
  url.searchParams.set("utm_medium", "email");
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}

// ---------- Mini-Markdown → HTML (nur was ein Newsletter braucht) ----------
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(text, locale) {
  return esc(text)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) =>
      `<img src="${src}" alt="${alt}" width="480" style="display:block;width:100%;max-width:480px;height:auto;border-radius:12px;margin:8px 0;">`
    )
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) =>
      `<a href="${ownLink(href.replace(/&amp;/g, "&"), locale)}" style="color:#1A3040;font-weight:700;">${label}</a>`
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function markdown(lines, locale) {
  const blocks = lines.join("\n").trim().split(/\n\s*\n/);
  return blocks
    .map((block) => {
      const ls = block.split("\n");
      if (ls.every((l) => /^\s*-\s+/.test(l))) {
        return `<ul style="margin:0 0 16px;padding-left:20px;">${ls
          .map((l) => `<li style="margin:4px 0;">${inline(l.replace(/^\s*-\s+/, ""), locale)}</li>`)
          .join("")}</ul>`;
      }
      const h = block.match(/^##\s+(.*)$/);
      if (h) {
        return `<h2 style="font-family:sans-serif;font-size:16px;font-weight:900;text-transform:uppercase;letter-spacing:0.05em;color:#1A3040;margin:24px 0 8px;">${inline(h[1], locale)}</h2>`;
      }
      return `<p style="margin:0 0 16px;">${ls.map((l) => inline(l, locale)).join("<br>")}</p>`;
    })
    .join("\n");
}

function content(locale) {
  const body = sections[locale];
  const subject = meta[`betreff_${locale}`];
  if (!body || !body.join("").trim() || !subject) return null;
  return {
    subject,
    preheader: meta[`vorschau_${locale}`] || undefined,
    html: markdown(body, locale),
    buttonLabel: meta[`button_${locale}`] || undefined,
    buttonUrl: meta.link ? ownLink(meta.link, locale) : undefined,
  };
}

const inhalt = { de: content("de") };
if (!inhalt.de) {
  console.error("❌ Deutsche Fassung unvollständig: betreff_de im Kopf und ein Abschnitt \"# de\" mit Text sind Pflicht.");
  process.exit(1);
}
const en = content("en");
if (en) inhalt.en = en;

// ---------- API ----------
async function api(aktion, extra = {}) {
  const res = await fetch(`${SITE}/api/admin/newsletter`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": ADMIN },
    body: JSON.stringify({ aktion, kampagne: campaign, inhalt, ...extra }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(res.status === 401 ? "Admin-Passwort falsch (ADMIN_PASSWORD in .env.local prüfen)" : data.error || `HTTP ${res.status}`);
  }
  return data;
}

async function status() {
  const s = await api("status");
  const total = s.empfaenger.reduce((n, e) => n + e.total, 0);
  const done = s.empfaenger.reduce((n, e) => n + e.versandt, 0);
  console.log(`📋 Kampagne "${campaign}"`);
  for (const e of s.empfaenger) console.log(`   ${e.sprache}: ${e.total} bestätigt, davon ${e.versandt} schon versandt`);
  console.log(`   → offen: ${total - done} von ${total}`);
  if (!inhalt.en && s.empfaenger.some((e) => e.sprache === "en" && e.total > 0)) {
    console.log("   ⚠️  Keine englische Fassung — englische Abonnenten bekommen die deutsche.");
  }
  if (s.letzteKampagne) {
    const days = Math.floor((Date.now() - new Date(s.letzteKampagne.sent_at).getTime()) / 86400000);
    console.log(`   Letzte Kampagne: "${s.letzteKampagne.campaign}" vor ${days} Tag(en)`);
    if (days < 7) console.log("   ⚠️  Weniger als 7 Tage her — zu häufige Mails führen zu Abmeldungen und Spam-Meldungen.");
  }
  return { total, open: total - done };
}

try {
  if (has("senden")) {
    const { open } = await status();
    if (open === 0) {
      console.log("✅ Nichts zu tun — alle bestätigten Abonnenten haben diese Kampagne schon.");
      process.exit(0);
    }
    let sent = 0;
    for (;;) {
      const r = await api("senden");
      sent += r.gesendet;
      console.log(`   … ${sent} versandt, ${r.verbleibend} offen`);
      if (r.verbleibend === 0 || r.gesendet === 0) break;
    }
    console.log(`✅ Fertig: ${sent} Mails verschickt.`);
  } else if (has("test")) {
    const to = arg("test");
    if (!to) throw new Error("--test braucht eine Adresse, z. B. --test du@beispiel.ch");
    await api("test", { testAn: to });
    console.log(`✅ Testmail${inhalt.en ? "s (de + en)" : " (de)"} an ${to} verschickt — Betreff beginnt mit [TEST].`);
  } else {
    const v = await api("vorschau");
    const dir = path.join(ROOT, ".tmp", "newsletter");
    mkdirSync(dir, { recursive: true });
    for (const locale of ["de", "en"]) {
      if (!v[locale]) continue;
      const out = path.join(dir, `${campaign}-${locale}.html`);
      writeFileSync(out, v[locale]);
      console.log(`👀 Vorschau ${locale}: ${path.relative(ROOT, out)}`);
      if (has("oeffnen")) spawnSync("open", [out]);
    }
    await status();
    console.log("\nNächste Schritte: --test <deine Adresse>, danach --senden. (--oeffnen zeigt die Vorschau im Browser)");
  }
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exit(1);
}
