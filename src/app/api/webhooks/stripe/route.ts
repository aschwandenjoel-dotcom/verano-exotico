import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase";
import { sendOrderConfirmation } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-05-27.dahlia" });

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  // Webhook Secret noch nicht gesetzt → Signatur überspringen (nur Entwicklung)
  let event: Stripe.Event;
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    try {
      event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET);
    } catch {
      return NextResponse.json({ error: "Webhook-Signatur ungültig" }, { status: 400 });
    }
  } else {
    event = JSON.parse(body) as Stripe.Event;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const db = createServiceClient();

    const items = JSON.parse(session.metadata?.items ?? "[]");
    const subtotal = (session.amount_total ?? 0) / 100;
    const customerEmail = session.customer_details?.email ?? "";
    const customerName = session.customer_details?.name ?? "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shippingAddress = (session as any).shipping_details?.address ?? null;

    // Bestellung in Supabase speichern
    const { data: order, error } = await db
      .from("orders")
      .insert({
        customer_email: customerEmail,
        customer_name: customerName,
        shipping_address: shippingAddress,
        subtotal,
        status: "paid",
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
      })
      .select()
      .single();

    if (!error && order) {
      const insertedItems = items.map((item: { productSlug: string; name: string; price: number; quantity: number; color?: string; colorName?: string; size?: string; image?: string }) => ({
        order_id: order.id,
        product_slug: item.productSlug,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
        color: item.color,
        color_name: item.colorName,
        size: item.size,
        image: item.image,
      }));
      await db.from("order_items").insert(insertedItems);

      // Bestätigungs-E-Mail senden
      if (customerEmail) {
        await sendOrderConfirmation({
          to: customerEmail,
          customerName,
          orderNumber: order.order_number,
          items: insertedItems.map((i: { product_name: string; quantity: number; price: number; size?: string; color_name?: string }) => ({
            product_name: i.product_name,
            quantity: i.quantity,
            price: i.price,
            size: i.size,
            color_name: i.color_name,
          })),
          subtotal,
        }).catch(console.error); // E-Mail-Fehler sollen Webhook nicht blockieren
      }
    }
  }

  return NextResponse.json({ received: true });
}

