import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/adminAuth";
import { fulfillOrder } from "@/lib/fulfillment";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const { id } = await params;
  const db = createServiceClient();

  const { data, error } = await db
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const { id } = await params;
  const { status } = await req.json();
  const db = createServiceClient();

  // Sonderfall: Jemand klickt erneut "Bezahlt" auf eine Bestellung, die bereits
  // bei CJ ausgelöst wurde (cj_order_id existiert). Dann NICHT den Status auf
  // "paid" zurückfallen lassen — sonst denkt der Tracking-Sync, die Bestellung
  // sei noch nicht bei CJ bestellt, obwohl sie es längst ist.
  const { data: existing } = await db.from("orders").select("cj_order_id, status").eq("id", id).single();
  const alreadyFulfilled = status === "paid" && !!existing?.cj_order_id;
  const effectiveStatus = alreadyFulfilled ? existing!.status : status;

  const { data, error } = await db
    .from("orders")
    .update({ status: effectiveStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, order_items(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Vorkasse-Flow: Sobald der Admin die Zahlung bestätigt ("paid"),
  // wird die CJ-Dropshipping-Bestellung ausgelöst — genau einmal.
  if (status === "paid" && data && !alreadyFulfilled && !data.cj_order_id) {
    const items = (data.order_items ?? []).filter(
      (i: { product_slug: string }) => i.product_slug !== "_shipping"
    );
    const address = data.shipping_address ?? null;
    await fulfillOrder({
      db,
      orderId: data.id,
      orderNumber: data.order_number,
      customerName: data.customer_name ?? "",
      phone: address?.phone ?? "",
      address,
      items,
    }).catch(console.error);

    // Frischen Stand zurückgeben (Status ist jetzt "ordered" oder "fulfillment_failed")
    const { data: fresh } = await db
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", id)
      .single();
    return NextResponse.json(fresh ?? data);
  }

  return NextResponse.json(data);
}
