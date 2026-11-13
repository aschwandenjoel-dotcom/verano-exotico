"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SURVEY_SOURCES, type SurveySource } from "@/lib/survey";

/** Eine Frage nach dem Kauf: Woher kennt die Kundin den Shop? */
export default function PurchaseSurvey({ orderId }: { orderId: string }) {
  const t = useTranslations("survey");
  const [done, setDone] = useState(false);

  async function answer(source: SurveySource) {
    setDone(true);
    try {
      await fetch("/api/orders/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, source }),
      });
    } catch {
      // Antwort ist freiwillig, ein Fehler stört den Kauf nicht
    }
  }

  return (
    <div style={{ border: "1px solid rgba(15,30,61,0.15)", borderRadius: "16px", padding: "20px", marginBottom: "32px", textAlign: "left" }}>
      {done ? (
        <p style={{ fontSize: "14px", color: "#0F1E3D" }}>{t("thanks")}</p>
      ) : (
        <>
          <p style={{ fontSize: "14px", color: "#0F1E3D", fontWeight: 600, marginBottom: "12px" }}>{t("question")}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {SURVEY_SOURCES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => answer(s)}
                style={{ border: "1px solid rgba(15,30,61,0.2)", borderRadius: "2px", padding: "8px 14px", fontSize: "13px", color: "#0F1E3D", background: "transparent", cursor: "pointer" }}
              >
                {t(s)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
