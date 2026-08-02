#!/usr/bin/env node
/**
 * Testet den Gmail-SMTP-Versand mit den Zugangsdaten aus .env.local.
 *
 *   node tools/test-mail.mjs                  → schickt an GMAIL_USER selbst
 *   node tools/test-mail.mjs kundin@mail.com  → schickt an eine beliebige Adresse
 *
 * Voraussetzung: GMAIL_USER und GMAIL_APP_PASSWORD stehen in .env.local
 * (App-Passwort aus dem Google-Konto, nicht das normale Passwort).
 */
import { readFileSync } from "node:fs";
import nodemailer from "nodemailer";

function loadEnv(file) {
  const env = {};
  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    return env;
  }
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = { ...loadEnv(".env.local"), ...process.env };
const user = env.GMAIL_USER || "veranoexotico@gmail.com";
const pass = (env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");
const to = process.argv[2] || user;

if (!pass) {
  console.error("✗ GMAIL_APP_PASSWORD fehlt in .env.local — App-Passwort im Google-Konto erstellen und eintragen.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user, pass },
});

try {
  await transporter.verify();
  console.log(`✓ SMTP-Login als ${user} erfolgreich`);
  const info = await transporter.sendMail({
    from: `Verano Exotico <${user}>`,
    to,
    subject: "Testmail — Verano Exotico",
    html: `<p>Der Mailversand über <strong>${user}</strong> funktioniert.</p>`,
  });
  console.log(`✓ Testmail an ${to} versendet (${info.messageId})`);
} catch (err) {
  console.error("✗ Versand fehlgeschlagen:", err.message);
  if (String(err.message).includes("Username and Password not accepted")) {
    console.error("  → Meist ein falsches/abgelaufenes App-Passwort oder 2-Schritt-Verifizierung nicht aktiv.");
  }
  process.exit(1);
}
