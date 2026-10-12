"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Locale, Product } from "@/types";

interface Props {
  product: Product;
  locale: Locale;
  activeColor: number;
}

/**
 * Bildergalerie wie bei H&M: Auf dem Desktop stehen die Bilder gross untereinander
 * (die Infospalte daneben klebt, siehe ProductView), auf dem Handy wischt man sie
 * seitlich durch. Die Farbwahl selbst passiert in ProductDetail.
 *
 * Gezeigt werden nur Fotos der gewählten Farbe: das Farbbild und – bei der Farbe mit
 * Packshot – das Model-Bild. Bei welcher Farbe die übrigen Lieferantenfotos sind, ist
 * nicht hinterlegt; sie erscheinen deshalb nur bei Produkten mit einer einzigen Farbe.
 * Packshot, Model-Bild und das erste Bild stehen in voller Breite, Lieferantenfotos
 * (oft kleiner/unschärfer) zu zweit nebeneinander.
 */
export default function ProductGallery({ product, locale, activeColor }: Props) {
  const colorImages = product.colorImages ?? [];
  // Allgemeine Bilder, die schon als Farb-Bild vorkommen, nicht doppelt zeigen
  const general = (product.images ?? []).filter((src) => src && !colorImages.includes(src));
  const colors = product.colors ?? [];
  const colorNames = product.colorNames?.[locale] ?? [];
  const name = product.name[locale];

  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);
  const [current, setCurrent] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);

  const colorImg = colorImages[activeColor];
  const packshotColor = colorImages.findIndex((src) => src?.includes("-packshot"));
  const model = general.find((src) => src.includes("-model"));
  const extra = colors.length <= 1
    ? general
    : activeColor === packshotColor && model ? [model] : [];
  const images = colorImg ? [colorImg, ...extra] : general;
  const isLarge = (src: string, i: number) => i === 0 || src.includes("-packshot") || src.includes("-model");
  const colorAlt = colorNames[activeColor] ? `${name} – ${colorNames[activeColor]}` : name;

  // Neue Farbe gewählt: auf dem Handy wieder beim ersten Bild beginnen
  useEffect(() => {
    stripRef.current?.scrollTo({ left: 0 });
  }, [activeColor]);

  if (images.length === 0) {
    return (
      <div className="relative h-[60vh] md:h-[70vh] overflow-hidden bg-surface flex items-center justify-center">
        <div className="flex items-end gap-3">
          {colors.slice(0, 3).map((color, i) => (
            <div key={color} className="rounded-sm" style={{ background: color, width: 48, height: 64 + i * 24, opacity: 0.85 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={stripRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.clientWidth) setCurrent(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="flex gap-1 overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-2 md:overflow-visible md:snap-none"
        style={{ scrollbarWidth: "none" }}
      >
        {images.map((src, i) => {
          const alt = i === 0 && colorImg ? colorAlt : name;
          const large = isLarge(src, i);
          return (
            <button
              key={src}
              type="button"
              onClick={() => setZoom({ src, alt })}
              className={`relative shrink-0 w-full snap-start${large ? " md:col-span-2" : ""}`}
              style={{ aspectRatio: "4/5", background: "#EDE9E2", cursor: "zoom-in", border: "none", padding: 0 }}
            >
              {/* 4:5 und randlos wie die Produktkarten; die Lupe zeigt das ganze Bild */}
              <Image
                src={src}
                alt={alt}
                fill
                sizes={large ? "(max-width: 768px) 100vw, 60vw" : "(max-width: 768px) 100vw, 30vw"}
                style={{ objectFit: "cover" }}
                priority={i === 0}
              />
            </button>
          );
        })}
      </div>

      {/* Handy: Zähler statt Thumbnails */}
      {images.length > 1 && (
        <span
          className="md:hidden"
          style={{
            position: "absolute", bottom: 12, right: 12,
            background: "rgba(10,61,82,0.75)", color: "#F8F3E8",
            fontSize: 11, fontFamily: "var(--font-geist-mono)",
            letterSpacing: "0.08em", padding: "4px 10px", borderRadius: 4,
            pointerEvents: "none",
          }}
        >
          {Math.min(current, images.length - 1) + 1} / {images.length}
        </span>
      )}

      {zoom && <ZoomOverlay src={zoom.src} alt={zoom.alt} onClose={() => setZoom(null)} />}
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
