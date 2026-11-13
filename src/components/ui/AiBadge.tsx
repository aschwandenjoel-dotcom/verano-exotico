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
  // Am Handy kleiner und näher am Rand, damit der Hinweis weniger Bild verdeckt
  return (
    <span
      className="right-[6px] bottom-[6px] md:right-[var(--ai-inset)] md:bottom-[var(--ai-inset)] px-[4px] py-[1px] md:px-[7px] md:py-[3px] text-[6px] md:text-[8.5px] tracking-[0.12em] md:tracking-[0.18em]"
      style={{
        ["--ai-inset" as string]: `${inset}px`,
        position: "absolute",
        zIndex: 3,
        pointerEvents: "none",
        borderRadius: "2px",
        background: "rgba(10,25,35,0.32)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        color: "rgba(248,243,232,0.9)",
        fontFamily: "var(--font-geist-mono)",
        textTransform: "uppercase",
        lineHeight: 1.4,
        whiteSpace: "nowrap",
      }}
    >
      {t("label")}
    </span>
  );
}
