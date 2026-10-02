import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { query, queryOne, execute, parseJson } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { sendOrderConfirmation, sendAdminNewOrderNotification, sendCartRecovery } from "@/lib/email";
import { fulfillOrder, type ShippingAddress } from "@/lib/fulfillment";
import { confirmSubscriber, findByEmail } from "@/lib/newsletter";

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
  created_at: string;
  /** Erst nach hostpoint-migration-newsletter.sql vorhanden */
  marketing_consent?: number | boolean | null;
  recovery_email_sent_at?: string | null;
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
 * checkout.session.async_payment_succeeded,
 * checkout.session.async_payment_failed und checkout.session.expired
 * (für die Erinnerung bei abgebrochener Zahlung). Das Signing-Secret gehört
 * in STRIPE_WEBHOOK_SECRET.
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
        const orderId = await resolveOrderId(session);
        if (orderId) {
          await query("UPDATE orders SET status = 'payment_failed' WHERE id = ? AND status = 'pending'", [orderId]);
        }
        break;
      }
      case "checkout.session.expired": {
        await sendRecoveryIfAllowed(event.data.object as Stripe.Checkout.Session);
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
  const orderId = await resolveOrderId(session);
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

  // Gutscheincode eingelöst: tatsächlich belasteten Betrag übernehmen, damit
  // Bestätigungsmail und Admin den echten Zahlbetrag zeigen.
  const discountCents = session.total_details?.amount_discount ?? 0;
  if (discountCents > 0 && session.amount_total != null && session.amount_subtotal) {
    const before = await queryOne<{ subtotal: number }>("SELECT subtotal FROM orders WHERE id = ?", [orderId]);
    const goods = await queryOne<{ goods: number }>(
      "SELECT sum(price * quantity) AS goods FROM order_items WHERE order_id = ? AND product_slug <> '_shipping'",
      [orderId]
    );
    if (before && goods) {
      // subtotal ist in CHF, Stripe rechnet in der Zahlungswährung — der Rabatt
      // wird deshalb anteilig übertragen. amount_subtotal umfasst nur die
      // Artikel (Versand ist eine Versandoption), also Anteil am Warenwert.
      const chfBefore = Number(before.subtotal);
      const chfDiscount = Math.round(Number(goods.goods) * (discountCents / session.amount_subtotal) * 100) / 100;
      await query("UPDATE orders SET subtotal = ?, payment_amount = ? WHERE id = ?", [
        Math.round((chfBefore - chfDiscount) * 100) / 100,
        session.amount_total / 100,
        orderId,
      ]);
      await query("UPDATE orders SET discount_amount = ? WHERE id = ?", [chfDiscount, orderId]).catch((err) =>
        console.error("[stripe] discount_amount:", err instanceof Error ? err.message : err)
      );
    }
  }

  const order = await queryOne<OrderRow & { discount_amount?: number | null }>("SELECT * FROM orders WHERE id = ?", [orderId]);
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
    discount: order.discount_amount == null ? 0 : Number(order.discount_amount),
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

  // Häkchen im Bestellformular + bezahlt = Newsletter-Anmeldung bestätigt.
  if (order.marketing_consent) {
    try {
      const sub = await findByEmail(order.customer_email);
      if (sub && !sub.unsubscribed_at) await confirmSubscriber(sub);
    } catch (err) {
      console.error("[stripe] Newsletter-Bestätigung:", err instanceof Error ? err.message : err);
    }
  }

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

/**
 * Bestell-ID zu einer Session. Über den Erinnerungslink entsteht eine neue
 * Session als Kopie der abgelaufenen; fehlen dort die Metadaten, führt
 * `recovered_from` zurück zur ursprünglichen Session und damit zur Bestellung.
 */
async function resolveOrderId(session: Stripe.Checkout.Session): Promise<string | null> {
  const direct = session.metadata?.orderId ?? session.client_reference_id;
  if (direct) return direct;

  for (const sessionId of [session.id, session.recovered_from]) {
    if (!sessionId) continue;
    const row = await queryOne<{ id: string }>("SELECT id FROM orders WHERE stripe_session_id = ?", [sessionId]).catch(
      () => null
    );
    if (row) return row.id;
  }
  return null;
}

/** Höchstens eine Erinnerung pro Adresse in diesem Zeitraum — auch bei mehreren Abbrüchen. */
const RECOVERY_COOLDOWN_DAYS = 7;

/**
 * Bezahlseite abgelaufen, ohne dass bezahlt wurde: einmalige Erinnerung mit
 * dem Wiederherstellungslink von Stripe. Gilt rechtlich als Werbung, deshalb
 * nur mit Häkchen aus dem Bestellformular und nie an abgemeldete Adressen.
 */
async function sendRecoveryIfAllowed(session: Stripe.Checkout.Session) {
  const recoveryUrl = session.after_expiration?.recovery?.url;
  const orderId = await resolveOrderId(session);
  if (!recoveryUrl || !orderId) return;

  let order: OrderRow | null;
  try {
    order = await queryOne<OrderRow>("SELECT * FROM orders WHERE id = ?", [orderId]);
  } catch {
    return;
  }
  if (!order || order.status !== "pending" || !order.marketing_consent || order.recovery_email_sent_at) return;

  // Inzwischen doch gekauft (z. B. neuer Anlauf über den Warenkorb)? Dann keine Erinnerung.
  const later = await queryOne<{ id: string }>(
    `SELECT id FROM orders
      WHERE customer_email = ? AND id <> ? AND created_at >= ?
        AND status NOT IN ('pending', 'payment_failed')
      LIMIT 1`,
    [order.customer_email, order.id, order.created_at]
  );
  if (later) return;

  const sub = await findByEmail(order.customer_email);
  if (!sub?.token || sub.unsubscribed_at) return;

  const recent = await queryOne<{ id: string }>(
    `SELECT id FROM orders
      WHERE customer_email = ? AND recovery_email_sent_at > date_sub(now(), interval ${RECOVERY_COOLDOWN_DAYS} day)
      LIMIT 1`,
    [order.customer_email]
  );
  if (recent) return;

  // Sperre: Stripe stellt Events mehrfach zu — nur ein Durchlauf verschickt.
  const claimed = await execute(
    "UPDATE orders SET recovery_email_sent_at = now() WHERE id = ? AND recovery_email_sent_at IS NULL",
    [order.id]
  );
  if (claimed === 0) return;

  const rows = await query<ItemRow>(
    "SELECT product_slug, product_name, price, quantity, size, color_name, image FROM order_items WHERE order_id = ?",
    [order.id]
  );

  try {
    await sendCartRecovery({
      to: order.customer_email,
      customerName: order.customer_name ?? "",
      items: rows.filter((row) => row.product_slug !== "_shipping"),
      recoveryUrl,
      token: sub.token,
      locale: order.locale === "en" ? "en" : "de",
    });
  } catch (err) {
    // Sperre lösen; der Fehler führt zu 500, Stripe stellt erneut zu.
    await query("UPDATE orders SET recovery_email_sent_at = NULL WHERE id = ?", [order.id]);
    throw err;
  }
}
