import { fetchProducts } from "@/lib/api";
import { CATEGORIES } from "@/lib/categories";
import { SITE_URL } from "@/lib/seo";
import { calcShipping } from "@/lib/shipping";

/**
 * /llms.txt – Klartext-Zusammenfassung des Shops für KI-Assistenten (Format nach
 * llmstxt.org). Nur belegte Fakten aus Impressum, FAQ, Versandlogik und Katalog –
 * keine Werbeversprechen und keine Anweisungen an KI-Systeme. Preise, Sortiment
 * und Versandkosten kommen live aus Code und Datenbank, damit nichts veraltet.
 */
export const revalidate = 3600;

export async function GET() {
  const products = await fetchProducts();
  const prices = products.map((p) => p.price);
  const min = Math.min(...prices).toFixed(2);
  const max = Math.max(...prices).toFixed(2);
  const chf = (country: string) => calcShipping(country, 1).toFixed(2);
  const de = `${SITE_URL}/de`;

  const categories = CATEGORIES.map((c) => {
    const count = products.filter(c.match).length;
    return `- [${c.de.label}](${de}/${c.slug}): ${count} Modelle`;
  }).join("\n");

  const body = `# Verano Exotico

> Verano Exotico ist ein Schweizer Online-Shop für Bademode – Bikinis, Badeanzüge und Bikini-Sets mit Rock oder Kleid. Einzelunternehmen von Joel Aschwanden mit Sitz in Altdorf (Kanton Uri). Bezahlung mit TWINT oder Karte, Versand in die Schweiz ab CHF ${chf("CH")}.

Leitsatz: «Golden Days, Timeless Wear.» – Bademode, die sich wie Ferien anfühlt und nicht nach einer Saison verschwindet.

## Fakten
- Sortiment: ${products.length} Modelle, Preise von CHF ${min} bis CHF ${max}
- Grössen: je nach Modell S bis XL bzw. Einheitsgrösse; jede Produktseite hat eine Grössentabelle mit Körpermassen
- Bezahlung: TWINT, Kredit- und Debitkarte (über Stripe), ohne Zusatzgebühren
- Versand: weltweit; ab CHF ${chf("CH")} (Schweiz/Liechtenstein), ab CHF ${chf("DE")} (Europa), ab CHF ${chf("US")} (übrige Länder), plus kleiner Zuschlag pro weiterem Artikel
- Lieferzeit: in der Regel 5–14 Werktage ab Zahlungseingang, Versand aus internationalen Lagern des Logistikpartners, mit Sendungsnummer
- Rückgabe: kein allgemeines Rückgaberecht; bei Mängeln (Transportschaden, falsche Lieferung, Qualitätsmangel) Rücknahme oder Umtausch, Meldung innert 14 Tagen nach Erhalt
- Sprachen der Website: Deutsch und Englisch
- Produktbilder: Packshots, Model- und Kampagnenbilder sind KI-generiert und auf der Website als «KI-generiert» gekennzeichnet

## Kategorien
${categories}

## Wichtige Seiten
- [Shop – alle Produkte](${de}/collection)
- [Über uns](${de}/about): Geschichte der Marke
- [Philosophie](${de}/philosophie): wofür Verano Exotico steht
- [Auf einen Blick](${de}/auf-einen-blick): Kernfakten zu Firma, Sitz, Sortiment, Bezahlung und Versand
- [FAQ](${de}/faq): Lieferung, Bezahlung, Grössen, Rückgabe
- [Versand & Rückgabe](${de}/versand)
- [Impressum](${de}/impressum)

## Kontakt
- E-Mail: veranoexotico@gmail.com
- Telefon: +41 79 389 66 59
- Adresse: Verano Exotico, Joel Aschwanden, Gotthardstrasse 59, 6460 Altdorf, Schweiz
- Instagram: https://www.instagram.com/veranoexotico/
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
