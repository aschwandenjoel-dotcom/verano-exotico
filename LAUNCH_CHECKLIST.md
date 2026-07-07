# Launch-Checkliste — Verano Exotico

Stand: 6. Juli 2026 (aktualisiert nach Umstellung auf Vorkasse-Checkout).
Punkte mit ☐ musst du selbst erledigen, alles andere ist bereits im Code.

## 1. ☐ SQL in Supabase ausführen (einmalig, ~30 Sekunden)

Supabase-Dashboard → SQL Editor → einfügen → Run:

```sql
-- Echte Produkt-Reviews (ersetzt localStorage)
CREATE TABLE IF NOT EXISTS reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL,
  name         text NOT NULL DEFAULT 'Anonym',
  rating       int  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      text NOT NULL,
  approved     boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reviews_product_idx ON reviews (product_slug, created_at DESC);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Newsletter-Anmeldungen
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL UNIQUE,
  locale     text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Zahlungswährung (Kasse: Kundin kann in CHF/EUR/USD/GBP/CAD/AUD zahlen)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_currency text DEFAULT 'CHF';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_amount numeric(10,2);

-- Website-Sprache zum Bestellzeitpunkt (damit Bestätigungs-/Versand-Mail in der
-- richtigen Sprache rausgehen, nicht immer auf Deutsch)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS locale text DEFAULT 'de';
```

Bis das ausgeführt ist: Shop läuft normal, aber Review-/Newsletter-Formulare
zeigen eine „derzeit nicht möglich"-Meldung, die Kasse speichert Bestellungen
weiterhin nur in CHF (Fremdwährungs-Auswahl wird ignoriert), und alle Mails
gehen auf Deutsch raus (Sprachauswahl wird ignoriert) — bricht nichts, zeigt
nur nicht die neuen Felder an, bis die Spalten existieren.

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

## 3. ☐ Umgebungsvariablen in Vercel

| Variable | Status |
|---|---|
| `ADMIN_PASSWORD` | ✅ Lokal bereits auf ein starkes Passwort rotiert (Wert in `.env.local`, Backup in `.env.local.backup-…`). ☐ Denselben Wert in Vercel setzen. |
| `PAYMENT_IBAN` / `PAYMENT_ACCOUNT_HOLDER` | ☐ In Vercel setzen (siehe oben). |
| `CRON_SECRET` | gesetzt lassen — Tracking-Sync ist fail-closed. |
| `NEXT_PUBLIC_SITE_URL` | echte Domain — für Sitemap, OG, JSON-LD. |
| `RESEND_FROM_EMAIL` | ☐ Eigene Domain bei Resend verifizieren und hier eintragen (Fallback `onboarding@resend.dev` wirkt wie Spam). Ohne eigene Domain nicht änderbar — braucht deinen Domain-Kauf/DNS-Zugang. |
| `STRIPE_*` | Nicht mehr verwendet — Stripe ist vollständig entfernt. Können in Vercel gelöscht werden. |

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
