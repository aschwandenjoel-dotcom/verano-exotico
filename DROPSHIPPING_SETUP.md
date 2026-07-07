# CJ-Dropshipping Automatik — Einrichtung

Automatischer Ablauf, der jetzt im Code steckt (Vorkasse-Modell, ohne Stripe):

```
Kunde bestellt (/checkout, Vorkasse)
  → POST /api/checkout             legt Bestellung an (Status "Wartet auf Zahlung")
                                   + E-Mail mit IBAN & Referenz VE-<Nr> an Kunden
  → Kunde überweist … Admin prüft Bankkonto und setzt in /admin den Status "Bezahlt"
  → PATCH /api/orders/[id]         löst dabei die CJ-Bestellung aus (blind, an Kundenadresse)
  → Cron /api/fulfillment/sync     holt Tracking-Nr. → Status "shipped" + Versand-Mail
```

Versandkosten werden in `src/lib/shipping.ts` berechnet (Zielland-Zone + Artikelanzahl)
und als eigene Position `_shipping` in `order_items` gespeichert; `orders.subtotal`
ist der Zahlbetrag inkl. Versand.

Damit es **funktioniert**, sind 4 Dinge nötig:

## 1. Supabase-Spalten anlegen
Im Supabase SQL-Editor ausführen:

```sql
alter table orders add column if not exists cj_order_id       text;
alter table orders add column if not exists cj_order_status   text;
alter table orders add column if not exists tracking_number   text;
alter table orders add column if not exists tracking_provider text;
alter table orders add column if not exists fulfillment_error text;
```

## 2. Umgebungsvariablen (.env.local)
```bash
CJ_API_KEY=CJUserNum@api@xxxxxxxxxxxxxxxxxxxx   # CJ-Dashboard → Authorization → API-Key
CJ_LOGISTIC_NAME=CJPacket Ordinary             # optional, Versandart
CJ_FROM_COUNTRY_CODE=CN                         # optional
CRON_SECRET=irgendein-langes-zufalls-geheimnis # schützt den Sync-Endpunkt
```
CJ-API-Key erstellen: CJ-Konto → Menü **Authorization / API** → Key generieren.

## 3. Produkte verknüpfen (src/lib/cjMapping.ts)
Jede Farbe/Grösse braucht die CJ-Varianten-ID (`vid`). Diese steht im CJ-Dashboard
beim Produkt. Beispiel:
```ts
"neve-turtleneck": {
  variants: {
    "Off-White|One Size": "1449456408616841216",
    "Noir|One Size":      "1449456408616841217",
  },
},
```
Farbname + Grösse müssen exakt wie in `src/lib/products.ts` geschrieben sein.

## 4. Cron-Job für Tracking-Sync
Ruft alle ~30 Min den Sync auf. Bei Vercel z.B. `vercel.json`:
```json
{ "crons": [{ "path": "/api/fulfillment/sync", "schedule": "*/30 * * * *" }] }
```
Der Cron muss den Header `Authorization: Bearer <CRON_SECRET>` senden
(Vercel-Cron macht das automatisch, wenn CRON_SECRET gesetzt ist).

Manuell testen:
```bash
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/fulfillment/sync
```

## Blind Shipping / eigenes Branding
CJ liefert **standardmässig blind** — kein CJ-Absender, keine CJ-Rechnung im Paket.
Eigenes Logo / Verano-Exotico-Branding aufs Paket: im CJ-Dashboard unter
**Branding / Print-on-Demand** hinterlegen (nicht über die API).

## Wichtige Hinweise
- CJ-Bestellungen entstehen als **UNPAID** — dein CJ-Guthaben muss gedeckt sein,
  sonst wird nicht versandt. Guthaben im CJ-Dashboard aufladen (ggf. Auto-Pay aktivieren).
- Fehlgeschlagene Bestellungen bekommen Status `fulfillment_failed` +
  `fulfillment_error` (im Admin sichtbar) — dann Mapping/Adresse/Guthaben prüfen.
- **Amazon nicht als CJ-freie Quelle nutzen** — CJ ist der Lieferant, das ist ok.
