import { LegalPage, Section } from "@/components/ui/LegalSections";
import type { Locale } from "@/types";

export const metadata = {
  title: "FAQ – Verano Exotico",
};

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <LegalPage locale={locale as Locale} eyebrow="Service" title="FAQ">
      <Section title="Wie lange dauert die Lieferung?">
        <p>
          In der Regel 5–14 Werktage ab Zahlungseingang. Deine Bestellung wird aus
          internationalen Lagern unseres Logistikpartners versandt. Sobald sie unterwegs
          ist, bekommst du eine Versandbestätigung mit Sendungsnummer zum Verfolgen.
        </p>
      </Section>

      <Section title="Was kostet der Versand?">
        <p>
          Wir liefern weltweit. Der Versand wird individuell nach Zielland (Distanz)
          und Anzahl Artikel berechnet — ab CHF 4.90 (Schweiz/Liechtenstein), ab
          CHF 7.90 (Europa) bzw. ab CHF 16.90 (weltweit), plus ein kleiner Zuschlag
          pro weiterem Artikel. Den genauen Betrag siehst du im Checkout, bevor du
          bestellst. Die komplette Übersicht steht auf der Seite «Versand &amp; Rückgabe».
        </p>
      </Section>

      <Section title="Kann ich Artikel zurückgeben?">
        <p>
          Ein allgemeines Rückgaberecht bieten wir nicht an. Bei Mängeln — z. B.
          Transportschäden, falscher Lieferung oder mangelhafter Qualität — nehmen wir
          Artikel zurück oder tauschen sie um. Melde dich einfach innerhalb von 14 Tagen
          nach Erhalt per E-Mail mit deiner Bestellnummer und Fotos — alle Details
          stehen auf der Seite «Rückgabe &amp; Reklamation».
        </p>
      </Section>

      <Section title="Wie finde ich die richtige Grösse?">
        <p>
          Auf jeder Produktseite findest du den Button «Grössentabelle» mit den genauen
          Körpermassen für jede Grösse. Miss am besten kurz nach — so sitzt dein neues
          Lieblingsstück ab dem ersten Tag. Bist du zwischen zwei Grössen, empfehlen wir
          die grössere.
        </p>
      </Section>

      <Section title="Wie kann ich bezahlen?">
        <p>
          Mit Kreditkarte, Debitkarte oder TWINT — sicher über Stripe und ohne
          Zusatzgebühren. Nach dem Bestellen landest du auf der gesicherten Bezahlseite;
          deine Kartendaten sehen wir nie. Sobald die Zahlung bestätigt ist, bekommst du
          die Bestellbestätigung per E-Mail und wir machen dein Paket versandbereit.
        </p>
      </Section>

      <Section title="Wo ist meine Bestellung?">
        <p>
          Nach dem Versand erhältst du eine E-Mail mit deiner Sendungsnummer. Beachte:
          Je nach Zielland kann es einige Stunden dauern, bis die Nummer im
          Tracking-System auftaucht. Keine Mail bekommen? Schau im Spam-Ordner nach oder
          melde dich bei uns.
        </p>
      </Section>

      <Section title="Wie erreiche ich euch?">
        <p>
          Per E-Mail an{" "}
          <a href="mailto:veranoexotico@gmail.com" style={{ color: "#1A3040" }}>veranoexotico@gmail.com</a>{" "}
          oder telefonisch unter{" "}
          <a href="tel:+41793896659" style={{ color: "#1A3040" }}>+41 79 389 66 59</a>.
          Wir antworten in der Regel innert 24 Stunden.
        </p>
      </Section>
    </LegalPage>
  );
}
