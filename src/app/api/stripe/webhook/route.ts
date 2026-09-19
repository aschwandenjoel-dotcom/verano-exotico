import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { query, queryOne, execute, parseJson } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { sendOrderConfirmation, sendAdminNewOrderNotification } from "@/lib/email";
import { fulfillOrder, type ShippingAddress } from "@/lib/fulfillment";

interface OrderRow {
  id: string;
  order_number: number;
  status: string;
  customer_email: string;
  customer_name: string | null;
  subtotal: number;
  payment_currency: string | null;
  payment_amount: number | null;
  locale: string | null;
  shipping_address: (ShippingAddress & { phone?: string }) | string | null;
}

interface ItemRow {
  product_slug: string;
  product_name: string;
  price: number;
  quantity: number;
  size: string | null;
  color_name: string | null;
  image: string | null;
}

/**
 * Stripe-Webhook — die einzige Stelle, an der eine Bestellung als bezahlt gilt.
 * Die Rückkehr der Kundin auf die Erfolgsseite ist KEIN Zahlungsnachweis
 * (die URL lässt sich aufrufen, ohne bezahlt zu haben).
 *
 * Einrichtung: Stripe-Dashboard → Developers → Webhooks → Endpoint
 *   https://<domain>/api/stripe/webhook
 * mit den Events checkout.session.completed,
 * checkout.session.async_payment_succeeded und
 * checkout.session.async_payment_failed. Das Signing-Secret gehört in
 * STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Signatur fehlt" }, { status: 400 });
  }

  // Rohtext, nicht req.json() — die Signatur wird über den unveränderten Body gebildet.
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(payload, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe] Signaturprüfung fehlgeschlagen:", message);
    return NextResponse.json({ error: "Ungültige Signatur" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        // "completed" kommt auch bei verzögerten Zahlarten, bevor das Geld da
        // ist — dann wartet der Auftrag auf async_payment_succeeded.
        if (session.payment_status === "paid") {
          await markPaid(session);
        }
        break;
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId ?? session.client_reference_id;
        if (orderId) {
          await query("UPDATE orders SET status = 'payment_failed' WHERE id = ? AND status = 'pending'", [orderId]);
        }
        break;
      }
      default:
        break; // andere Events bewusst ignorieren
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[stripe] Verarbeitung von ${event.type} fehlgeschlagen:`, message);
    // 500 → Stripe stellt erneut zu. Besser ein Wiederholungsversuch als eine
    // bezahlte Bestellung, die nie bearbeitet wird.
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Bezahlte Bestellung abschliessen: Status setzen, Bestätigungs- und Adminmail
 * verschicken, CJ-Auftrag auslösen. Idempotent — Stripe stellt Events
 * mehrfach zu, und ein zweiter Durchlauf dürfte weder doppelt bestellen noch
 * doppelt mailen.
 */
async function markPaid(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (!orderId) {
    console.error("[stripe] Session ohne orderId:", session.id);
    return;
  }

  // Der Statuswechsel ist die Sperre: Nur der Durchlauf, der die Bestellung
  // tatsächlich von "pending" auf "paid" dreht, verschickt Mails und bestellt.
  const changed = await execute(
    "UPDATE orders SET status = 'paid' WHERE id = ? AND status = 'pending'",
    [orderId]
  );
  if (changed === 0) {
    console.log(`[stripe] Bestellung ${orderId} war bereits verarbeitet — übersprungen`);
    return;
  }

  const paymentIntent =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  if (paymentIntent) {
    await query("UPDATE orders SET stripe_payment_intent = ? WHERE id = ?", [paymentIntent, orderId]).catch(
      (err) => console.error("[stripe] stripe_payment_intent:", err instanceof Error ? err.message : err)
    );
  }

  const order = await queryOne<OrderRow>("SELECT * FROM orders WHERE id = ?", [orderId]);
  if (!order) {
    console.error("[stripe] Bestellung nicht gefunden:", orderId);
    return;
  }

  const rows = await query<ItemRow>(
    "SELECT product_slug, product_name, price, quantity, size, color_name, image FROM order_items WHERE order_id = ?",
    [orderId]
  );
  const items = rows.filter((row) => row.product_slug !== "_shipping");
  const shippingCost = Number(rows.find((row) => row.product_slug === "_shipping")?.price ?? 0);
  const goodsTotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const address = parseJson<(ShippingAddress & { phone?: string }) | null>(order.shipping_address, null);
  const locale = order.locale === "en" ? "en" : "de";
  const total = Number(order.subtotal);

  await sendOrderConfirmation({
    to: order.customer_email,
    customerName: order.customer_name ?? "",
    orderNumber: order.order_number,
    items,
    goodsTotal: Math.round(goodsTotal * 100) / 100,
    shippingCost,
    total,
    currency: order.payment_currency ?? "CHF",
    paymentAmount: order.payment_amount == null ? undefined : Number(order.payment_amount),
    shippingAddress: address,
    locale,
    paid: true,
  }).catch(console.error);

  sendAdminNewOrderNotification({
    orderNumber: order.order_number,
    customerName: order.customer_name ?? "",
    customerEmail: order.customer_email,
    items,
    total,
    currency: order.payment_currency ?? "CHF",
    paymentAmount: order.payment_amount == null ? undefined : Number(order.payment_amount),
    shippingAddress: address,
    paid: true,
  }).catch(console.error);

  // Wie im Admin-Flow: Fehler landen in fulfillment_error, nicht im Webhook-Status.
  await fulfillOrder({
    orderId: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name ?? "",
    phone: address?.phone ?? "",
    address,
    items,
  });
}
