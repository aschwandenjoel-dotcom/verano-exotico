import { NextResponse } from "next/server";
import Stripe from "stripe";
import type { CartItem } from "@/types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-05-27.dahlia" });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function POST(req: Request) {
  const { items, locale }: { items: CartItem[]; locale: string } = await req.json();

  if (!items?.length) {
    return NextResponse.json({ error: "Warenkorb ist leer" }, { status: 400 });
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: "chf",
      unit_amount: Math.round(item.price * 100), // Stripe erwartet Rappen
      product_data: {
        name: item.name,
        ...(item.image ? { images: [`${BASE_URL}${item.image}`] } : {}),
        metadata: {
          slug: item.productSlug,
          size: item.size ?? "",
          color: item.colorName ?? "",
        },
      },
    },
  }));

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    currency: "chf",
    billing_address_collection: "required",
    shipping_address_collection: {
      allowed_countries: ["CH", "DE", "AT", "LI"],
    },
    success_url: `${BASE_URL}/${locale}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE_URL}/${locale}/collection`,
    metadata: {
      locale,
      items: JSON.stringify(
        items.map((i) => ({
          productSlug: i.productSlug,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          color: i.color,
          colorName: i.colorName,
          size: i.size,
          image: i.image,
        }))
      ),
    },
  });

  return NextResponse.json({ url: session.url });
}
