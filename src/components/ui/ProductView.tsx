"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import ProductGallery from "./ProductGallery";
import ProductDetail from "./ProductDetail";
import type { Locale, Product } from "@/types";

interface Props {
  product: Product;
  locale: Locale;
  labels: {
    color: string;
    size: string;
    selectSize: string;
    addToCart: string;
    added: string;
    sizeGuide: string;
    details: string;
    material: string;
    care: string;
    measurements: string;
    shipping: string;
    trustShipping: string;
    trustReturns: string;
    trustPayment: string;
  };
}

const noopSubscribe = () => () => {};

function readUrlColor(): number | null {
  const raw = new URLSearchParams(window.location.search).get("farbe");
  const index = raw === null ? NaN : Number(raw);
  return Number.isInteger(index) && index >= 0 ? index : null;
}

/**
 * Hält die gemeinsame Farb-Auswahl: Ein Klick auf einen Farb-Swatch (in ProductDetail)
 * oder auf ein Farb-Thumbnail (in ProductGallery) aktualisiert beide Seiten synchron —
 * die Galerie zeigt dann das passende Bild dieser Farbe.
 */
export default function ProductView({ product, locale, labels }: Props) {
  // ?farbe=<index> (Links aus dem Google-Feed) wählt die passende Farbe vor.
  // Gelesen erst im Browser (Server-Snapshot = null) statt per useSearchParams —
  // sonst müsste die ganze Produktansicht hinter eine Suspense-Grenze und fehlte
  // im Server-HTML.
  const urlColor = useSyncExternalStore(noopSubscribe, readUrlColor, () => null);
  const [pickedColor, setActiveColor] = useState<number | null>(null);
  const colorCount = product.colors?.length ?? 0;
  // Ohne Vorgabe startet die Farbe mit Packshot – dasselbe Bild wie auf der Produktkarte
  const packshotColor = (product.colorImages ?? []).findIndex((s) => s?.includes("-packshot"));
  const activeColor =
    pickedColor ?? (urlColor !== null && urlColor < colorCount ? urlColor : Math.max(packshotColor, 0));

  return (
    // Wie bei H&M: links die Bilder gross untereinander, rechts die Infos
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-8 md:gap-12 items-start">
      <ProductGallery product={product} locale={locale} activeColor={activeColor} />
      <StickyPanel>
        <ProductDetail
          product={product}
          locale={locale}
          labels={labels}
          activeColor={activeColor}
          onSelectColor={setActiveColor}
        />
      </StickyPanel>
    </div>
  );
}

/** Abstand unter dem fixen Header bzw. zum unteren Fensterrand (px). */
const STICKY_TOP = 96;
const STICKY_BOTTOM = 24;

/**
 * Info-Spalte wie bei H&M: Sie scrollt mit, bis ihr unteres Ende im Fenster ist,
 * und bleibt dann stehen, während die Bilder weiterlaufen. Ist sie kürzer als das
 * Fenster, klebt sie direkt unter dem Header. Nur ab Tablet-Breite (md:sticky).
 */
function StickyPanel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // top direkt am Element setzen: hängt von der gemessenen Höhe ab (Akkordeons,
    // Grössentabelle, Fenstergrösse) und braucht keinen React-State
    const update = () => {
      el.style.top = `${Math.min(STICKY_TOP, window.innerHeight - el.offsetHeight - STICKY_BOTTOM)}px`;
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div ref={ref} className="md:sticky" style={{ top: STICKY_TOP }}>
      {children}
    </div>
  );
}
