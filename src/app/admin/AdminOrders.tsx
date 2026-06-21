"use client";

import { useState } from "react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: "Ausstehend", color: "#E8A830" },
  paid:      { label: "Bezahlt",    color: "#2E7D5E" },
  shipped:   { label: "Versendet", color: "#00B4C5" },
  delivered: { label: "Geliefert", color: "#6B7A8D" },
  cancelled: { label: "Storniert", color: "#C0392B" },
};

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  size?: string;
  color_name?: string;
}

interface Order {
  id: string;
  order_number: number;
  status: string;
  customer_email: string;
  customer_name?: string;
  subtotal: number;
  created_at: string;
  order_items: OrderItem[];
}

interface Product {
  id: string;
  slug: string;
  name_de: string;
  price: number;
  active: boolean;
}

export default function AdminOrders({ orders, products, pw }: { orders: Order[]; products: Product[]; pw: string }) {
  const [tab, setTab] = useState<"orders" | "products">("orders");
  const [localOrders, setLocalOrders] = useState<Order[]>(orders);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function updateStatus(orderId: string, status: string) {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLocalOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
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
        <a href={`/admin?pw=${pw}`} style={{ color: "rgba(248,243,232,0.4)", fontFamily: "sans-serif", fontSize: "11px", textDecoration: "none" }}>↺ Aktualisieren</a>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", padding: "24px 32px 0" }}>
        {[
          { label: "Bestellungen", value: localOrders.length },
          { label: "Bezahlt", value: localOrders.filter((o) => ["paid","shipped","delivered"].includes(o.status)).length },
          { label: "Umsatz", value: `CHF ${totalRevenue.toFixed(2)}` },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#FFFFFF", borderRadius: "12px", padding: "20px 24px" }}>
            <p style={{ fontFamily: "sans-serif", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(26,48,64,0.4)", margin: "0 0 6px" }}>{label}</p>
            <p style={{ fontFamily: "sans-serif", fontWeight: 900, fontSize: "22px", color: "#1A3040", margin: 0 }}>{value}</p>
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
                    <span style={{ fontFamily: "sans-serif", fontSize: "13px", fontWeight: 700, color: "#1A3040" }}>CHF {Number(order.subtotal).toFixed(2)}</span>
                    <span style={{ background: s.color + "22", color: s.color, fontFamily: "sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px", borderRadius: "9999px" }}>{s.label}</span>
                    <span style={{ color: "rgba(26,48,64,0.3)", fontSize: "12px" }}>{expandedId === order.id ? "▲" : "▼"}</span>
                  </div>

                  {expandedId === order.id && (
                    <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(26,48,64,0.06)" }}>
                      <div style={{ paddingTop: "16px", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                        {order.order_items?.map((item, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontFamily: "sans-serif", fontSize: "13px", color: "#1A3040" }}>
                            <span>{item.quantity}× {item.product_name} {item.size ? `(${item.size})` : ""}</span>
                            <span>CHF {(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {Object.entries(STATUS_LABELS).map(([key, val]) => (
                          <button key={key} onClick={() => updateStatus(order.id, key)}
                            style={{ padding: "6px 14px", borderRadius: "9999px", border: `1px solid ${order.status === key ? val.color : "rgba(26,48,64,0.15)"}`, background: order.status === key ? val.color : "transparent", color: order.status === key ? "#FFF" : "rgba(26,48,64,0.5)", fontFamily: "sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                            {val.label}
                          </button>
                        ))}
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
