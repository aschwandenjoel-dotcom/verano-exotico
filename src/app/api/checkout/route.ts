import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { calcShipping, isShippingCountry } from "@/lib/shipping";
import { CURRENCIES, DEFAULT_CURRENCY, convert } from "@/lib/currency";
import { sendOrderConfirmation } from "@/lib/email";

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
}

interface OrderRow {
  id: string;
  order_number: number;
}

/**
 * Vorkasse-Checkout (Banküberweisung, keine Zahlungsgebühren):
 * 1. Preise werden SERVERSEITIG aus der Datenbank gelesen (Client-Preise zählen nicht).
 * 2. Versand wird nach Zielland (Distanz-Zone) und Artikelanzahl berechnet
 *    und auf die Zwischensumme aufgeschlagen.
 * 3. Bestellung wird mit Status "pending" gespeichert; der Versand steht als
 *    eigene Position (_shipping) in den order_items. `subtotal` = Zahlbetrag inkl. Versand.
 * 4. Kunde erhält per E-Mail die Zahlungsanweisungen (IBAN + Referenz VE-Nr).
 *    CJ-Fulfillment startet erst, wenn der Admin die Zahlung bestätigt.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });

  const locale = body.locale === "en" ? "en" : "de";
  const currencyInput = String(body.currency ?? DEFAULT_CURRENCY).toUpperCase();
  const currency = CURRENCIES.some((c) => c.code === currencyInput) ? currencyInput : DEFAULT_CURRENCY;
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
  if (rawItems.length === 0 || rawItems.length > 50) return NextResponse.json({ error: "items" }, { status: 400 });

  // Serverseitige Preise + Namen aus der DB
  const slugs = [...new Set(rawItems.map((i) => String(i.productSlug)))];
  let products: ProductRow[];
  try {
    products = await query<ProductRow>(
      "SELECT slug, name_de, name_en, price FROM products WHERE slug IN (?) AND active = true",
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
    const price = Number(product.price);
    goodsTotal += price * quantity;
    itemCount += quantity;
    items.push({
      product_slug: product.slug,
      product_name: locale === "en" ? product.name_en : product.name_de,
      price,
      quantity,
      size: raw.size ? String(raw.size).slice(0, 20) : null,
      color_name: raw.colorName ? String(raw.colorName).slice(0, 60) : null,
      color: raw.color ? String(raw.color).slice(0, 20) : null,
      image: raw.image ? String(raw.image).slice(0, 300) : null,
    });
  }

  goodsTotal = Math.round(goodsTotal * 100) / 100;
  const shippingCost = calcShipping(address.country, itemCount);
  const total = Math.round((goodsTotal + shippingCost) * 100) / 100;
  const paymentAmount = Math.round(convert(total, currency) * 100) / 100;

  // Bestellung anlegen — Telefon wandert mit in die Lieferadresse (für CJ nötig)
  const orderId = randomUUID();
  try {
    await query(
      `INSERT INTO orders (id, customer_email, customer_name, shipping_address, subtotal, payment_currency, payment_amount, locale, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [orderId, email, name, { ...address, phone }, total, currency, paymentAmount, locale]
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

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.order_number,
    goodsTotal,
    shippingCost,
    total,
  });
}
