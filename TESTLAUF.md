# Testlauf: einmal komplett durch, bevor der Shop echtes Geld annimmt

Zum Abhaken, in genau dieser Reihenfolge. Ziel: eine Bestellung von der Kasse
bis zum CJ-Auftrag, erst im Stripe-Testmodus, dann einmal echt.

Rechne mit einem halben Tag. Wenn etwas klemmt: unten steht eine Tabelle mit den
wahrscheinlichsten Ursachen.

---

## Teil A — Vorbereitung

### ☐ A1. Migrationen einspielen
Hostpoint Control Panel → phpMyAdmin → deine Datenbank → Reiter **SQL**.
Nacheinander ausführen:

1. Inhalt von `hostpoint-migration-stripe.sql`
2. Inhalt von `hostpoint-migration-reviews.sql`

Meldet MySQL „Duplicate column name", existiert die Spalte schon — die Zeile
überspringen, das ist kein Fehler.

Danach prüfen:
```sql
show columns from orders like 'stripe%';        -- 2 Zeilen erwartet
show columns from orders like 'shipped_at';     -- 1 Zeile erwartet
show columns from reviews like 'verified';      -- 1 Zeile erwartet
```

### ☐ A2. Stripe-Konto im Testmodus öffnen
Oben rechts im Dashboard den Schalter auf **Testmodus** stellen. Alles in Teil B
passiert in diesem Modus — es fliesst kein echtes Geld.

### ☐ A3. Test-Keys nach Vercel
Stripe → **Developers → API keys** → „Secret key" kopieren (beginnt mit `sk_test_`).

Vercel → Projekt → **Settings → Environment Variables**:

| Variable | Wert |
|---|---|
| `PAYMENT_MODE` | `stripe` |
| `STRIPE_SECRET_KEY` | `sk_test_…` |
| `NEXT_PUBLIC_SITE_URL` | deine echte Domain, ohne Schrägstrich am Ende |
| `REVIEW_TOKEN_SECRET` | langer Zufallsstring (für die Bewertungsmails) |

### ☐ A4. Webhook anlegen
Stripe → **Developers → Webhooks → Add endpoint**

- URL: `https://<deine-domain>/api/stripe/webhook`
- Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
  `checkout.session.async_payment_failed`

Das angezeigte **Signing secret** (`whsec_…`) als `STRIPE_WEBHOOK_SECRET` nach
Vercel.

### ☐ A5. Neu deployen
Vercel übernimmt geänderte Umgebungsvariablen **nicht** automatisch.
Deployments → letztes Deployment → **Redeploy**.

---

## Teil B — Testbestellung (kein echtes Geld)

### ☐ B1. Kasse prüfen
Produkt in den Warenkorb, zur Kasse. Im dunklen Zahlungsblock muss jetzt
**„Sichere Zahlung per Karte & TWINT"** stehen. Steht dort noch etwas von
Banküberweisung, ist `PAYMENT_MODE` nicht angekommen → zurück zu A5.

### ☐ B2. Bezahlen
Formular ausfüllen, bestellen. Du landest auf der Stripe-Bezahlseite.

- Karte: `4242 4242 4242 4242`
- Ablaufdatum: irgendein Datum in der Zukunft
- CVC und PLZ: irgendwas

### ☐ B3. Bestätigungsseite
Erwartung: grüner Block **„Zahlung bestätigt"**.

Steht dort gelb „Zahlung wird geprüft", war der Webhook noch nicht da — einmal
neu laden. Bleibt es gelb, ist der Webhook das Problem (siehe Tabelle unten).

### ☐ B4. Webhook-Zustellung kontrollieren
Stripe → Developers → Webhooks → dein Endpunkt → Liste der Zustellungen.
Der letzte Eintrag muss **200** sein. Bei 400 oder 500: draufklicken, die
Antwort steht im Klartext da.

### ☐ B5. Mails kontrollieren
Zwei Mails müssen ankommen:

- an die Kundenadresse: „Bestellung #N bestätigt" — **ohne** IBAN und QR-Code
- an dich: „Neue Bestellung #N" mit dem Hinweis, dass Stripe bestätigt hat

**Auch den Spam-Ordner prüfen.** Solange der Absender `onboarding@resend.dev`
ist, ist das der wahrscheinlichste Fundort.

### ☐ B6. Admin kontrollieren
`/admin` öffnen. Die Bestellung steht auf **„Bei CJ bestellt"** oder
**„CJ-Fehler"** mit Fehlertext. Beides ist ein gültiges Ergebnis — wichtig ist,
dass sie **nicht** mehr auf „Wartet auf Zahlung" steht.

> **Das erzeugt einen echten CJ-Auftrag** — auch im Stripe-Testmodus läuft das
> Fulfillment gegen dein echtes CJ-Konto. Versandt wird davon nichts: CJ legt
> Aufträge als UNPAID an, und da auf deinem CJ-Konto ohnehin kein Guthaben
> liegt, kann gar nichts ausgelöst werden. Räum ihn danach trotzdem im
> CJ-Dashboard weg, damit du bei der echten Bestellung nicht zwei ähnliche
> Aufträge nebeneinander hast.

### ☐ B7. Abbruch testen
Zweite Bestellung starten, auf der Stripe-Seite den Zurück-Pfeil klicken.
Erwartung: Du landest auf der Kasse, oben ein gelber Hinweis „Die Zahlung wurde
abgebrochen", **Warenkorb noch gefüllt**. Im Admin bleibt diese Bestellung auf
„Wartet auf Zahlung" — die kannst du dort ignorieren oder stornieren.

---

## Teil C — Echtbetrieb

### ☐ C1. Auf Live-Modus umstellen
Stripe-Dashboard oben rechts auf **Live** schalten. Dann:

- **Developers → API keys** → Live Secret Key (`sk_live_…`) → in Vercel eintragen
- **Developers → Webhooks → Add endpoint** — den Endpunkt aus A4 **noch einmal
  anlegen**. Test- und Live-Webhooks sind getrennt; der aus A4 existiert im
  Live-Modus nicht. Das neue `whsec_…` ersetzt das alte in Vercel.

### ☐ C2. Zahlungsarten aktivieren
Stripe → **Settings → Payment methods**. Karten sind an. **TWINT einschalten** —
das ist mit rund 1.9 % dein günstigster Kanal und für Schweizer Kundinnen der
gewohnte Weg. TWINT funktioniert nur bei Zahlung in CHF.

### ☐ C3. Redeploy
Wieder nötig, siehe A5.

### ☐ C4. Eine echte Bestellung bei dir selbst
Günstigstes Produkt, echte Karte, echte Lieferadresse. Das kostet dich den
Einkaufspreis und beantwortet auf einen Schlag: Kommt das Geld an? Läuft der
CJ-Auftrag? Wie lange dauert die Lieferung wirklich? Wie sieht das Produkt aus?

### ☐ C5. CJ-Guthaben für genau diese Bestellung aufladen
Du hältst bewusst kein Vorab-Guthaben auf CJ — also ist das hier **kein
einmaliger Schritt, sondern einer pro Bestellung**. Der Auftrag bleibt UNPAID
liegen, bis das Konto gedeckt ist; erst danach geht das Paket raus.

Der Auslöser dafür ist die Adminmail „Neue Bestellung #N", die bei Stripe
sofort nach der Zahlung kommt. **Am selben Tag aufladen und den Auftrag bei CJ
bezahlen** — sonst frisst die Wartezeit dein Lieferversprechen von 5–14
Werktagen auf, und zwar bevor das Paket überhaupt losgefahren ist.

Solange das Handarbeit bleibt, ist die Adminmail dein einziger Wecker. Wenn du
sie im Alltag übersiehst, lohnt sich später eine Erinnerung (z. B. täglicher
Cron, der offene bezahlte Bestellungen ohne CJ-Auftrag meldet).

### ☐ C6. Versandmail abwarten
Der Cron läuft täglich um 06:00 UTC. Sobald CJ eine Sendungsnummer meldet,
kommt automatisch die Versandmail — und `shipped_at` wird gesetzt, was 14 Tage
später die Bewertungsanfrage auslöst.

Wer nicht warten will: `REVIEW_REQUEST_DELAY_DAYS=0` setzen und den Endpunkt
einmal von Hand aufrufen:
```bash
curl -H "Authorization: Bearer <CRON_SECRET>" https://<domain>/api/reviews/request
```
Danach den Wert wieder auf 14 stellen.

---

## Wenn etwas nicht klappt

| Symptom | Wahrscheinliche Ursache |
|---|---|
| Bestellung bleibt auf „Wartet auf Zahlung", Geld ist bei Stripe | Webhook. Stripe → Webhooks → Zustellungen ansehen. **400** = falsches oder fehlendes `STRIPE_WEBHOOK_SECRET`. Keine Zustellung sichtbar = falsche URL oder Events nicht abonniert. |
| Kasse zeigt „Die Zahlung ist gerade nicht verfügbar" | `STRIPE_SECRET_KEY` fehlt im Deployment oder es wurde nach dem Setzen nicht neu deployt. |
| Kasse zeigt noch Banküberweisung | `PAYMENT_MODE` ist nicht `stripe`, oder Redeploy fehlt. |
| Keine Mails | Resend-Dashboard → Logs. Fehlt `RESEND_API_KEY`, wird gar nichts verschickt. Ist sie gesetzt, steht der Zustellstatus dort. |
| Admin zeigt „CJ-Fehler: Keine CJ-Variante für …" | Farbe/Grösse fehlt in `src/lib/cjMapping.ts` — dort ergänzen, dann im Admin nochmals auf „Bezahlt" setzen. |
| Admin zeigt „CJ-Fehler: Lieferadresse unvollständig" | Telefonnummer oder ein Adressfeld fehlt. CJ verlangt alle Felder. |
| Bewertung zeigt kein „Verifizierter Kauf" | `REVIEW_TOKEN_SECRET` fehlt, oder die Reviews-Migration (A1) lief nicht. |

## Zurück auf Vorkasse — falls es brennt

`PAYMENT_MODE=prepay` in Vercel, redeploy. Der komplette Vorkasse-Weg mit IBAN
und QR-Rechnung ist unverändert vorhanden. Zusätzlich liegt der alte Codestand
im Git-Tag `vorkasse-v1` und im Branch `backup/vorkasse`.
