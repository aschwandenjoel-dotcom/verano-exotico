import type { SupabaseClient } from "@supabase/supabase-js";
import { createCjOrder } from "@/lib/cj";
import { resolveVid } from "@/lib/cjMapping";

interface FulfillmentItem {
  product_slug: string;
  product_name: string;
  quantity: number;
  color_name?: string;
  size?: string;
}

interface ShippingAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

// ISO-2 → voller englischer Ländername (CJ verlangt beides).
const REGION_NAMES = new Intl.DisplayNames(["en"], { type: "region" });
function countryNameFor(code: string): string {
  return REGION_NAMES.of(code) ?? code;
}

interface FulfillOrderParams {
  db: SupabaseClient;
  orderId: string; // Supabase orders.id
  orderNumber: number; // orders.order_number
  customerName: string;
  phone: string;
  address: ShippingAddress | null;
  items: FulfillmentItem[];
}

/**
 * Löst automatisch die CJ-Dropshipping-Bestellung aus und schreibt Status/CJ-ID
 * zurück in Supabase. Fehler werden geloggt und in `fulfillment_error` gespeichert,
 * damit sie im Admin sichtbar sind — sie brechen den Webhook NICHT ab.
 */
export async function fulfillOrder({
  db,
  orderId,
  orderNumber,
  customerName,
  phone,
  address,
  items,
}: FulfillOrderParams): Promise<void> {
  try {
    if (!address?.line1 || !address.country) {
      throw new Error("Lieferadresse unvollständig (line1/country fehlt)");
    }

    // Varianten auflösen — jede Position muss auf eine CJ-vid zeigen
    const products = items.map((item) => {
      const vid = resolveVid(item.product_slug, item.color_name, item.size);
      if (!vid) {
        throw new Error(
          `Keine CJ-Variante für "${item.product_slug}" (${item.color_name ?? "-"} / ${item.size ?? "-"}) — in cjMapping.ts ergänzen`
        );
      }
      return { vid, quantity: item.quantity };
    });

    const cjOrder = await createCjOrder({
      orderNumber: `VE-${orderNumber}`, // eindeutig → Schutz vor Doppelbestellung
      shippingCustomerName: customerName || "Kunde",
      shippingCountryCode: address.country,
      shippingCountry: countryNameFor(address.country),
      shippingProvince: address.state ?? "",
      shippingCity: address.city ?? "",
      shippingAddress: [address.line1, address.line2].filter(Boolean).join(", "),
      shippingPhone: phone || "",
      shippingZip: address.postal_code ?? "",
      products,
    });

    await db
      .from("orders")
      .update({
        cj_order_id: cjOrder.orderId,
        cj_order_status: cjOrder.orderStatus,
        status: "ordered",
        fulfillment_error: null,
      })
      .eq("id", orderId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[fulfillment] Bestellung ${orderNumber} fehlgeschlagen:`, message);
    await db
      .from("orders")
      .update({ status: "fulfillment_failed", fulfillment_error: message })
      .eq("id", orderId);
  }
}
