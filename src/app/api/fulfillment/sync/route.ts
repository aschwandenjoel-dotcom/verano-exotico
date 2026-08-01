import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCjOrderDetail } from "@/lib/cj";
import { sendShippingNotification } from "@/lib/email";
import { isAdminRequest } from "@/lib/adminAuth";

interface OrderRow {
  id: string;
  order_number: number;
  customer_email: string;
  customer_name: string | null;
  cj_order_id: string;
  locale: string | null;
}

/**
 * Fragt bei CJ den Status offener Bestellungen ab. Sobald CJ eine Tracking-Nummer
 * hat, wird die Bestellung auf "shipped" gesetzt und der Kunde per E-Mail informiert.
 *
 * Aufruf per Cron-Job (z.B. alle 30 Min), geschützt über CRON_SECRET:
 *   GET /api/fulfillment/sync   Header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
  // Erlaubt: Cron per Bearer-Secret ODER eingeloggter Admin (Cookie/x-admin-key).
  // Ohne gesetztes CRON_SECRET ist der Cron-Weg gesperrt (fail closed).
  const secret = process.env.CRON_SECRET;
  const cronOk = !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
  if (!cronOk && !isAdminRequest(req)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  // Bestellungen, die bei CJ liegen, aber noch keine Tracking-Nummer haben
  let orders: OrderRow[];
  try {
    orders = await query<OrderRow>(
      `SELECT id, order_number, customer_email, customer_name, cj_order_id, locale
       FROM orders
       WHERE cj_order_id IS NOT NULL AND tracking_number IS NULL AND status IN ('ordered')`
    );
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Fehler" }, { status: 500 });
  }

  const results: Array<{ order: number; status: string }> = [];

  for (const order of orders) {
    try {
      const detail = await getCjOrderDetail(order.cj_order_id);

      const setClauses = ["cj_order_status = ?"];
      const setValues: unknown[] = [detail.orderStatus];

      if (detail.trackNumber) {
        setClauses.push("tracking_number = ?", "tracking_provider = ?", "status = ?");
        setValues.push(detail.trackNumber, detail.trackingProvider ?? null, "shipped");
      } else if (detail.orderStatus === "CANCELLED") {
        setClauses.push("status = ?");
        setValues.push("cancelled");
      }

      await query(`UPDATE orders SET ${setClauses.join(", ")} WHERE id = ?`, [...setValues, order.id]);

      // Versand-Mail nur beim ersten Mal (wenn Tracking neu gesetzt wurde)
      if (detail.trackNumber && order.customer_email) {
        await sendShippingNotification({
          to: order.customer_email,
          customerName: order.customer_name ?? "",
          orderNumber: order.order_number,
          trackingNumber: detail.trackNumber,
          trackingProvider: detail.trackingProvider,
          locale: order.locale === "en" ? "en" : "de",
        }).catch(console.error);
      }

      results.push({ order: order.order_number, status: detail.orderStatus });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[sync] Bestellung ${order.order_number}:`, message);
      results.push({ order: order.order_number, status: `error: ${message}` });
    }
  }

  return NextResponse.json({ checked: results.length, results });
}
