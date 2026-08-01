import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { query, queryOne, attachOrderItems } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";

interface OrderRow {
  id: string;
  order_number: number;
}

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const orders = await query("SELECT * FROM orders ORDER BY created_at DESC");
  return NextResponse.json(await attachOrderItems(orders as { id: string }[]));
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const body = await req.json();
  const { customerEmail, customerName, items, subtotal } = body;

  if (!customerEmail || !items?.length) {
    return NextResponse.json({ error: "Fehlende Pflichtfelder" }, { status: 400 });
  }

  const orderId = randomUUID();
  try {
    await query(
      "INSERT INTO orders (id, customer_email, customer_name, subtotal, status) VALUES (?, ?, ?, ?, 'pending')",
      [orderId, customerEmail, customerName, subtotal]
    );
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Fehler" }, { status: 500 });
  }

  const order = await queryOne<OrderRow>("SELECT id, order_number FROM orders WHERE id = ?", [orderId]);
  if (!order) return NextResponse.json({ error: "Fehler" }, { status: 500 });

  try {
    for (const item of items as Array<{ productSlug: string; name: string; price: number; quantity: number; color?: string; colorName?: string; size?: string; image?: string }>) {
      await query(
        `INSERT INTO order_items (id, order_id, product_slug, product_name, price, quantity, color, color_name, size, image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), order.id, item.productSlug, item.name, item.price, item.quantity, item.color ?? null, item.colorName ?? null, item.size ?? null, item.image ?? null]
      );
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Fehler" }, { status: 500 });
  }

  return NextResponse.json({ orderId: order.id, orderNumber: order.order_number });
}
