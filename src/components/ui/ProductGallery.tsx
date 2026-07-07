"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Locale, Product } from "@/types";

interface Props {
  product: Product;
  locale: Locale;
  activeColor: number;
  onSelectColor: (i: number) => void;
}

export default function ProductGallery({ product, locale, activeColor, onSelectColor }: Props) {
  const colorImages = product.colorImages ?? [];
  // Allgemeine Bilder, die schon als Farb-Bild vorkommen, nicht doppelt zeigen
  const general = (product.images ?? []).filter((src) => src && !colorImages.includes(src));
  const colors = product.colors ?? [];
  const colorNames = product.colorNames?.[locale] ?? [];

  // Auswahl: entweder eine Farbe ("color") oder ein allgemeines Bild ("img")
  const [sel, setSel] = useState<{ k: "color" | "img"; i: number }>({ k: "color", i: activeColor });
  const [zoomOpen, setZoomOpen] = useState(false);

  // Wenn der Farb-Swatch in den Produktdetails geklickt wird → Galerie mitziehen
  useEffect(() => {
    setSel({ k: "color", i: activeColor });
  }, [activeColor]);

  const colorSrc = (i: number) => colorImages[i] || general[0] || "";
  const hasAnyImage = general.length > 0 || colorImages.some(Boolean);

  if (!hasAnyImage) {
    return (
      <div className="relative h-[60vh] md:h-[70vh] rounded-2xl overflow-hidden bg-surface flex items-center justify-center">
        <div className="flex items-end gap-3">
          {colors.slice(0, 3).map((color, i) => (
            <div key={color} className="rounded-sm" style={{ background: color, width: 48, height: 64 + i * 24, opacity: 0.85 }} />
          ))}
        </div>
      </div>
    );
  }

  const mainSrc = sel.k === "color" ? colorSrc(sel.i) : general[sel.i];

  // Thumbnails: erst pro Farbe (mit Bild), dann die allgemeinen Produktfotos
  const colorThumbs = colors
    .map((_, i) => i)
    .filter((i) => colorImages[i]);

  return (
    <div className="flex flex-col gap-3">
      {/* Hauptbild */}
      <div
        onClick={() => mainSrc && setZoomOpen(true)}
        style={{ position: "relative", width: "100%", aspectRatio: "1/1", borderRadius: "16px", overflow: "hidden", background: "#EDE9E2", cursor: "zoom-in" }}
      >
        <Image
          key={mainSrc}
          src={mainSrc}
          alt={product.name.de}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: "contain" }}
          priority
        />
        {/* aktueller Farbname als Badge */}
        {sel.k === "color" && colorNames[sel.i] && (
          <span
            style={{
              position: "absolute", bottom: 12, left: 12,
              background: "rgba(10,61,82,0.85)", color: "#F8F3E8",
              fontSize: 11, fontFamily: "var(--font-geist-mono)",
              letterSpacing: "0.08em", padding: "5px 12px", borderRadius: 4,
            }}
          >
            {colorNames[sel.i]}
          </span>
        )}
        {/* Zoom-Hinweis */}
        <span
          aria-hidden
          style={{
            position: "absolute", top: 12, right: 12,
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(10,61,82,0.65)", color: "#F8F3E8",
            display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </span>
      </div>

      {/* Thumbnails */}
      <div className="flex flex-wrap gap-2">
        {colorThumbs.map((i) => {
          const isActive = sel.k === "color" && sel.i === i;
          return (
            <button
              key={`c-${i}`}
              type="button"
              title={colorNames[i]}
              onClick={() => onSelectColor(i)}
              className="relative overflow-hidden transition-all"
              style={{
                width: 60, height: 76, borderRadius: 10,
                border: `2px solid ${isActive ? "#1A3040" : "rgba(26,48,64,0.12)"}`,
                flexShrink: 0, background: "#EDE9E2", cursor: "pointer", padding: 0,
              }}
            >
              <Image src={colorImages[i]} alt={colorNames[i] ?? ""} fill sizes="60px" className="object-cover object-top" />
            </button>
          );
        })}

        {general.map((src, i) => {
          const isActive = sel.k === "img" && sel.i === i;
          return (
            <button
              key={`g-${i}`}
              type="button"
              onClick={() => setSel({ k: "img", i })}
              className="relative overflow-hidden transition-all"
              style={{
                width: 60, height: 76, borderRadius: 10,
                border: `2px solid ${isActive ? "#1A3040" : "rgba(26,48,64,0.12)"}`,
                flexShrink: 0, background: "#EDE9E2", cursor: "pointer", padding: 0,
              }}
            >
              <Image src={src} alt="" fill sizes="60px" className="object-cover object-top" />
            </button>
          );
        })}
      </div>

      {zoomOpen && mainSrc && (
        <ZoomOverlay src={mainSrc} alt={product.name.de} onClose={() => setZoomOpen(false)} />
      )}
    </div>
  );
}

/* ─── Vollbild-Zoom ──────────────────────────────────────────────
   Klick/Tap zoomt rein & raus, Maus/Finger verschiebt, Scrollrad
   stuft stufenlos, Esc oder Klick auf den Hintergrund schliesst. */
function ZoomOverlay({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const setOriginFrom = (clientX: number, clientY: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - r.top) / r.height) * 100));
    setOrigin({ x, y });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(10,20,28,0.93)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "clamp(12px,4vw,48px)",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Schliessen"
        style={{
          position: "absolute", top: 18, right: 18, width: 46, height: 46,
          borderRadius: "50%", border: "none", background: "rgba(248,243,232,0.15)",
          color: "#F8F3E8", fontSize: 26, lineHeight: 1, cursor: "pointer",
        }}
      >
        ×
      </button>

      <div
        onClick={(e) => { e.stopPropagation(); setScale((s) => (s > 1 ? 1 : 2.5)); }}
        onMouseMove={(e) => { if (scale > 1) setOriginFrom(e.clientX, e.clientY, e.currentTarget); }}
        onTouchMove={(e) => { if (scale > 1 && e.touches[0]) setOriginFrom(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget); }}
        onWheel={(e) => { setOriginFrom(e.clientX, e.clientY, e.currentTarget); setScale((s) => Math.min(4, Math.max(1, s - e.deltaY * 0.0025))); }}
        style={{
          position: "relative", width: "min(92vw, 900px)", height: "min(86vh, 900px)",
          cursor: scale > 1 ? "zoom-out" : "zoom-in", overflow: "hidden",
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="92vw"
          style={{
            objectFit: "contain",
            transform: `scale(${scale})`,
            transformOrigin: `${origin.x}% ${origin.y}%`,
            transition: scale === 1 ? "transform 0.25s ease" : "none",
          }}
          priority
        />
      </div>

      <span
        style={{
          position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
          color: "rgba(248,243,232,0.65)", fontSize: 12, letterSpacing: "0.05em",
          fontFamily: "var(--font-geist-mono)", pointerEvents: "none", textAlign: "center",
        }}
      >
        Klicken zum Zoomen · Bewegen zum Verschieben · Esc schliesst
      </span>
    </div>
  );
}
