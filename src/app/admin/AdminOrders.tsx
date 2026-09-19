"use client";

import { useState } from "react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:            { label: "Wartet auf Zahlung", color: "#E8A830" },
  payment_failed:     { label: "Zahlung fehlgeschlagen", color: "#C0392B" },
  paid:               { label: "Bezahlt",        color: "#2E7D5E" },
  ordered:            { label: "Bei CJ bestellt", color: "#7B61FF" },
  fulfillment_failed: { label: "CJ-Fehler",      color: "#C0392B" },
  shipped:            { label: "Versendet",       color: "#00B4C5" },
  delivered:          { label: "Geliefert",       color: "#6B7A8D" },
  cancelled:          { label: "Storniert",       color: "#C0392B" },
};

// Nur diese Status kann der Admin manuell setzen (ordered/fulfillment_failed setzt das System)
const MANUAL_STATUSES = ["paid", "shipped", "delivered", "cancelled"] as const;

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  size?: string | null;
  color_name?: string | null;
}

interface Order {
  id: string;
  order_number: number;
  status: string;
  customer_email: string;
  customer_name?: string;
  subtotal: number;
  payment_currency?: string | null;
  payment_amount?: number | null;
  created_at: string;
  order_items: OrderItem[];
  cj_order_id?: string;
  cj_order_status?: string;
  tracking_number?: string;
  tracking_provider?: string;
  fulfillment_error?: string;
}

interface Product {
  id: string;
  slug: string;
  name_de: string;
  price: number;
  active: boolean;
}

export default function AdminOrders({ orders, products }: { orders: Order[]; products: Product[] }) {
  const [tab, setTab] = useState<"orders" | "products">("orders");
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  async function syncTracking() {
    setSyncing(true);
    try {
      const res = await fetch("/api/fulfillment/sync");
      const data = await res.json();
      alert(`Sync abgeschlossen — ${data.checked ?? 0} Bestellung(en) geprüft.`);
      window.location.reload();
    } catch {
      alert("Sync fehlgeschlagen.");
    } finally {
      setSyncing(false);
    }
  }

  async function updateStatus(orderId: string, status: string) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    // Server kann weiterschalten (paid → ordered via CJ-Fulfillment) — Antwort übernehmen
    const updated = await res.json().catch(() => null);
    setLocalOrders((prev) =>
      prev.map((o) => (o.id === orderId ? (updated?.id ? { ...o, ...updated } : { ...o, status }) : o))
    );
  }

  async function toggleProduct(productId: string, active: boolean) {
    await fetch(`/api/products/${productId}/toggle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    window.location.reload();
  }

  const totalRevenue = localOrders.filter((o) => o.status === "paid" || o.status === "shipped" || o.status === "delivered").reduce((s, o) => s + Number(o.subtotal), 0);

  return (
    <div style={{ minHeight: "100vh", background: "#F8F3E8" }}>
      {/* Header */}
      <div style={{ background: "#1A3040", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ color: "#D4AF37", fontFamily: "sans-serif", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 4px" }}>Verano Exotico</p>
          <h1 style={{ color: "#F8F3E8", fontFamily: "sans-serif", fontWeight: 900, fontSize: "18px", textTransform: "uppercase", margin: 0 }}>Admin</h1>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <button onClick={syncTracking} disabled={syncing} style={{ background: "#D4AF37", color: "#1A3040", border: "none", borderRadius: "9999px", padding: "8px 16px", fontFamily: "sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: syncing ? "wait" : "pointer", opacity: syncing ? 0.6 : 1 }}>
            {syncing ? "Synchronisiere…" : "⟳ Tracking sync"}
          </button>
          <a href="/admin" style={{ color: "rgba(248,243,232,0.4)", fontFamily: "sans-serif", fontSize: "11px", textDecoration: "none" }}>↺ Aktualisieren</a>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", padding: "24px 32px 0" }}>
        {[
          { label: "Bestellungen", value: localOrders.length, color: "#1A3040" },
          { label: "Umsatz", value: `CHF ${totalRevenue.toFixed(2)}`, color: "#1A3040" },
          { label: "Bei CJ / versandt", value: localOrders.filter((o) => ["ordered","shipped","delivered"].includes(o.status)).length, color: "#7B61FF" },
          { label: "CJ-Fehler", value: localOrders.filter((o) => o.status === "fulfillment_failed").length, color: "#C0392B" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#FFFFFF", borderRadius: "12px", padding: "20px 24px" }}>
            <p style={{ fontFamily: "sans-serif", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(26,48,64,0.4)", margin: "0 0 6px" }}>{label}</p>
            <p style={{ fontFamily: "sans-serif", fontWeight: 900, fontSize: "22px", color, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", padding: "24px 32px 0" }}>
        {(["orders", "products"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: "9999px", border: "none", background: tab === t ? "#1A3040" : "transparent", color: tab === t ? "#F8F3E8" : "rgba(26,48,64,0.5)", fontFamily: "sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
            {t === "orders" ? "Bestellungen" : "Produkte"}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px 32px 48px" }}>
        {tab === "orders" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {localOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: "rgba(26,48,64,0.35)", fontFamily: "sans-serif", fontSize: "13px" }}>Noch keine Bestellungen</div>
            ) : localOrders.map((order) => {
              const s = STATUS_LABELS[order.status] ?? { label: order.status, color: "#9E9E9E" };
              return (
                <div key={order.id} style={{ background: "#FFFFFF", borderRadius: "12px", overflow: "hidden" }}>
                  <div
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px", cursor: "pointer" }}
                  >
                    <span style={{ fontFamily: "sans-serif", fontSize: "12px", fontWeight: 700, color: "#1A3040", minWidth: "60px" }}>#{order.order_number}</span>
                    <span style={{ fontFamily: "sans-serif", fontSize: "12px", color: "rgba(26,48,64,0.6)", flex: 1 }}>{order.customer_email}</span>
                    <span style={{ fontFamily: "sans-serif", fontSize: "13px", fontWeight: 700, color: "#1A3040" }}>
                      CHF {Number(order.subtotal).toFixed(2)}
                      {order.payment_currency && order.payment_currency !== "CHF" && order.payment_amount && (
                        <span style={{ fontWeight: 400, color: "rgba(26,48,64,0.5)" }}> · Kunde zahlt {order.payment_currency} {Number(order.payment_amount).toFixed(2)}</span>
                      )}
                    </span>
                    <span style={{ background: s.color + "22", color: s.color, fontFamily: "sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px", borderRadius: "9999px" }}>{s.label}</span>
                    <span style={{ color: "rgba(26,48,64,0.3)", fontSize: "12px" }}>{expandedId === order.id ? "▲" : "▼"}</span>
                  </div>

                  {expandedId === order.id && (
                    <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(26,48,64,0.06)" }}>
                      <div style={{ paddingTop: "16px", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                        {order.order_items?.map((item, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontFamily: "sans-serif", fontSize: "13px", color: "#1A3040" }}>
                            <span>{item.quantity}× {item.product_name} {item.size ? `(${item.size})` : ""}{item.color_name ? ` · ${item.color_name}` : ""}</span>
                            <span>CHF {(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* CJ-Dropshipping-Infos */}
                      {(order.cj_order_id || order.tracking_number || order.fulfillment_error) && (
                        <div style={{ background: "#F8F3E8", borderRadius: "10px", padding: "14px 16px", marginBottom: "16px", fontFamily: "sans-serif", fontSize: "12px", color: "#1A3040", display: "flex", flexDirection: "column", gap: "6px" }}>
                          {order.cj_order_id && (
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "rgba(26,48,64,0.5)" }}>CJ-Bestellung</span>
                              <span style={{ fontFamily: "monospace" }}>{order.cj_order_id}{order.cj_order_status ? ` · ${order.cj_order_status}` : ""}</span>
                            </div>
                          )}
                          {order.tracking_number && (
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "rgba(26,48,64,0.5)" }}>Tracking{order.tracking_provider ? ` · ${order.tracking_provider}` : ""}</span>
                              <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{order.tracking_number}</span>
                            </div>
                          )}
                          {order.fulfillment_error && (
                            <div style={{ color: "#C0392B", fontWeight: 600 }}>⚠ {order.fulfillment_error}</div>
                          )}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {MANUAL_STATUSES.map((key) => {
                          const val = STATUS_LABELS[key];
                          return (
                            <button key={key} onClick={() => updateStatus(order.id, key)}
                              style={{ padding: "6px 14px", borderRadius: "9999px", border: `1px solid ${order.status === key ? val.color : "rgba(26,48,64,0.15)"}`, background: order.status === key ? val.color : "transparent", color: order.status === key ? "#FFF" : "rgba(26,48,64,0.5)", fontFamily: "sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                              {val.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "products" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {products.map((p) => (
              <div key={p.id} style={{ background: "#FFFFFF", borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ flex: 1, fontFamily: "sans-serif", fontSize: "13px", fontWeight: 700, color: "#1A3040" }}>{p.name_de}</span>
                <span style={{ fontFamily: "sans-serif", fontSize: "13px", color: "rgba(26,48,64,0.5)" }}>CHF {Number(p.price).toFixed(2)}</span>
                <button onClick={() => toggleProduct(p.id, !p.active)}
                  style={{ padding: "6px 16px", borderRadius: "9999px", border: "none", background: p.active ? "#2E7D5E" : "rgba(26,48,64,0.1)", color: p.active ? "#FFF" : "rgba(26,48,64,0.4)", fontFamily: "sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                  {p.active ? "Aktiv" : "Inaktiv"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
