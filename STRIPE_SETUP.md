# Stripe-Checkout — Einrichtung

Der Shop kann beide Zahlungswege, umgeschaltet über **eine** Umgebungsvariable:

```bash
PAYMENT_MODE=stripe   # Kartenzahlung über Stripe Checkout
PAYMENT_MODE=prepay   # Vorkasse per IBAN + Schweizer QR-Rechnung (0 % Gebühren)
```

Ohne gesetzte Variable entscheidet, ob `STRIPE_SECRET_KEY` vorhanden ist.
Der Code-Stand vor der Umstellung liegt zusätzlich im Git-Tag `vorkasse-v1`
und im Branch `backup/vorkasse` — der Vorkasse-Code ist aber gar nicht gelöscht
worden, ein Zurückschalten ist also reine Konfigurationssache.

## Ablauf mit Stripe

```
Kunde bestellt (/checkout)
  → POST /api/checkout          Preise serverseitig aus der DB, Versand berechnet,
                                Bestellung mit Status "pending" gespeichert,
                                Stripe-Checkout-Session erzeugt
  → Weiterleitung zu Stripe     Kartendaten liegen nie auf unserem Server
  → POST /api/stripe/webhook    Zahlung bestätigt → Status "paid"
                                → Bestätigungsmail + Adminmail
                                → CJ-Bestellung wird automatisch ausgelöst
  → Cron /api/fulfillment/sync  holt Tracking → Versandmail
  → Cron /api/reviews/request   14 Tage später: Bitte um Bewertung
```

Der entscheidende Unterschied zur Vorkasse: **Du musst im /admin nichts mehr
auf „Bezahlt" setzen.** Das erledigt der Webhook. Der manuelle Weg funktioniert
weiterhin, wird aber nur noch im Prepay-Modus gebraucht.

## 1. Umgebungsvariablen

```bash
PAYMENT_MODE=stripe
STRIPE_SECRET_KEY=sk_live_…        # Stripe-Dashboard → Developers → API keys
STRIPE_WEBHOOK_SECRET=whsec_…      # aus dem Webhook-Endpunkt (Schritt 3)
NEXT_PUBLIC_SITE_URL=https://…     # muss stimmen — daraus werden success/cancel-URLs gebaut
```

`PAYMENT_IBAN` und `PAYMENT_ACCOUNT_HOLDER` bleiben stehen: Sie werden nur im
Prepay-Modus verwendet und wären beim Zurückschalten sofort wieder nötig.

## 2. Migration einspielen

`hostpoint-migration-stripe.sql` in phpMyAdmin ausführen — legt
`stripe_session_id` und `stripe_payment_intent` an. Beide dienen nur der
Nachvollziehbarkeit; der Webhook findet die Bestellung über die
Stripe-Metadaten, nicht über diese Spalten. Ohne Migration funktioniert der
Bezahlvorgang also, im Admin fehlt nur die Stripe-Referenz.

## 3. Webhook einrichten (wichtigster Schritt)

Stripe-Dashboard → **Developers → Webhooks → Add endpoint**:

- URL: `https://<domain>/api/stripe/webhook`
- Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
  `checkout.session.async_payment_failed`

Das angezeigte **Signing secret** (`whsec_…`) gehört in `STRIPE_WEBHOOK_SECRET`.

Ohne Webhook passiert nach der Zahlung **nichts**: keine Bestätigungsmail, keine
CJ-Bestellung. Die Bestellung bliebe auf „pending" liegen, obwohl das Geld da
ist. Das ist die Stelle, die man nach dem Deployment als Erstes testet.

Lokal testen mit der Stripe-CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger checkout.session.completed
```

## 4. Zahlungsarten aktivieren

Im Stripe-Dashboard unter **Settings → Payment methods**. Der Code gibt bewusst
keine Liste vor, damit im Dashboard aktivierte Methoden automatisch erscheinen —
für Schweizer Kundinnen lohnt sich vor allem **TWINT** (deutlich günstiger als
Karte). TWINT funktioniert nur bei Zahlung in CHF.

## Was du über die Kosten wissen solltest

| | Gebühr |
|---|---|
| Schweizer Karten | 2.9 % + CHF 0.30 |
| Karten aus dem Ausland | 3.25 % + CHF 0.30 |
| Fremdwährung (EUR/USD/GBP/CAD/AUD) | zusätzlich 2 % Umrechnung |
| TWINT | ca. 1.9 % + CHF 0.30 |

Bei einer Bestellung von CHF 65 sind das rund CHF 2.20 mit Schweizer Karte und
etwa CHF 3.60 bei einer Auslandskarte in Fremdwährung. Zum Vergleich: Payrexx
oder PostFinance Checkout lägen bei rund CHF 1.20–1.30 (siehe die Recherche im
Chatverlauf). Der Wechsel wäre später jederzeit möglich — der Checkout-Code ist
über `PAYMENT_MODE` bereits auf zwei Wege ausgelegt.

## Währungen

Die Kundin wählt an der Kasse weiterhin ihre Zahlungswährung. Anders als bei der
Vorkasse wird der Betrag jetzt **tatsächlich in dieser Währung belastet**, nicht
mehr von der Bank umgerechnet. Grundlage sind die statischen Kurse in
`src/lib/currency.ts` — die sollten gelegentlich aktualisiert werden, sonst
verkaufst du bei Kursänderungen schleichend zu billig oder zu teuer.

Jede Position wird einzeln umgerechnet und gerundet; der Zahlbetrag ist die
Summe der Positionen. Deshalb kann er um wenige Rappen vom umgerechneten
Gesamtbetrag abweichen — Beleg und Belastung stimmen aber immer überein.

## Bekannte Grenzen

- **Keine Rückerstattung aus dem Shop heraus.** Refunds laufen über das
  Stripe-Dashboard; der Bestellstatus im Admin ändert sich dadurch nicht.
- **Die Erfolgsseite ist kein Zahlungsnachweis.** Sie zeigt „Zahlung wird
  geprüft", bis der Webhook die Bestellung bestätigt hat. Wer die URL ohne
  Zahlung aufruft, sieht denselben Zustand — bezahlt ist nur, was der Webhook
  bestätigt.
- **Kein automatischer Lagerabgleich.** Wie bisher wird nicht geprüft, ob CJ die
  Variante überhaupt noch führt.
- **Scheitert die CJ-Bestellung**, bleibt die Zahlung trotzdem bestehen. Die
  Bestellung steht dann auf `fulfillment_failed` mit Fehlertext im Admin — dort
  gehört sie von Hand nachbearbeitet.
