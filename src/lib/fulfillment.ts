import { query } from "@/lib/db";
import { createCjOrder } from "@/lib/cj";
import { resolveVid } from "@/lib/cjMapping";

interface FulfillmentItem {
  product_slug: string;
  product_name: string;
  quantity: number;
  color_name?: string | null;
  size?: string | null;
}

export interface ShippingAddress {
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
  orderId: string; // orders.id
  orderNumber: number; // orders.order_number
  customerName: string;
  phone: string;
  address: ShippingAddress | null;
  items: FulfillmentItem[];
}

/**
 * Löst automatisch die CJ-Dropshipping-Bestellung aus und schreibt Status/CJ-ID
 * zurück in die Datenbank. Fehler werden geloggt und in `fulfillment_error`
 * gespeichert, damit sie im Admin sichtbar sind — sie brechen den Aufruf NICHT ab.
 */
export async function fulfillOrder({
  orderId,
  orderNumber,
  customerName,
  phone,
  address,
  items,
}: FulfillOrderParams): Promise<void> {
  try {
    // Alle Felder prüfen, die CJ für eine zustellbare Sendung braucht. Früher
    // wurden nur line1/country geprüft und der Rest als leerer String gesendet —
    // CJ nimmt die Bestellung dann an, das Paket ist aber nicht zustellbar.
    const empfaenger = customerName?.trim() ?? "";
    const telefon = phone?.trim() ?? "";
    const strasse = address?.line1?.trim() ?? "";
    const ort = address?.city?.trim() ?? "";
    const plz = address?.postal_code?.trim() ?? "";
    const land = address?.country?.trim() ?? "";

    const fehlend = [
      !strasse && "Strasse",
      !ort && "Ort",
      !plz && "PLZ",
      !land && "Land",
      !empfaenger && "Empfängername",
      !telefon && "Telefonnummer",
    ].filter(Boolean);
    if (fehlend.length) {
      throw new Error(`Lieferadresse unvollständig: ${fehlend.join(", ")} fehlt`);
    }

    // Varianten auflösen — jede Position muss auf eine CJ-vid zeigen
    const products = items.map((item) => {
      const vid = resolveVid(item.product_slug, item.color_name ?? undefined, item.size ?? undefined);
      if (!vid) {
        throw new Error(
          `Keine CJ-Variante für "${item.product_slug}" (${item.color_name ?? "-"} / ${item.size ?? "-"}) — in cjMapping.ts ergänzen`
        );
      }
      return { vid, quantity: item.quantity };
    });

    const cjOrder = await createCjOrder({
      orderNumber: `VE-${orderNumber}`, // eindeutig → Schutz vor Doppelbestellung
      shippingCustomerName: empfaenger,
      shippingCountryCode: land,
      shippingCountry: countryNameFor(land),
      shippingProvince: address?.state ?? "", // von CJ für CH/DE/AT nicht verlangt
      shippingCity: ort,
      shippingAddress: [strasse, address?.line2].filter(Boolean).join(", "),
      shippingPhone: telefon,
      shippingZip: plz,
      products,
    });

    await query(
      "UPDATE orders SET cj_order_id = ?, cj_order_status = ?, status = ?, fulfillment_error = NULL WHERE id = ?",
      [cjOrder.orderId, cjOrder.orderStatus, "ordered", orderId]
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[fulfillment] Bestellung ${orderNumber} fehlgeschlagen:`, message);
    await query(
      "UPDATE orders SET status = ?, fulfillment_error = ? WHERE id = ?",
      ["fulfillment_failed", message, orderId]
    );
  }
}
