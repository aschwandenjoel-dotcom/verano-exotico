# Launch-Checkliste — Verano Exotico

Stand: 6. Juli 2026 (aktualisiert nach Umstellung auf Vorkasse-Checkout).
Punkte mit ☐ musst du selbst erledigen, alles andere ist bereits im Code.

## 1. ☐ MySQL-Datenbank bei Hostpoint einrichten (Datenbank, nicht Hosting!)

Die App läuft komplett auf Vercel — Hostpoint wird nur noch als MySQL-Datenbank
genutzt (Supabase/Postgres wurde abgelöst). Schritte:

1. Im Hostpoint Control Panel eine MySQL-Datenbank + Benutzer anlegen.
2. Unter „Datenbank-Benutzer" → Reiter „Hosts" die IP(s) freigeben, von denen
   aus zugegriffen werden darf. **Wichtig:** Vercel-Serverless-Functions haben
   keine feste ausgehende IP — entweder alle Hosts (`%`) freigeben (mit starkem,
   für diese DB einzigartigem Passwort) oder Vercel Secure Compute (feste IP,
   kostenpflichtig) nutzen.
3. `hostpoint-schema.sql` (Projekt-Root) im Hostpoint-DB-Tool (phpMyAdmin o.ä.) ausführen.
4. Die 57 aktuellen Produkte und ggf. bestehende Bestellungen manuell aus
   Supabase exportieren und ins neue Schema importieren (nicht automatisiert,
   da kein Zugriff auf beide Zugangsdaten gleichzeitig bestand).
5. Verbindungsdaten als `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   in `.env.local` und in Vercel eintragen (siehe Abschnitt 3).

Bis das erledigt ist: Shop-Seiten, die Produkte/Bestellungen brauchen, zeigen
Fehler bzw. fallen auf die statischen Fallback-Produkte in `src/lib/products.ts`
zurück (siehe `src/lib/api.ts`).

## 2. ☐ Bankverbindung eintragen (WICHTIG — ohne sie keine Zahlungen!)

In `.env.local` (und in Vercel) ausfüllen:

```bash
PAYMENT_IBAN=CH…                      # deine IBAN für Kundenzahlungen
PAYMENT_ACCOUNT_HOLDER=Joel Aschwanden
```

Solange `PAYMENT_IBAN` leer ist, steht auf Bestätigungsseite und E-Mail nur
„Du erhältst die Bankverbindung per E-Mail" — d. h. du müsstest jede Zahlung
manuell anstossen. **Vor dem ersten Verkauf eintragen.**

**Fremdwährungs-Zahlungen (Neon-Konto):** An der Kasse kann die Kundin CHF, EUR,
USD oder GBP als Zahlungswährung wählen (`src/lib/currency.ts`, statische
Umrechnungskurse). Neon selbst führt nur ein CHF-Konto, rechnet eingehende
Fremdwährung aber automatisch zum Mastercard-Referenzkurs + ca. 1.5 % Marge in
CHF um. Das heisst: der bei dir ankommende CHF-Betrag weicht normalerweise
leicht vom auf der Website berechneten CHF-Betrag ab — beim Zahlungsabgleich im
Admin daher nicht auf exakte Übereinstimmung prüfen, sondern anhand der
Referenznummer (VE-Nr) zuordnen.

> **Vor der ersten echten Bestellung:** `TESTLAUF.md` einmal komplett
> durcharbeiten — Migrationen, Stripe-Keys, Webhook und eine Testbestellung bis
> zum CJ-Auftrag, in Klickreihenfolge zum Abhaken.

## 3. ☐ Umgebungsvariablen in Vercel

| Variable | Status |
|---|---|
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | ☐ Zugangsdaten der Hostpoint-MySQL-Datenbank (siehe Abschnitt 1) in Vercel setzen. |
| `ADMIN_PASSWORD` | ✅ Lokal bereits auf ein starkes Passwort rotiert (Wert in `.env.local`, Backup in `.env.local.backup-…`). ☐ Denselben Wert in Vercel setzen. |
| `PAYMENT_IBAN` / `PAYMENT_ACCOUNT_HOLDER` | ☐ In Vercel setzen (siehe oben). |
| `CRON_SECRET` | gesetzt lassen — Tracking-Sync ist fail-closed. |
| `REVIEW_TOKEN_SECRET` | ☐ Langes Zufalls-Geheimnis setzen — signiert die Links in der Bewertungs-Mail. Ohne diese Variable wird keine Bewertungsanfrage verschickt (siehe `REVIEWS_SETUP.md`). |
| `REVIEW_REQUEST_DELAY_DAYS` | optional — Tage zwischen Versand und Bewertungsanfrage (Standard 14). |
| `NEXT_PUBLIC_SITE_URL` | echte Domain — für Sitemap, OG, JSON-LD. |
| `RESEND_FROM_EMAIL` | ☐ Eigene Domain bei Resend verifizieren und hier eintragen (Fallback `onboarding@resend.dev` wirkt wie Spam). Ohne eigene Domain nicht änderbar — braucht deinen Domain-Kauf/DNS-Zugang. |
| `PAYMENT_MODE` | ☐ Auf `stripe` setzen (oder `prepay` für die alte Vorkasse — siehe `STRIPE_SETUP.md`). |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | ☐ Aus dem Stripe-Dashboard setzen. Ohne Webhook-Secret wird nach der Zahlung weder bestätigt noch bei CJ bestellt. |
| `PAYMENT_IBAN` / `PAYMENT_ACCOUNT_HOLDER` | Stehen lassen — werden im Prepay-Modus wieder gebraucht. |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Nicht mehr verwendet — Supabase wurde durch Hostpoint-MySQL ersetzt. Können in Vercel gelöscht werden. |

## 4. Das neue Verkaufssystem (Vorkasse — 0 % Zahlungsgebühren)

```
/checkout (Formular + Live-Versandkosten)
  → POST /api/checkout   Preise werden SERVERSEITIG aus der DB gelesen,
                         Versand nach Zielland + Artikelanzahl aufgeschlagen,
                         Bestellung = Status "Wartet auf Zahlung",
                         Kunde bekommt IBAN + Referenz VE-<Nr> (Seite + E-Mail)
  → Du prüfst dein Bankkonto und setzt im /admin den Status "Bezahlt"
  → Dabei wird automatisch die CJ-Bestellung ausgelöst
  → Cron-Sync holt Tracking → Kunde bekommt Versand-Mail
  → 14 Tage später: Cron fragt per Mail nach einer Produktbewertung
```

**Versandkosten** (in `src/lib/shipping.ts` anpassbar, überall einheitlich):

| Zone | Grundpreis | je weiterer Artikel | Deckel |
|---|---|---|---|
| CH / LI | CHF 4.90 | + CHF 1.00 | CHF 14.90 |
| DE / AT | CHF 7.90 | + CHF 1.50 | CHF 19.90 |

„Distanz" ist über diese Länder-Zonen abgebildet (näher = günstiger) — echte
Kilometer-Berechnung wäre bei Versand aus internationalen Lagern Scheingenauigkeit.

## 5. ☐ Offene Entscheidungen / Empfehlungen

- **Coach-Hinweis Conversion:** Nur-Vorkasse ist die einzige gebührenfreie
  Zahlart, kostet aber erfahrungsgemäss deutlich Conversion (viele Kundinnen
  brechen ab, wenn keine Karte/TWINT möglich ist) und macht dir manuelle Arbeit
  (Zahlungen abgleichen). Wenn der Umsatz anläuft, lohnt sich Stripe/TWINT trotz
  Gebühren fast immer. Das alte Stripe-Setup ist in der Git-Historie erhalten.
- **Zahlungsfrist überwachen:** AGB sagen 10 Tage. Bestellungen, die nicht
  bezahlt werden, im /admin auf „Storniert" setzen (kein Automatismus eingebaut).
- **Produkt-Duplikate mergen** (Cumbre/Safari/Tótem/Micro/Tanga): nur zusammen
  mit `src/lib/cjMapping.ts` anfassen, sonst bricht das CJ-Fulfillment.
- ~~Landing & Story auf Englisch~~ ✅ Erledigt (6. Juli): Landing + Über-uns sind
  voll übersetzt (`landing`/`about`-Namespaces), Sprachumschalter DE/EN im Header.
  Slogans („Golden Days, Timeless Wear", Manifest) bleiben bewusst englisch/gleich.
- **Rechtstexte** (AGB/Widerruf/Versand/Datenschutz) vor grossem DE/AT-Marketing
  fachlich gegenlesen lassen.
- **Newsletter Double-Opt-in** nachrüsten, bevor Marketing-Mails verschickt werden.
- Lokaler Produkt-Fallback `src/lib/products.ts` enthält noch alte Texte.

## 6. Früher umgesetzt (Audit vom 5./6. Juli)

Admin-APIs abgesichert (Cookie/`x-admin-key`), Rechtsseiten (/agb, /widerruf,
/versand, /faq), Datenschutz inkl. CJ/China, Reviews & Newsletter auf Supabase,
SEO-Basics (robots, sitemap, OG-Bild, JSON-LD), Landing-Copy auf Bademode,
Produktdaten-Fixes in der DB, E-Mail-Impressum.
