"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/context/CartContext";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const locale = (params?.locale as string) ?? "de";

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, locale }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={closeCart}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(10,20,30,0.4)",
            backdropFilter: "blur(3px)",
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 101,
          width: "min(420px, 100vw)",
          background: "#F8F3E8",
          boxShadow: "-8px 0 40px rgba(26,48,64,0.12)",
          display: "flex", flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(26,48,64,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ fontSize: "13px", fontFamily: "var(--font-archivo-black),sans-serif", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#1A3040", margin: 0 }}>
              Warenkorb
            </h2>
            {items.length > 0 && (
              <span style={{ fontSize: "11px", fontFamily: "var(--font-geist-mono)", color: "rgba(26,48,64,0.45)" }}>
                ({items.reduce((s, i) => s + i.quantity, 0)})
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            aria-label="Warenkorb schliessen"
            style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(26,48,64,0.15)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "#1A3040" }}
          >
            ×
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {items.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px" }}>
              <span style={{ fontSize: "32px", opacity: 0.2 }}>○</span>
              <p style={{ fontSize: "13px", color: "rgba(26,48,64,0.4)", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.1em" }}>
                Dein Warenkorb ist leer
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{ display: "flex", gap: "14px", padding: "16px", background: "#FFFFFF", borderRadius: "16px" }}
                >
                  {/* Image */}
                  <div style={{ position: "relative", width: "80px", height: "80px", flexShrink: 0, borderRadius: "10px", overflow: "hidden", background: "#EDE9E2" }}>
                    {item.image && (
                      <Image src={item.image} alt={item.name} fill sizes="80px" style={{ objectFit: "contain" }} />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <p style={{ fontSize: "12px", fontFamily: "var(--font-archivo-black),sans-serif", fontWeight: 900, textTransform: "uppercase", color: "#1A3040", margin: 0, lineHeight: 1.3 }}>
                      {item.name}
                    </p>
                    {item.size && (
                      <p style={{ fontSize: "10px", fontFamily: "var(--font-geist-mono)", color: "rgba(26,48,64,0.45)", margin: 0 }}>
                        {item.size}
                      </p>
                    )}
                    {item.colorName && (
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        {item.color && <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.color, border: "1px solid rgba(26,48,64,0.15)" }} />}
                        <p style={{ fontSize: "10px", fontFamily: "var(--font-geist-mono)", color: "rgba(26,48,64,0.45)", margin: 0 }}>{item.colorName}</p>
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
                      {/* Qty stepper */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0", border: "1px solid rgba(26,48,64,0.12)", borderRadius: "9999px", overflow: "hidden" }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{ width: "28px", height: "28px", border: "none", background: "transparent", cursor: "pointer", fontSize: "16px", color: "#1A3040", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          −
                        </button>
                        <span style={{ fontSize: "12px", fontFamily: "var(--font-geist-mono)", color: "#1A3040", minWidth: "20px", textAlign: "center" }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{ width: "28px", height: "28px", border: "none", background: "transparent", cursor: "pointer", fontSize: "16px", color: "#1A3040", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          +
                        </button>
                      </div>

                      <p style={{ fontSize: "13px", fontFamily: "var(--font-geist-mono)", fontWeight: 700, color: "#1A3040", margin: 0 }}>
                        CHF {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label="Entfernen"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(26,48,64,0.3)", fontSize: "14px", padding: "0", alignSelf: "flex-start", lineHeight: 1, transition: "color 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#1A3040")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(26,48,64,0.3)")}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(26,48,64,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(26,48,64,0.5)" }}>
                Subtotal
              </span>
              <span style={{ fontSize: "18px", fontFamily: "var(--font-archivo-black),sans-serif", fontWeight: 900, color: "#1A3040" }}>
                CHF {totalPrice.toFixed(2)}
              </span>
            </div>
            <p style={{ fontSize: "10px", fontFamily: "var(--font-geist-mono)", color: "rgba(26,48,64,0.4)", marginBottom: "14px", textAlign: "center" }}>
              Versandkosten werden an der Kasse berechnet
            </p>
            <button
              onClick={handleCheckout}
              disabled={loading}
              style={{ width: "100%", padding: "15px", background: "#1A3040", color: "#F8F3E8", border: "none", borderRadius: "9999px", fontSize: "12px", fontFamily: "var(--font-archivo-black),sans-serif", fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1, transition: "opacity 0.2s" }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.opacity = "1"; }}
            >
              {loading ? "Wird geladen…" : "Zur Kasse →"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
