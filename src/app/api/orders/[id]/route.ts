import { NextResponse } from "next/server";
import { query, queryOne, attachOrderItems, parseJson } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";
import { fulfillOrder, type ShippingAddress } from "@/lib/fulfillment";

interface OrderRow {
  id: string;
  order_number: number;
  customer_name: string | null;
  cj_order_id: string | null;
  status: string;
  // Kommt bei MariaDB als JSON-String an, bei MySQL bereits geparst — vor der
  // Verwendung immer durch parseJson() schicken.
  shipping_address: (ShippingAddress & { phone?: string }) | string | null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }
  const { id } = await params;
  const order = await queryOne("SELECT * FROM orders WHERE id = ?", [id]);
  if (!order) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  const [withItems] = await attachOrderItems([order as { id: string }]);
  return NextResponse.json(withItems);
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

  // Sonderfall: Jemand klickt erneut "Bezahlt" auf eine Bestellung, die bereits
  // bei CJ ausgelöst wurde (cj_order_id existiert). Dann NICHT den Status auf
  // "paid" zurückfallen lassen — sonst denkt der Tracking-Sync, die Bestellung
  // sei noch nicht bei CJ bestellt, obwohl sie es längst ist.
  const existing = await queryOne<{ cj_order_id: string | null; status: string }>(
    "SELECT cj_order_id, status FROM orders WHERE id = ?",
    [id]
  );
  const alreadyFulfilled = status === "paid" && !!existing?.cj_order_id;
  const effectiveStatus = alreadyFulfilled ? existing!.status : status;

  try {
    await query("UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?", [effectiveStatus, id]);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Fehler" }, { status: 500 });
  }

  // Wird der Versand von Hand gesetzt (statt über den CJ-Tracking-Sync), fehlt
  // sonst der Startpunkt für die Bewertungsanfrage. Fehlertolerant, damit eine
  // noch nicht eingespielte Migration die Statusänderung nicht blockiert.
  if (effectiveStatus === "shipped" || effectiveStatus === "delivered") {
    await query(
      "UPDATE orders SET shipped_at = NOW() WHERE id = ? AND shipped_at IS NULL",
      [id]
    ).catch((err) => console.error("[orders] shipped_at:", err instanceof Error ? err.message : err));
  }

  const order = await queryOne<OrderRow>("SELECT * FROM orders WHERE id = ?", [id]);
  if (!order) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  const [data] = await attachOrderItems([order]);

  // Vorkasse-Flow: Sobald der Admin die Zahlung bestätigt ("paid"),
  // wird die CJ-Dropshipping-Bestellung ausgelöst — genau einmal.
  if (status === "paid" && data && !alreadyFulfilled && !data.cj_order_id) {
    const items = (data.order_items ?? []).filter((i) => i.product_slug !== "_shipping");
    const address = parseJson<(ShippingAddress & { phone?: string }) | null>(
      data.shipping_address,
      null
    );
    await fulfillOrder({
      orderId: data.id,
      orderNumber: data.order_number,
      customerName: data.customer_name ?? "",
      phone: address?.phone ?? "",
      address,
      items,
    }).catch(console.error);

    // Frischen Stand zurückgeben (Status ist jetzt "ordered" oder "fulfillment_failed")
    const fresh = await queryOne<OrderRow>("SELECT * FROM orders WHERE id = ?", [id]);
    const [freshWithItems] = fresh ? await attachOrderItems([fresh]) : [data];
    return NextResponse.json(freshWithItems ?? data);
  }

  return NextResponse.json(data);
}
