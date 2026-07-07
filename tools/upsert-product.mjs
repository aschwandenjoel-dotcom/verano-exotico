/**
 * Produkt direkt in Supabase `products` schreiben (anlegen ODER aktualisieren).
 *
 * Nutzung:
 *   node tools/upsert-product.mjs pfad/zum/produkt.json
 *
 * Die JSON-Datei enthält genau die Spalten der `products`-Tabelle (siehe Beispiel
 * unten). Upsert läuft über `slug` (unique) — d.h. gleicher slug überschreibt,
 * neuer slug legt an. So ist der Aufruf gefahrlos wiederholbar (idempotent).
 *
 * Liest NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY aus .env.local.
 */
import { readFileSync } from "node:fs";

function env(key) {
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const line = txt.split("\n").find((l) => l.startsWith(key + "="));
  if (!line) throw new Error(`${key} fehlt in .env.local`);
  return line.slice(key.length + 1).trim();
}

const file = process.argv[2];
if (!file) {
  console.error("Aufruf: node tools/upsert-product.mjs <produkt.json>");
  process.exit(1);
}

const url = env("NEXT_PUBLIC_SUPABASE_URL");
const key = env("SUPABASE_SERVICE_ROLE_KEY");
const product = JSON.parse(readFileSync(file, "utf8"));

const res = await fetch(`${url}/rest/v1/products?on_conflict=slug`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=representation",
  },
  body: JSON.stringify(product),
});

const data = await res.json();
if (!res.ok) {
  console.error("❌ Supabase-Fehler:", JSON.stringify(data));
  process.exit(1);
}
const p = Array.isArray(data) ? data[0] : data;
console.log(`✅ Gespeichert: ${p.slug} — ${p.name_de} — CHF ${p.price} — ${p.active ? "aktiv" : "inaktiv"}`);
