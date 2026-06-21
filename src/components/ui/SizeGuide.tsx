"use client";

import { useState, useEffect } from "react";
import type { Product } from "@/types";

interface Props {
  product: Product;
  onClose: () => void;
}

const MEASURE_STEPS = [
  { n: 1, title: "Taillengröße",      desc: "Messen Sie waagerecht um die schmalste Stelle Ihrer Taille herum." },
  { n: 2, title: "Hüftgröße",         desc: "Suchen Sie die weiteste Stelle des Hüftbereichs und messen Sie dort gerade von Kante zu Kante. Verdoppeln Sie dann dieses Maß." },
  { n: 3, title: "Oberschenkelgröße", desc: "Breiteste Stelle des Oberschenkelbereichs in der Nähe der Schrittnaht, von Seite zu Seite messen, dann verdoppeln." },
  { n: 4, title: "Kalbengröße",       desc: "Breiteste Stelle der Wade eines Beins quer messen, dann verdoppeln." },
  { n: 5, title: "Frontaufstieg",     desc: "Messen Sie von der Schrittnaht bis zur Oberkante des vorderen Bunds." },
  { n: 6, title: "Rücken aufstieg",   desc: "Messen Sie von der Schrittnaht bis zur Oberkante des hinteren Bunds." },
  { n: 7, title: "Schrittlänge",      desc: "Von der Schrittnaht entlang des Innenschenkels bis zum unteren Ende des Saums." },
  { n: 8, title: "Länge (Unterteil)", desc: "Messen Sie entlang der Seitennaht vom Bund bis zum unteren Saum." },
];

const thStyle: React.CSSProperties = {
  padding: "11px 14px", textAlign: "center", fontWeight: 700,
  color: "#1A3040", borderBottom: "1px solid #E4E4E4", whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  padding: "11px 14px", textAlign: "center", color: "#444", borderBottom: "1px solid #F0F0F0",
};
const tdBoldStyle: React.CSSProperties = { ...tdStyle, fontWeight: 700, color: "#1A3040" };

export default function SizeGuide({ product, onClose }: Props) {
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const chart = product.sizeChart;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(10,20,30,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "min(640px, 100%)",
          maxHeight: "min(88vh, 860px)",
          background: "#FFFFFF",
          borderRadius: "8px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
        }}
      >
        {/* Sticky header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 16px",
          position: "sticky", top: 0, background: "#FFFFFF", zIndex: 10,
          borderBottom: "1px solid rgba(26,48,64,0.1)",
        }}>
          <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#1A3040" }}>
            Konfektionsleitfaden
          </h2>
          <button
            onClick={onClose}
            aria-label="Schließen"
            style={{
              width: 34, height: 34, borderRadius: "50%",
              border: "1px solid rgba(26,48,64,0.15)",
              background: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px", color: "#1A3040",
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: "20px 24px 40px" }}>

          {chart && (
            <>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#1A3040", marginBottom: 16 }}>
                Vom Händler angegebene Artikelabmessungen
              </p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: "13px", color: "#1A3040", fontWeight: 600 }}>EU Größe ∨</span>
                <div style={{ display: "flex", gap: 3, background: "#F0F0F0", borderRadius: 999, padding: 3 }}>
                  {(["cm", "in"] as const).map((u) => (
                    <button key={u} onClick={() => setUnit(u)} style={{
                      padding: "4px 13px", borderRadius: 999, border: "none",
                      fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em",
                      textTransform: "uppercase", cursor: "pointer",
                      background: unit === u ? "#1A3040" : "transparent",
                      color: unit === u ? "#FFF" : "#5E7A8A",
                      transition: "background 0.15s, color 0.15s",
                    }}>
                      {u.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ overflowX: "auto", marginBottom: 32 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: 420 }}>
                  <thead>
                    <tr style={{ background: "#F6F6F6" }}>
                      <th style={thStyle}>Größe</th>
                      <th style={thStyle}>EU Größe</th>
                      {chart.columns.map((col) => <th key={col} style={thStyle}>{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {chart.rows.map((row, i) => (
                      <tr key={row.size} style={{ background: i % 2 === 1 ? "#F9F9F9" : "#FFF" }}>
                        <td style={tdBoldStyle}>{row.size}</td>
                        <td style={tdStyle}>{row.eu}</td>
                        {(unit === "cm" ? row.cm : row.in).map((val, j) => (
                          <td key={j} style={tdStyle}>{unit === "in" ? val.toFixed(2) : val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: "11px", color: "#9E9E9E", marginTop: 8, fontStyle: "italic" }}>
                  * Streichen Sie zum Scrollen in der Tabelle
                </p>
              </div>
            </>
          )}

          {/* Diagram */}
          <div style={{ borderTop: "1px solid rgba(26,48,64,0.08)", paddingTop: 24 }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#1A3040", marginBottom: 20 }}>
              Wie messe ich richtig?
            </p>

            {/* Original reference image — unmodified */}
            <div style={{ marginBottom: 28, background: "#FAFAFA", borderRadius: 6, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/pants-diagram.svg"
                alt="Hosendiagramm mit Messpunkten 1–8"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {MEASURE_STEPS.map((step) => (
                <div key={step.n}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: "#1A1A1A", color: "#FFF",
                      fontSize: "10px", fontWeight: 700,
                      display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>{step.n}</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A3040" }}>{step.title}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#666", lineHeight: 1.6, paddingLeft: 29 }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
