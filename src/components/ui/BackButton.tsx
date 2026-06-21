"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      aria-label="Zurück"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "0",
        marginBottom: "32px",
        color: "rgba(26,48,64,0.45)",
        fontSize: "11px",
        fontFamily: "var(--font-geist-mono)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        transition: "color 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#1A3040")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(26,48,64,0.45)")}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      Zurück
    </button>
  );
}
