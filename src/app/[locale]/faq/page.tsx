import { LegalPage, Section } from "@/components/ui/LegalSections";
import type { Locale } from "@/types";
import { getTranslations } from "next-intl/server";
import { faqJsonLd, pageMetadata } from "@/lib/seo";

// Inhalt gibt es nur auf Deutsch — /en/faq zeigt per Canonical auf /de/faq.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale: "de", namespace: "meta" });
  return pageMetadata(locale, "/faq", t("faq_title"), t("faq_description"), { germanOnly: true });
}

/**
 * Fragen und Antworten an einer Stelle: Die Seite und die strukturierten Daten
 * (FAQPage, für Google und KI-Assistenten) entstehen aus derselben Liste –
 * so weichen sie nie voneinander ab.
 */
const FAQ: { q: string; a: string }[] = [
  {
    q: "Wer steckt hinter Verano Exotico?",
    a: "Verano Exotico ist ein Einzelunternehmen von Joel Aschwanden mit Sitz in Altdorf (Kanton Uri, Schweiz). Wir wählen Bikinis, Badeanzüge und Bikini-Sets aus und verkaufen sie über diesen Online-Shop.",
  },
  {
    q: "Wie lange dauert die Lieferung?",
    a: "In der Regel 5–14 Werktage ab Zahlungseingang. Deine Bestellung wird aus internationalen Lagern unseres Logistikpartners versandt. Sobald sie unterwegs ist, bekommst du eine Versandbestätigung mit Sendungsnummer zum Verfolgen.",
  },
  {
    q: "Was kostet der Versand?",
    a: "Wir liefern weltweit. Der Versand wird individuell nach Zielland (Distanz) und Anzahl Artikel berechnet — ab CHF 4.90 (Schweiz/Liechtenstein), ab CHF 7.90 (Europa) bzw. ab CHF 16.90 (weltweit), plus ein kleiner Zuschlag pro weiterem Artikel. Den genauen Betrag siehst du im Checkout, bevor du bestellst. Die komplette Übersicht steht auf der Seite «Versand & Rückgabe».",
  },
  {
    q: "Kann ich Artikel zurückgeben?",
    a: "Ein allgemeines Rückgaberecht bieten wir nicht an. Bei Mängeln — z. B. Transportschäden, falscher Lieferung oder mangelhafter Qualität — nehmen wir Artikel zurück oder tauschen sie um. Melde dich einfach innerhalb von 14 Tagen nach Erhalt per E-Mail mit deiner Bestellnummer und Fotos — alle Details stehen auf der Seite «Rückgabe & Reklamation».",
  },
  {
    q: "Wie finde ich die richtige Grösse?",
    a: "Auf jeder Produktseite findest du den Button «Grössentabelle» mit den genauen Körpermassen für jede Grösse. Miss am besten kurz nach — so sitzt dein neues Lieblingsstück ab dem ersten Tag. Bist du zwischen zwei Grössen, empfehlen wir die grössere.",
  },
  {
    q: "Wie kann ich bezahlen?",
    a: "Mit Kreditkarte, Debitkarte oder TWINT — sicher über Stripe und ohne Zusatzgebühren. Nach dem Bestellen landest du auf der gesicherten Bezahlseite; deine Kartendaten sehen wir nie. Sobald die Zahlung bestätigt ist, bekommst du die Bestellbestätigung per E-Mail und wir machen dein Paket versandbereit.",
  },
  {
    q: "Sind die Produktbilder echt?",
    a: "Unsere Packshots, Model- und Kampagnenbilder sind mit KI erstellt – nach Vorlage der echten Modelle in Farbe, Schnitt und Details – und auf der Website als «KI-generiert» gekennzeichnet. Fotos unserer Lieferanten zeigen wir ohne diese Kennzeichnung.",
  },
  {
    q: "Wo ist meine Bestellung?",
    a: "Nach dem Versand erhältst du eine E-Mail mit deiner Sendungsnummer. Beachte: Je nach Zielland kann es einige Stunden dauern, bis die Nummer im Tracking-System auftaucht. Keine Mail bekommen? Schau im Spam-Ordner nach oder melde dich bei uns.",
  },
  {
    q: "Wie erreiche ich euch?",
    a: "Per E-Mail an veranoexotico@gmail.com oder telefonisch unter +41 79 389 66 59. Wir antworten in der Regel innert 24 Stunden.",
  },
];

/** E-Mail-Adresse und Telefonnummer in Antworten anklickbar machen. */
function Answer({ text }: { text: string }) {
  const parts = text.split(/(veranoexotico@gmail\.com|\+41 79 389 66 59)/);
  return (
    <p>
      {parts.map((part, i) =>
        part === "veranoexotico@gmail.com" ? (
          <a key={i} href="mailto:veranoexotico@gmail.com" style={{ color: "#1A3040" }}>{part}</a>
        ) : part === "+41 79 389 66 59" ? (
          <a key={i} href="tel:+41793896659" style={{ color: "#1A3040" }}>{part}</a>
        ) : (
          part
        )
      )}
    </p>
  );
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <LegalPage locale={locale as Locale} eyebrow="Service" title="FAQ">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQ)) }}
      />
      {FAQ.map((item) => (
        <Section key={item.q} title={item.q}>
          <Answer text={item.a} />
        </Section>
      ))}
    </LegalPage>
  );
}
