import { NextResponse } from "next/server";
import daten from "@/data/orte.json";

/**
 * Ortssuche für die Kasse: liefert echte Postleitzahl-Ort-Kombinationen,
 * damit die Kundin PLZ, Ort und Land nicht von Hand eintippen muss.
 *
 * Datenquelle ist ein mitgelieferter GeoNames-Auszug (CC BY 4.0) für die
 * Länder mit nennenswertem Bestellaufkommen. Bewusst kein externer Dienst:
 * an der Kasse getippte Adressen sollen den Server nicht verlassen, und der
 * Bestellvorgang soll nicht von der Verfügbarkeit eines Dritten abhängen.
 * Für alle übrigen Länder gibt es keine Vorschläge — die Felder bleiben
 * normal von Hand ausfüllbar.
 */

export interface Ort {
  plz: string;
  ort: string;
  land: string;
  region: string;
}

// [plz, ort, land, region]
const ROHDATEN = daten as [string, string, string, string][];

/**
 * Vereinheitlicht Schreibweisen, damit "Zurich" auch "Zürich" findet,
 * "Muenchen" auch "München" und "Sankt Gallen" auch "St. Gallen".
 */
function normalisieren(s: string): string {
  return s
    .toLowerCase()
    // Erst Akzente entfernen: "Zürich" -> "zurich", "Genève" -> "geneve"
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    // Dann ausgeschriebene Umlaute auf dieselbe Form bringen, damit
    // "Muenchen" und "München" beide als "munchen" enden.
    .replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u").replace(/ss/g, "s")
    .replace(/\bsankt\b/g, "st")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Einmal pro Kaltstart aufgebaut — 35'000 Einträge, Suche danach rein im Speicher.
const INDEX = ROHDATEN.map(([plz, ort, land, region]) => ({
  plz, ort, land, region,
  suche: normalisieren(ort),
}));

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const land = (url.searchParams.get("land") ?? "").trim().toUpperCase();

  if (q.length < 2) return NextResponse.json([]);

  const suche = normalisieren(q);
  const istPlz = /^\d+$/.test(q);

  const treffer: { e: (typeof INDEX)[number]; rang: number }[] = [];
  for (const e of INDEX) {
    if (land && e.land !== land) continue;

    let rang: number;
    if (istPlz) {
      if (!e.plz.startsWith(q)) continue;
      rang = 0;
    } else if (e.suche.startsWith(suche)) {
      rang = 1; // Ortsname beginnt mit der Eingabe
    } else if (e.suche.includes(suche)) {
      rang = 2; // Eingabe kommt im Namen vor
    } else {
      continue;
    }
    treffer.push({ e, rang });
    // Genug Kandidaten gesammelt, um sinnvoll sortieren zu können
    if (treffer.length > 400) break;
  }

  treffer.sort(
    (a, b) =>
      a.rang - b.rang ||
      a.e.ort.length - b.e.ort.length ||
      a.e.ort.localeCompare(b.e.ort, "de") ||
      a.e.plz.localeCompare(b.e.plz)
  );

  const ergebnis: Ort[] = treffer.slice(0, 8).map(({ e }) => ({
    plz: e.plz, ort: e.ort, land: e.land, region: e.region,
  }));

  return NextResponse.json(ergebnis, {
    // Ortsdaten ändern sich nicht — Wiederholungen dürfen aus dem Cache kommen.
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
