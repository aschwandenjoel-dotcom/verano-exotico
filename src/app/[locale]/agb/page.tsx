import { LegalPage, Section } from "@/components/ui/LegalSections";
import type { Locale } from "@/types";

export const metadata = {
  title: "AGB – Verano Exotico",
};

export default async function AgbPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <LegalPage locale={locale as Locale} eyebrow="Rechtliches" title="AGB" stand="Stand: September 2026">
      <Section title="1. Geltungsbereich">
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Bestellungen über den
          Online-Shop von Verano Exotico, Inhaber Joel Aschwanden, Gotthardstrasse 59,
          6460 Altdorf, Schweiz (nachfolgend «wir»). Wir liefern weltweit, mit Ausnahme
          weniger Länder, die von unseren internationalen Logistikpartnern aktuell nicht
          beliefert werden können.
        </p>
      </Section>

      <Section title="2. Vertragsschluss">
        <p>
          Die Darstellung der Produkte im Online-Shop ist ein unverbindlicher Katalog.
          Mit dem Abschluss des Bestellvorgangs geben Sie ein verbindliches Angebot zum
          Kauf der Waren im Warenkorb ab. Der Kaufvertrag kommt mit dem Versand der
          Bestellbestätigung per E-Mail zustande.
        </p>
      </Section>

      <Section title="3. Preise, Versandkosten und Zahlung">
        <p>
          Alle Preise verstehen sich in Schweizer Franken (CHF). Zusätzlich zum Warenwert
          fallen Versandkosten an; diese werden individuell nach Zielland (Distanz) und
          Anzahl der Artikel berechnet, im Checkout vor Abgabe der Bestellung ausgewiesen
          und auf den Preis aufgeschlagen. Die aktuelle Versandkosten-Übersicht finden Sie
          auf der Seite «Versand &amp; Rückgabe».
        </p>
        <p style={{ marginTop: "12px" }}>
          Die Zahlung erfolgt <strong>per Kreditkarte, Debitkarte oder TWINT</strong> über
          unseren Zahlungsdienstleister Stripe. Nach dem Absenden der Bestellung werden Sie
          auf die gesicherte Bezahlseite von Stripe weitergeleitet; Ihre Karten- und
          Zahlungsdaten werden ausschliesslich dort erfasst und gelangen nicht auf unsere
          Systeme. Der Kaufvertrag kommt mit erfolgreicher Zahlung zustande. Es fallen
          keine zusätzlichen Zahlungsgebühren an.
        </p>
      </Section>

      <Section title="4. Lieferung">
        <p>
          Die Lieferung erfolgt aus internationalen Lagern unseres Logistikpartners direkt
          an die von Ihnen angegebene Lieferadresse. Die Lieferzeit beträgt in der Regel
          5–14 Werktage <strong>ab Zahlungsbestätigung</strong>. Sie erhalten eine
          Versandbestätigung mit Sendungsnummer, sobald Ihre Bestellung unterwegs ist.
          Details finden Sie auf der Seite «Versand &amp; Rückgabe». Allfällige
          Einfuhrabgaben, die im Einzelfall anfallen können, gehen zu Lasten der
          Empfängerin bzw. des Empfängers.
        </p>
      </Section>

      <Section title="5. Rückgabe & Reklamation">
        <p>
          Ein allgemeines Rückgaberecht „ohne Angabe von Gründen" besteht nicht. Wir
          nehmen Artikel ausschliesslich bei Mängeln zurück oder tauschen sie um —
          insbesondere bei Transportschäden, falscher Lieferung oder mangelhafter
          Qualität. Einzelheiten, Fristen und Ausnahmen (insbesondere
          Hygienebestimmungen bei Bademode) finden Sie auf der Seite
          «Rückgabe &amp; Reklamation».
        </p>
      </Section>

      <Section title="6. Eigentumsvorbehalt">
        <p>Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.</p>
      </Section>

      <Section title="7. Gewährleistung">
        <p>
          Es gelten die gesetzlichen Gewährleistungsrechte. Ist die gelieferte Ware
          mangelhaft, melden Sie sich bitte unter{" "}
          <a href="mailto:veranoexotico@gmail.com" style={{ color: "#1A3040" }}>veranoexotico@gmail.com</a>{" "}
          — wir finden eine Lösung (Ersatzlieferung oder Rückerstattung). Für Kundinnen
          und Kunden in der EU bleiben die zwingenden Verbraucherrechte ihres
          Wohnsitzstaates unberührt.
        </p>
      </Section>

      <Section title="8. Haftung">
        <p>
          Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie nach Massgabe
          zwingender gesetzlicher Bestimmungen. Bei leichter Fahrlässigkeit haften wir nur
          für Schäden aus der Verletzung wesentlicher Vertragspflichten, begrenzt auf den
          vorhersehbaren, vertragstypischen Schaden. Die Haftung für mittelbare Schäden
          und entgangenen Gewinn ist — soweit gesetzlich zulässig — ausgeschlossen.
        </p>
      </Section>

      <Section title="9. Datenschutz">
        <p>
          Informationen zur Verarbeitung Ihrer personenbezogenen Daten finden Sie in
          unserer Datenschutzerklärung.
        </p>
      </Section>

      <Section title="10. Anwendbares Recht und Gerichtsstand">
        <p>
          Es gilt schweizerisches Recht unter Ausschluss des UN-Kaufrechts (CISG).
          Für Verbraucherinnen und Verbraucher mit Wohnsitz in der EU bleiben die
          zwingenden Bestimmungen des Rechts ihres Wohnsitzstaates sowie die dortigen
          Gerichtsstände vorbehalten.
        </p>
      </Section>

      <Section title="11. Schlussbestimmungen">
        <p>
          Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit
          der übrigen Bestimmungen davon unberührt. Massgebend ist die deutsche Fassung
          dieser AGB.
        </p>
      </Section>
    </LegalPage>
  );
}
