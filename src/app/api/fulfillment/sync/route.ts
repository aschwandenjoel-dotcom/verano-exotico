import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getCjOrderDetail } from "@/lib/cj";
import { sendShippingNotification } from "@/lib/email";
import { isAdminRequest } from "@/lib/adminAuth";

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

  const db = createServiceClient();

  // Bestellungen, die bei CJ liegen, aber noch keine Tracking-Nummer haben
  let { data: orders, error } = await db
    .from("orders")
    .select("id, order_number, customer_email, customer_name, cj_order_id, locale")
    .not("cj_order_id", "is", null)
    .is("tracking_number", null)
    .in("status", ["ordered"]);

  if (error?.message?.includes("locale")) {
    // Spalte locale evtl. noch nicht angelegt (SQL-Migration ausstehend) — Fallback ohne sie
    const fallback = await db
      .from("orders")
      .select("id, order_number, customer_email, customer_name, cj_order_id")
      .not("cj_order_id", "is", null)
      .is("tracking_number", null)
      .in("status", ["ordered"]);
    orders = fallback.data?.map((o) => ({ ...o, locale: null })) ?? null;
    error = fallback.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: Array<{ order: number; status: string }> = [];

  for (const order of orders ?? []) {
    try {
      const detail = await getCjOrderDetail(order.cj_order_id);

      const update: Record<string, unknown> = { cj_order_status: detail.orderStatus };

      if (detail.trackNumber) {
        update.tracking_number = detail.trackNumber;
        update.tracking_provider = detail.trackingProvider ?? null;
        update.status = "shipped";
      } else if (detail.orderStatus === "CANCELLED") {
        update.status = "cancelled";
      }

      await db.from("orders").update(update).eq("id", order.id);

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
