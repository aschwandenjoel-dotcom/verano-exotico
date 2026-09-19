import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { query, queryOne, parseJson, toJson } from "@/lib/db";
import { calcShipping, isShippingCountry } from "@/lib/shipping";
import { CURRENCIES, convert } from "@/lib/currency";
import { sendOrderConfirmation, sendAdminNewOrderNotification } from "@/lib/email";
import { paymentMode, stripe, toMinorUnits } from "@/lib/stripe";

/** Label des Shop-Checkouts in Stripe (Dashboard → Checkout-Analysen). */
const STRIPE_INTEGRATION_ID = "verano-shop-checkout-kqzmvtwe";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface CheckoutItem {
  productSlug: string;
  quantity: number;
  size?: string;
  colorName?: string;
  color?: string;
  image?: string;
}

interface ProductRow {
  slug: string;
  name_de: string;
  name_en: string;
  price: number;
  sizes: unknown;
  color_names_de: unknown;
  color_names_en: unknown;
}

interface OrderRow {
  id: string;
  order_number: number;
}

/**
 * Checkout in zwei Ausprägungen, gesteuert über PAYMENT_MODE (src/lib/stripe.ts):
 *
 * Schritt 1–3 sind für beide identisch:
 * 1. Preise werden SERVERSEITIG aus der Datenbank gelesen (Client-Preise zählen nicht).
 * 2. Versand wird nach Zielland (Distanz-Zone) und Artikelanzahl berechnet
 *    und auf die Zwischensumme aufgeschlagen.
 * 3. Bestellung wird mit Status "pending" gespeichert; der Versand steht als
 *    eigene Position (_shipping) in den order_items. `subtotal` = Zahlbetrag inkl. Versand.
 *
 * Danach trennen sich die Wege:
 * - `stripe`: Es wird eine Stripe-Checkout-Session erzeugt und deren URL
 *   zurückgegeben. Bestätigungsmail und CJ-Fulfillment lösen NICHT hier aus,
 *   sondern erst im Webhook nach bestätigter Zahlung (/api/stripe/webhook).
 * - `prepay`: Kunde erhält sofort die Zahlungsanweisungen per E-Mail
 *   (IBAN + Referenz VE-Nr); CJ-Fulfillment startet, wenn der Admin die
 *   Zahlung im /admin bestätigt.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });

  // Fail closed: lieber gar keine Bestellung als eine, die still auf Vorkasse
  // zurückfällt, obwohl der Shop auf Kartenzahlung eingestellt ist.
  const mode = paymentMode();
  if (mode === "stripe" && !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "payment_unavailable" }, { status: 503 });
  }

  const locale = body.locale === "en" ? "en" : "de";
  // Die Zahlungswährung wird an der Kasse aktiv gewählt und steht später auf
  // Bestätigungsseite, Rechnung und QR-Code. Ein stiller Rückfall auf CHF würde
  // eine Angabe erfinden, die die Kundin so nie gemacht hat.
  const currency = String(body.currency ?? "").toUpperCase();
  const name = String(body.customer?.name ?? "").trim().slice(0, 120);
  const email = String(body.customer?.email ?? "").trim().toLowerCase();
  const phone = String(body.customer?.phone ?? "").trim().slice(0, 40);
  const address = {
    line1: String(body.address?.line1 ?? "").trim().slice(0, 200),
    line2: String(body.address?.line2 ?? "").trim().slice(0, 200) || null,
    city: String(body.address?.city ?? "").trim().slice(0, 120),
    postal_code: String(body.address?.postal_code ?? "").trim().slice(0, 20),
    country: String(body.address?.country ?? "").trim().toUpperCase(),
  };
  const rawItems: CheckoutItem[] = Array.isArray(body.items) ? body.items : [];

  if (name.length < 2) return NextResponse.json({ error: "name" }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "email" }, { status: 400 });
  if (phone.replace(/\D/g, "").length < 7) return NextResponse.json({ error: "phone" }, { status: 400 });
  if (!address.line1 || !address.city || !address.postal_code) return NextResponse.json({ error: "address" }, { status: 400 });
  if (!isShippingCountry(address.country)) return NextResponse.json({ error: "country" }, { status: 400 });
  if (!CURRENCIES.some((c) => c.code === currency)) {
    return NextResponse.json({ error: "currency", allowed: CURRENCIES.map((c) => c.code) }, { status: 400 });
  }
  if (rawItems.length === 0 || rawItems.length > 50) return NextResponse.json({ error: "items" }, { status: 400 });

  // Serverseitige Preise + Namen aus der DB
  const slugs = [...new Set(rawItems.map((i) => String(i.productSlug)))];
  let products: ProductRow[];
  try {
    products = await query<ProductRow>(
      "SELECT slug, name_de, name_en, price, sizes, color_names_de, color_names_en FROM products WHERE slug IN (?) AND active = true",
      [slugs]
    );
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "DB-Fehler" }, { status: 500 });
  }

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const items = [];
  let goodsTotal = 0;
  let itemCount = 0;
  for (const raw of rawItems) {
    const product = bySlug.get(String(raw.productSlug));
    const quantity = Math.floor(Number(raw.quantity));
    if (!product) return NextResponse.json({ error: `Produkt nicht verfügbar: ${raw.productSlug}` }, { status: 400 });
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 20) return NextResponse.json({ error: "quantity" }, { status: 400 });

    // Grösse gegen die im Shop hinterlegten Grössen prüfen. Ohne gültige Grösse
    // findet das CJ-Fulfillment später keine Variante (src/lib/cjMapping.ts löst
    // über "Farbe|Grösse" auf) — die Bestellung wäre bezahlt, aber nicht lieferbar.
    const sizes = parseJson<string[]>(product.sizes, []);
    const size = raw.size ? String(raw.size).slice(0, 20) : null;
    if (sizes.length > 0 && (!size || !sizes.includes(size))) {
      return NextResponse.json(
        { error: "size", productSlug: product.slug, allowed: sizes },
        { status: 400 }
      );
    }

    // Dasselbe für die Farbe: resolveVid() sucht nach "Farbe|Grösse", ein
    // fehlender oder erfundener Farbname macht die Bestellung unlieferbar.
    // Beide Sprachvarianten sind gültig, weil der Shop de/en ausliefert.
    const colorNames = [
      ...parseJson<string[]>(product.color_names_de, []),
      ...parseJson<string[]>(product.color_names_en, []),
    ];
    const colorName = raw.colorName ? String(raw.colorName).slice(0, 60) : null;
    if (colorNames.length > 0 && (!colorName || !colorNames.includes(colorName))) {
      return NextResponse.json(
        { error: "color", productSlug: product.slug, allowed: [...new Set(colorNames)] },
        { status: 400 }
      );
    }

    const price = Number(product.price);
    goodsTotal += price * quantity;
    itemCount += quantity;
    items.push({
      product_slug: product.slug,
      product_name: locale === "en" ? product.name_en : product.name_de,
      price,
      quantity,
      size,
      color_name: colorName,
      color: raw.color ? String(raw.color).slice(0, 20) : null,
      image: raw.image ? String(raw.image).slice(0, 300) : null,
    });
  }

  goodsTotal = Math.round(goodsTotal * 100) / 100;
  const shippingCost = calcShipping(address.country, itemCount);
  const total = Math.round((goodsTotal + shippingCost) * 100) / 100;

  // Bei Stripe wird jede Position einzeln umgerechnet und gerundet. Der
  // Zahlbetrag ist deshalb die Summe der Positionen und nicht der umgerechnete
  // Gesamtbetrag — sonst wichen Beleg und tatsächliche Belastung um Rappen ab.
  const shippingLabel = locale === "en" ? "Shipping" : "Versand";
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    mode === "stripe"
      ? [
          ...items.map((item) => ({
            quantity: item.quantity,
            price_data: {
              currency: currency.toLowerCase(),
              unit_amount: toMinorUnits(convert(item.price, currency)),
              product_data: {
                name: item.product_name,
                ...(([item.size, item.color_name].filter(Boolean).join(" · ") || null)
                  ? { description: [item.size, item.color_name].filter(Boolean).join(" · ") }
                  : {}),
              },
            },
          })),
          ...(shippingCost > 0
            ? [
                {
                  quantity: 1,
                  price_data: {
                    currency: currency.toLowerCase(),
                    unit_amount: toMinorUnits(convert(shippingCost, currency)),
                    product_data: { name: shippingLabel },
                  },
                },
              ]
            : []),
        ]
      : [];

  const paymentAmount =
    mode === "stripe"
      ? lineItems.reduce((sum, li) => sum + (li.price_data?.unit_amount ?? 0) * (li.quantity ?? 1), 0) / 100
      : Math.round(convert(total, currency) * 100) / 100;

  // Bestellung anlegen — Telefon wandert mit in die Lieferadresse (für CJ nötig)
  const orderId = randomUUID();
  try {
    await query(
      `INSERT INTO orders (id, customer_email, customer_name, shipping_address, subtotal, payment_currency, payment_amount, locale, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [orderId, email, name, toJson({ ...address, phone }), total, currency, paymentAmount, locale]
    );
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Bestellung fehlgeschlagen" }, { status: 500 });
  }

  const order = await queryOne<OrderRow>("SELECT id, order_number FROM orders WHERE id = ?", [orderId]);
  if (!order) {
    return NextResponse.json({ error: "Bestellung fehlgeschlagen" }, { status: 500 });
  }

  try {
    const itemRows = [
      ...items.map((i) => ({ ...i, id: randomUUID(), order_id: order.id })),
      {
        id: randomUUID(),
        order_id: order.id,
        product_slug: "_shipping",
        product_name: locale === "en" ? "Shipping" : "Versand",
        price: shippingCost,
        quantity: 1,
        size: null,
        color_name: null,
        color: null,
        image: null,
      },
    ];
    for (const item of itemRows) {
      await query(
        `INSERT INTO order_items (id, order_id, product_slug, product_name, price, quantity, color, color_name, size, image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.id, item.order_id, item.product_slug, item.product_name, item.price, item.quantity, item.color, item.color_name, item.size, item.image]
      );
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Bestellung fehlgeschlagen" }, { status: 500 });
  }

  // Stripe: Zur gehosteten Bezahlseite weiterleiten. Erst der Webhook macht aus
  // der Bestellung eine bezahlte Bestellung — hier wird bewusst noch keine
  // Bestätigungsmail verschickt und kein CJ-Auftrag ausgelöst.
  if (mode === "stripe") {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe().checkout.sessions.create(
        {
          mode: "payment",
          line_items: lineItems,
          customer_email: email,
          client_reference_id: order.id,
          // Der Webhook findet die Bestellung ausschliesslich hierüber — nicht
          // über eine DB-Spalte, damit er auch ohne Migration funktioniert.
          metadata: { orderId: order.id, orderNumber: String(order.order_number) },
          payment_intent_data: {
            description: `Verano Exotico VE-${order.order_number}`,
            metadata: { orderId: order.id, orderNumber: String(order.order_number) },
            // Lieferadresse mitgeben: verbessert die Betrugserkennung (Radar) und
            // liegt bei einer Rückbuchung als Beleg im Stripe-Dashboard.
            shipping: {
              name,
              phone,
              address: {
                line1: address.line1,
                line2: address.line2 ?? undefined,
                city: address.city,
                postal_code: address.postal_code,
                country: address.country,
              },
            },
          },
          // Kennzeichnet diesen Checkout-Flow im Stripe-Dashboard (Auswertung
          // pro Integration). Fester Wert, der Suffix ist Stripe-Konvention.
          integration_identifier: STRIPE_INTEGRATION_ID,
          locale: locale === "en" ? "en" : "de",
          success_url: `${base}/${locale}/order-confirmation?id=${order.id}`,
          cancel_url: `${base}/${locale}/checkout?canceled=1`,
        },
        // Doppelklick auf "Bestellen" oder ein Netzwerk-Retry darf nicht zwei
        // Sessions für dieselbe Bestellung erzeugen.
        { idempotencyKey: `checkout-session-${order.id}` }
      );
    } catch (err) {
      // Ohne Bezahlseite gibt es keine Bestellung — Status entsprechend setzen,
      // damit im /admin keine stille Karteileiche mit "pending" liegen bleibt.
      const message = err instanceof Error ? err.message : "Stripe-Fehler";
      console.error("[checkout] Stripe-Session fehlgeschlagen:", message);
      await query("UPDATE orders SET status = 'payment_failed', fulfillment_error = ? WHERE id = ?", [
        message,
        order.id,
      ]).catch(console.error);
      return NextResponse.json({ error: "payment_unavailable" }, { status: 502 });
    }

    // Nur für die Nachvollziehbarkeit im Admin — fehlertolerant, damit eine noch
    // nicht eingespielte Migration den Bezahlvorgang nicht blockiert.
    await query("UPDATE orders SET stripe_session_id = ? WHERE id = ?", [session.id, order.id]).catch(
      (err) => console.error("[checkout] stripe_session_id:", err instanceof Error ? err.message : err)
    );

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      goodsTotal,
      shippingCost,
      total,
      url: session.url,
    });
  }

  await sendOrderConfirmation({
    to: email,
    customerName: name,
    orderNumber: order.order_number,
    items,
    goodsTotal,
    shippingCost,
    total,
    currency,
    paymentAmount,
    shippingAddress: address,
    locale,
  }).catch(console.error); // E-Mail-Fehler sollen die Bestellung nicht abbrechen

  sendAdminNewOrderNotification({
    orderNumber: order.order_number,
    customerName: name,
    customerEmail: email,
    items,
    total,
    currency,
    paymentAmount,
    shippingAddress: address,
  }).catch(console.error);

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.order_number,
    goodsTotal,
    shippingCost,
    total,
  });
}
