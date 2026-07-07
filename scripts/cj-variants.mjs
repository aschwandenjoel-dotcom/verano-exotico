/**
 * CJ-Varianten-Auflister
 * Nutzung:
 *   node scripts/cj-variants.mjs <CJ-Produkt-Link ODER pid>
 *
 * Beispiel:
 *   node scripts/cj-variants.mjs "https://www.cjdropshipping.com/product/xyz-p-2408....html"
 *   node scripts/cj-variants.mjs 2408301234567890
 *
 * Gibt für jede Variante die vid, den Namen (Farbe-Größe) und den Preis aus.
 */
import { readFileSync } from "node:fs";

const BASE = "https://developers.cjdropshipping.com/api2.0/v1";

function getApiKey() {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const line = env.split("\n").find((l) => l.startsWith("CJ_API_KEY="));
  const key = line ? line.slice("CJ_API_KEY=".length).trim() : "";
  if (!key || key.includes("HIER_DEINEN")) throw new Error("CJ_API_KEY nicht gesetzt in .env.local");
  return key;
}

function extractPid(arg) {
  if (!arg) throw new Error("Bitte CJ-Produkt-Link oder pid angeben.");
  // pid=... in URL
  const q = arg.match(/[?&]pid=([^&]+)/);
  if (q) return q[1];
  // ...-p-<pid>.html
  const p = arg.match(/-p-([A-Za-z0-9-]+)\.html/);
  if (p) return p[1];
  // reine ID
  return arg.trim();
}

async function main() {
  const apiKey = getApiKey();
  const pid = extractPid(process.argv[2]);

  const tokRes = await fetch(`${BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  const tok = await tokRes.json();
  if (!tok.data?.accessToken) throw new Error(`Token-Fehler: ${tok.message}`);

  const res = await fetch(`${BASE}/product/query?pid=${encodeURIComponent(pid)}`, {
    headers: { "CJ-Access-Token": tok.data.accessToken },
  });
  const json = await res.json();
  if (!json.data) throw new Error(`Produkt-Fehler: ${json.message}`);

  const p = json.data;
  console.log(`\nProdukt: ${p.productNameEn ?? p.productName ?? "(?)"}`);
  console.log(`pid: ${p.pid ?? pid}\n`);

  const variants = p.variants ?? [];
  if (variants.length === 0) {
    console.log("Keine Varianten gefunden.");
    return;
  }
  console.log(`${variants.length} Variante(n):\n`);
  for (const v of variants) {
    const name = v.variantKey || v.variantNameEn || v.variantSku;
    console.log(`  "${name}"`);
    console.log(`     vid:   ${v.vid}`);
    console.log(`     preis: $${v.variantSellPrice}`);
    console.log("");
  }
  console.log("→ Trage die vids in src/lib/cjMapping.ts ein (Schlüssel = \"Farbname|Größe\").");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
