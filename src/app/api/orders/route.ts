import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/adminAuth";

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const db = createServiceClient();
  const { data, error } = await db
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
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

  const db = createServiceClient();

  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({ customer_email: customerEmail, customer_name: customerName, subtotal, status: "pending" })
    .select()
    .single();

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });

  const { error: itemsError } = await db.from("order_items").insert(
    items.map((item: { productSlug: string; name: string; price: number; quantity: number; color?: string; colorName?: string; size?: string; image?: string }) => ({
      order_id: order.id,
      product_slug: item.productSlug,
      product_name: item.name,
      price: item.price,
      quantity: item.quantity,
      color: item.color,
      color_name: item.colorName,
      size: item.size,
      image: item.image,
    }))
  );

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

  return NextResponse.json({ orderId: order.id, orderNumber: order.order_number });
}
