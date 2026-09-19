# Echte Produktbewertungen — Einrichtung

Der Shop hat ein Bewertungssystem (Tabelle `reviews`, `/api/reviews`,
`ReviewSection` unter jedem Produkt), es war nur leer. Diese Automatik füllt es
mit echten Kundenstimmen — es werden **keine** Bewertungen erfunden oder
importiert.

```
Cron /api/fulfillment/sync      setzt Tracking-Nr. → Status "shipped" + shipped_at
  → 14 Tage später
  → Cron /api/reviews/request   Bewertungs-Mail mit einem Link je bestelltem Artikel
                                (…/product/<slug>?r=<token>#reviews)
  → Kundin bewertet             POST /api/reviews mit Token
                                → Bewertung wird als „Verifizierter Kauf" angezeigt
```

Nötig sind 3 Dinge:

## 1. Migration einspielen
`hostpoint-migration-reviews.sql` (Projekt-Root) einmalig in phpMyAdmin
ausführen. Sie ergänzt:

| Tabelle | Spalte | Zweck |
|---|---|---|
| `orders` | `shipped_at` | Startpunkt für die Wartezeit |
| `orders` | `review_request_sent_at` | verhindert doppelte Anfragen |
| `reviews` | `order_id` | Bezug zur Bestellung |
| `reviews` | `verified` | steuert das „Verifizierter Kauf"-Badge |
| `reviews` | Unique-Key | eine Bewertung je Artikel und Bestellung |

Der Code ist so gebaut, dass er **ohne** die Migration nicht kaputtgeht:
Bewertungen lassen sich weiterhin abgeben und anzeigen (dann ohne Badge), und
`/api/reviews/request` meldet einen 503 mit Hinweis auf die Migration.

Bereits versandte Bestellungen haben kein `shipped_at` und werden daher nicht
angeschrieben. Wer die bestehenden Kundinnen doch noch fragen will, setzt es
einmalig manuell (SQL steht am Ende der Migrationsdatei).

## 2. Umgebungsvariablen
```bash
REVIEW_TOKEN_SECRET=langes-zufalls-geheimnis   # signiert die Bewertungslinks
REVIEW_REQUEST_DELAY_DAYS=14                   # optional, Standard 14
```
Ohne `REVIEW_TOKEN_SECRET` verschickt der Endpunkt gar nichts (fail closed) —
sonst gingen Links raus, die keinen verifizierten Kauf belegen können.
Das Secret nachträglich zu ändern entwertet alle bereits verschickten Links.

Ausserdem müssen `NEXT_PUBLIC_SITE_URL` (für die Links in der Mail) und die
Resend-Variablen gesetzt sein — beides ist für die anderen Mails schon nötig.

## 3. Cron-Job
Steht in `vercel.json`, täglich 09:00 UTC:
```json
{ "path": "/api/reviews/request", "schedule": "0 9 * * *" }
```
Das ist der **zweite** Cron-Job — der Vercel-Hobby-Plan erlaubt genau zwei und
nur täglichen Takt. Ein dritter Job bräuchte Vercel Pro oder einen externen
Dienst (z.B. cron-job.org) mit Header `Authorization: Bearer <CRON_SECRET>`.

Manuell testen:
```bash
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/reviews/request
```
Antwort z.B. `{"checked":3,"sent":3,"results":[…]}`. Pro Lauf werden maximal
25 Bestellungen angeschrieben (Resend-Limit: 2 Mails/Sekunde, daher 0.6 s Pause
zwischen den Mails). Der Rest kommt am nächsten Tag dran.

## Wie der Token funktioniert
`src/lib/reviewToken.ts`: Der Token ist die Bestell-ID plus HMAC-SHA256 darüber
(`<32 Hex>.<32 Hex>`) — keine zusätzliche Tabelle nötig. Beim Absenden einer
Bewertung prüft `/api/reviews`:

1. Ist die Signatur gültig?
2. Enthält **diese** Bestellung tatsächlich **dieses** Produkt?

Nur wenn beides stimmt, wird `verified = true` gesetzt. Ein gefälschter oder
fremder Token führt nicht zu einem Fehler, sondern schlicht zu einer normalen,
unverifizierten Bewertung.

## Bekannte Grenzen
- **Bewertungen ohne Token sind weiterhin sofort öffentlich** (`approved`
  bleibt standardmässig `true`). Wer Spam-Schutz will, setzt für unverifizierte
  Bewertungen `approved = false` und braucht dann eine Freigabe-Ansicht im
  `/admin` — die gibt es noch nicht.
- **Löschanfragen** (Datenschutzerklärung Ziffer 9: „Löschung jederzeit per
  E-Mail") müssen aktuell direkt in phpMyAdmin erledigt werden.
- Es gibt **keine Erinnerungsmail**. Eine Anfrage pro Bestellung, das war's.
- Rücklaufquote realistisch 5–15 %. Bei 20 Bestellungen sind das ein bis drei
  Bewertungen — das braucht Zeit und Bestellungen, es gibt keine Abkürzung.
