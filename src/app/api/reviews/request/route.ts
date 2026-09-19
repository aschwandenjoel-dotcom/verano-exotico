import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sendReviewRequest } from "@/lib/email";
import { createReviewToken } from "@/lib/reviewToken";
import { isAdminRequest } from "@/lib/adminAuth";

interface OrderRow {
  id: string;
  order_number: number;
  customer_email: string;
  customer_name: string | null;
  locale: string | null;
}

interface ItemRow {
  order_id: string;
  product_slug: string;
  product_name: string;
  size: string | null;
  color_name: string | null;
}

/** Standard-Wartezeit nach Versand: CJ liefert in 5–14 Werktagen. */
const DEFAULT_DELAY_DAYS = 14;
/** Pro Lauf, damit das Resend-Limit (2 Mails/Sekunde) nicht gerissen wird. */
const BATCH_LIMIT = 25;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Schickt einige Tage nach Versand eine Bitte um Produktbewertung — die einzige
 * Quelle für echte Bewertungen im Shop. Jede Bestellung wird höchstens einmal
 * angeschrieben (`orders.review_request_sent_at`).
 *
 * Aufruf per Cron-Job (siehe vercel.json), geschützt über CRON_SECRET:
 *   GET /api/reviews/request   Header: Authorization: Bearer <CRON_SECRET>
 *
 * Voraussetzungen: Migration hostpoint-migration-reviews.sql eingespielt und
 * REVIEW_TOKEN_SECRET gesetzt (ohne Secret gäbe es keine verifizierten Links).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const cronOk = !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
  if (!cronOk && !isAdminRequest(req)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (!process.env.REVIEW_TOKEN_SECRET) {
    return NextResponse.json(
      { error: "REVIEW_TOKEN_SECRET fehlt — ohne Secret gibt es keine Bewertungslinks." },
      { status: 503 }
    );
  }

  const delayDays = Number(process.env.REVIEW_REQUEST_DELAY_DAYS) || DEFAULT_DELAY_DAYS;

  let orders: OrderRow[];
  try {
    orders = await query<OrderRow>(
      `SELECT id, order_number, customer_email, customer_name, locale
         FROM orders
        WHERE status IN ('shipped', 'delivered')
          AND shipped_at IS NOT NULL
          AND shipped_at <= date_sub(now(), interval ? day)
          AND review_request_sent_at IS NULL
          AND customer_email IS NOT NULL
        ORDER BY shipped_at
        LIMIT ${BATCH_LIMIT}`,
      [delayDays]
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fehler";
    const missing = /unknown column/i.test(message);
    return NextResponse.json(
      { error: missing ? `Migration fehlt: hostpoint-migration-reviews.sql ausführen (${message})` : message },
      { status: missing ? 503 : 500 }
    );
  }

  if (orders.length === 0) {
    return NextResponse.json({ sent: 0, results: [] });
  }

  // `_shipping` ist die Pseudo-Position für die Versandkosten (siehe
  // /api/checkout) — kein Produkt, also auch nichts zu bewerten.
  const items = await query<ItemRow>(
    `SELECT order_id, product_slug, product_name, size, color_name
       FROM order_items
      WHERE order_id IN (?) AND product_slug <> '_shipping'`,
    [orders.map((o) => o.id)]
  );
  const itemsByOrder = new Map<string, ItemRow[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  const results: Array<{ order: number; status: string }> = [];
  let sent = 0;

  for (const order of orders) {
    const orderItems = itemsByOrder.get(order.id) ?? [];
    const token = createReviewToken(order.id);

    // Ohne Artikel oder Token gibt es nichts zu bewerten — Bestellung trotzdem
    // abhaken, damit sie den Batch nicht bei jedem Lauf blockiert.
    if (orderItems.length === 0 || !token) {
      await query("UPDATE orders SET review_request_sent_at = now() WHERE id = ?", [order.id]);
      results.push({ order: order.order_number, status: token ? "keine Artikel" : "kein Token" });
      continue;
    }

    try {
      await sendReviewRequest({
        to: order.customer_email,
        customerName: order.customer_name ?? "",
        orderNumber: order.order_number,
        items: orderItems,
        token,
        locale: order.locale === "en" ? "en" : "de",
      });
      // Erst nach erfolgreichem Versand markieren — sonst geht die Mail
      // bei einem Resend-Ausfall ersatzlos verloren.
      await query("UPDATE orders SET review_request_sent_at = now() WHERE id = ?", [order.id]);
      sent++;
      results.push({ order: order.order_number, status: "gesendet" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[review-request] Bestellung ${order.order_number}:`, message);
      results.push({ order: order.order_number, status: `Fehler: ${message}` });
    }

    await sleep(600);
  }

  return NextResponse.json({ checked: orders.length, sent, results });
}
