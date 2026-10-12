"use client";

import { useTranslations } from "next-intl";

/**
 * Dezente KI-Kennzeichnung für Bilder – wie eine Bildzeile im Modekatalog: winzige
 * Versalien in der Mono-Schrift, halbtransparent mit leichter Unschärfe, unten rechts.
 * Der Eltern-Container muss positioniert sein (relative/absolute/sticky).
 */
export default function AiBadge({ inset = 10, variant = "overlay" }: { inset?: number; variant?: "overlay" | "inline" }) {
  const t = useTranslations("ai");
  // Als schlichte Zeile unter dem Bild (Produktkarten)
  if (variant === "inline") {
    return (
      <p
        style={{
          marginTop: "6px",
          fontFamily: "var(--font-geist-mono)",
          fontSize: "8.5px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(26,48,64,0.45)",
        }}
      >
        {t("label")}
      </p>
    );
  }
  return (
    <span
      style={{
        position: "absolute",
        right: inset,
        bottom: inset,
        zIndex: 3,
        pointerEvents: "none",
        padding: "3px 7px",
        borderRadius: "2px",
        background: "rgba(10,25,35,0.32)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        color: "rgba(248,243,232,0.9)",
        fontFamily: "var(--font-geist-mono)",
        fontSize: "8.5px",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        lineHeight: 1.4,
        whiteSpace: "nowrap",
      }}
    >
      {t("label")}
    </span>
  );
}
