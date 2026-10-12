"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import ProductGallery from "./ProductGallery";
import ProductDetail, { type ProductLabels } from "./ProductDetail";
import type { Locale, Product } from "@/types";

interface Props {
  product: Product;
  locale: Locale;
  labels: ProductLabels;
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
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
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

/** Oberer Anschlag = Höhe des fixen Headers, unterer Abstand zum Fensterrand (px). */
const STICKY_TOP = 72;
const STICKY_BOTTOM = 24;

/**
 * Info-Spalte wie bei H&M, in beide Richtungen: Beim Runterscrollen läuft sie mit,
 * bis ihr Ende sichtbar ist, und bleibt dann stehen. Beim Hochscrollen läuft sie
 * sofort wieder mit, bis ihr Anfang unter dem Header steht. Umgesetzt über das
 * sticky-`top`, das bei jedem Scrollen um den gescrollten Weg verschoben und
 * zwischen den beiden Anschlägen begrenzt wird. Nur ab Tablet-Breite (md:sticky).
 */
function StickyPanel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // top direkt am Element setzen: hängt von Scrollrichtung und gemessener Höhe ab
    // (Klappboxen, Fenstergrösse) und braucht keinen React-State
    let top = STICKY_TOP;
    let lastY = window.scrollY;
    const lowest = () => Math.min(STICKY_TOP, window.innerHeight - el.offsetHeight - STICKY_BOTTOM);
    const clampAndApply = () => {
      top = Math.min(STICKY_TOP, Math.max(lowest(), top));
      el.style.top = `${top}px`;
    };
    const onScroll = () => {
      const y = window.scrollY;
      top -= y - lastY;
      lastY = y;
      clampAndApply();
    };
    clampAndApply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", clampAndApply);
    const observer = new ResizeObserver(clampAndApply);
    observer.observe(el);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", clampAndApply);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="md:sticky px-6 md:px-10 lg:px-16" style={{ top: STICKY_TOP }}>
      {children}
    </div>
  );
}
