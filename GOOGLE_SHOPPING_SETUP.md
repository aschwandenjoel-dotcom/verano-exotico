# Google Shopping & Pinterest — Produktfeed

Der Shop liefert unter **https://verano-exotico.ch/feed/google.xml** einen
Produktfeed im Google-Merchant-Format (Code: `src/app/feed/google.xml/route.ts`).
Er wird stündlich neu aus der Datenbank erzeugt — neue oder deaktivierte
Produkte erscheinen automatisch, es muss nichts von Hand gepflegt werden.

Eine Zeile pro Grösse (S/M/L …), gruppiert per `item_group_id`. Preise in CHF,
Texte auf Deutsch, Versand Schweiz CHF 4.90.

## 1. Google Merchant Center (kostenlose Shopping-Listings)

Google zeigt Produkte im Reiter „Shopping" auch **ohne Werbebudget**, sobald
ein Feed hinterlegt ist. Das ist der günstigste Kanal für Leute mit
Kaufabsicht („bikini kaufen schweiz", „high waist bikini").

1. https://merchants.google.com → mit dem Google-Konto anmelden, Konto
   erstellen (Unternehmen: Verano Exotico, Land: Schweiz, Zeitzone Zürich).
2. **Unternehmensinformationen** ausfüllen: Website `https://verano-exotico.ch`,
   Adresse wie im Impressum, Kundendienst-Mail `veranoexotico@gmail.com`.
3. **Website verifizieren und beanspruchen**: Google bietet mehrere Wege.
   Am einfachsten „HTML-Tag" — den Meta-Tag an Claude geben, er baut ihn ins
   Layout ein. Alternativ über die Search Console, falls die Domain dort schon
   verifiziert ist.
4. **Versand** (Settings → Shipping): Schweiz, Pauschale CHF 4.90, Lieferzeit
   5–14 Werktage (Bearbeitung 1–3 Tage + Transit 5–11 Tage). Die Angabe muss
   mit der /versand-Seite übereinstimmen, sonst gibt es Beanstandungen.
5. **Rückgabe** (Settings → Returns): 14 Tage, Kundin trägt Rücksendekosten —
   wie in den AGB.
6. **Produkte → Feeds → Hinzufügen**:
   - Land: Schweiz, Sprache: Deutsch
   - Eingabemethode: **Geplanter Abruf** (Scheduled fetch)
   - Dateiname: `google.xml`
   - URL: `https://verano-exotico.ch/feed/google.xml`
   - Abruf täglich, Uhrzeit egal
7. Nach dem ersten Abruf unter **Produkte → Alle Produkte** prüfen. Typische
   Beanstandungen und was zu tun ist:

| Meldung | Ursache / Lösung |
|---|---|
| „Fehlender Wert: gtin" | Ist über `identifier_exists=no` abgefangen. Falls doch gemeldet: Feed-Regel „gtin ignorieren" hinzufügen. |
| „Bild zu klein" | Google will mind. 250×250, empfohlen 800+. Alle Produktbilder sind 800–1340 px, sollte nicht auftreten. |
| „Preis stimmt nicht mit Landingpage überein" | Google prüft die Produktseite. Passiert, wenn der Kunde-Währungsschalter auf EUR steht — die Seite zeigt standardmässig CHF, das passt. |
| „Nicht verfügbare Landingpage" | Produkt wurde deaktiviert, Feed noch nicht neu abgerufen. Löst sich beim nächsten Abruf. |
| „Fehlende Versandinformationen" | Schritt 4 nicht gemacht. |

Die Prüfung neuer Produkte dauert bis zu 3 Werktage. Danach erscheinen sie
unter „Kostenlose Einträge" (Free listings). Google Ads für Shopping wäre
derselbe Feed — nur Budget dazu, wenn es sich lohnt.

## 2. Pinterest (Katalog)

Pinterest akzeptiert dasselbe Format.

1. Pinterest-Unternehmenskonto anlegen (oder bestehendes umwandeln):
   https://business.pinterest.com
2. Website `verano-exotico.ch` beanspruchen (Einstellungen → Beanspruchte
   Konten → Website → HTML-Tag → an Claude geben).
3. **Anzeigen → Kataloge → Datenquelle hinzufügen**:
   URL `https://verano-exotico.ch/feed/google.xml`, Format „Automatisch
   erkennen", Währung CHF, Land Schweiz, Sprache Deutsch.
4. Nach dem Import: **Produktgruppen** anlegen (z. B. „Bikinis", „Badeanzüge",
   „Neu") — daraus entstehen automatisch Produkt-Pins mit Preis und Link.

## Später: DE/AT

Für Deutschland/Österreich braucht Google einen zweiten Feed mit EUR-Preisen
und Versand `DE 7.90 EUR` etc. Der Code ist darauf vorbereitet (Konstanten
`FEED_LOCALE`, `FEED_COUNTRY`, `chf()`), es fehlt nur eine zweite Route mit
Umrechnung über `src/lib/currency.ts`. Vorher: Rechtstexte für DE/AT prüfen
(LAUNCH_CHECKLIST.md).
