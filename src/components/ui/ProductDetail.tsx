"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import type { Locale, Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useProductReviews, RatingSummary, ReviewDrawer } from "./ReviewSection";

const SizeGuide = dynamic(() => import("./SizeGuide"), { ssr: false });

export interface ProductLabels {
  color: string;
  size: string;
  selectSize: string;
  addToCart: string;
  added: string;
  sizeGuide: string;
  shipping: string;
  trustShipping: string;
  trustReturns: string;
  trustPayment: string;
  accDescription: string;
  accSizeFit: string;
  accMaterial: string;
  accCare: string;
  accDelivery: string;
  deliveryMore: string;
}

interface Props {
  product: Product;
  locale: Locale;
  activeColor: number;
  onSelectColor: (i: number) => void;
  labels: ProductLabels;
}

export default function ProductDetail({ product, locale: loc, labels: t, activeColor, onSelectColor }: Props) {
  const [activeSize, setActiveSize] = useState<string | null>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [added, setAdded] = useState(false);
  // Der Hinweis erscheint erst nach einem Klick auf "In den Warenkorb" —
  // eine Fehlermeldung schon beim Öffnen der Seite wäre eine Rüge für etwas,
  // das die Kundin noch gar nicht falsch gemacht hat.
  const [sizeHint, setSizeHint] = useState(false);
  const { addItem } = useCart();
  const tr = useTranslations("reviews");
  // Bewertungen wie bei H&M: Seitenleiste; über den Link aus der Bewertungs-Mail gleich offen
  const { reviews, avg, token, addReview } = useProductReviews(product.slug);
  const [drawerState, setDrawerState] = useState<boolean | null>(null);
  const drawerOpen = drawerState ?? !!token;
  const closeDrawer = useCallback(() => setDrawerState(false), []);

  // Produkte mit Grössenauswahl dürfen nicht ohne Grösse in den Warenkorb:
  // die CJ-Variante wird über "Farbe|Grösse" aufgelöst (src/lib/cjMapping.ts),
  // eine Position ohne Grösse liesse sich später nicht bestellen.
  const needsSize = (product.sizes?.length ?? 0) > 0;
  const sizeMissing = needsSize && !activeSize;

  function chooseSize(size: string) {
    setActiveSize(size);
    setSizeHint(false);
  }

  function handleAddToCart() {
    if (sizeMissing) {
      setSizeHint(true);
      return;
    }
    const colorHex = product.colors[activeColor];
    const colorName = product.colorNames?.[loc]?.[activeColor];
    addItem({
      id: `${product.slug}-${colorHex}-${activeSize ?? "one-size"}`,
      productSlug: product.slug,
      name: product.name[loc],
      price: product.price,
      image: product.colorImages?.[activeColor] || product.images?.[0],
      color: colorHex,
      colorName,
      size: activeSize ?? undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="pt-4 md:pt-8">
      <p
        className="text-xs font-mono tracking-widest uppercase mb-3"
        style={{ color: "#00B4C5" }}
      >
        {product.category}
      </p>

      <h1
        className="text-4xl md:text-5xl font-black mb-4"
        style={{ color: "#1A3040" }}
      >
        {product.name[loc]}
      </h1>

      <p className="text-3xl font-bold mb-8" style={{ color: "#D4AF37" }}>
        CHF {product.price.toFixed(2)}
      </p>

      {reviews.length > 0 && (
        <div className="-mt-5 mb-8">
          <RatingSummary avg={avg} count={reviews.length} onClick={() => setDrawerState(true)} />
        </div>
      )}

      {/* Color swatches */}
      {product.colors.length > 0 && (
        <div className="mb-8">
          <p
            className="text-xs font-mono tracking-widest uppercase mb-3"
            style={{ color: "#5E7A8A" }}
          >
            {t.color}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((color, i) => {
              const name = product.colorNames?.[loc]?.[i];
              const img = product.colorImages?.[i];
              return (
                <div key={i} className="group relative">
                  {/* Frueher lag hier das Original-Produktfoto (bis 1 MB pro
                      Farbe) als background-image auf einem 32-px-Kreis - an
                      next/image vorbei, also ohne Verkleinerung. Jetzt eine
                      64-px-Variante aus der Bildoptimierung. */}
                  <div
                    onClick={() => onSelectColor(i)}
                    className="relative w-8 h-8 rounded-full overflow-hidden cursor-pointer hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: color,
                      border: `2px solid ${activeColor === i ? "#1A3040" : "rgba(26,48,64,0.15)"}`,
                      outline: activeColor === i ? "2px solid #1A3040" : "none",
                      outlineOffset: "2px",
                    }}
                  >
                    {img && (
                      <Image src={img} alt="" fill sizes="32px" style={{ objectFit: "cover", objectPosition: "center 30%" }} />
                    )}
                  </div>
                  {name && (
                    <span
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      style={{ background: "#0A3D52", color: "#F8F3E8", borderRadius: "3px" }}
                    >
                      {name}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Size selector */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="mb-8">
          <p
            className="text-xs font-mono tracking-widest uppercase mb-3"
            style={{ color: sizeHint && sizeMissing ? "#B4553C" : "#5E7A8A" }}
          >
            {t.size}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => chooseSize(size)}
                className="px-4 py-2 text-xs font-mono transition-all"
                style={{
                  border: `1px solid ${activeSize === size ? "#00B4C5" : "rgba(26,48,64,0.2)"}`,
                  color: activeSize === size ? "#00B4C5" : "#1A3040",
                  borderRadius: "6px",
                  background: "transparent",
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleAddToCart}
        className="w-full py-4 font-semibold text-base transition-all mb-4"
        style={{
          background: added ? "#2E7D5E" : "#D4AF37",
          color: added ? "#F8F3E8" : "#1A3040",
          borderRadius: "9999px",
          cursor: "pointer",
          transition: "background 0.3s, color 0.3s",
        }}
      >
        {added ? t.added : t.addToCart}
      </button>

      {sizeHint && sizeMissing && (
        <p
          className="text-xs font-mono text-center mb-4"
          style={{ color: "#B4553C" }}
          role="alert"
        >
          {t.selectSize}
        </p>
      )}

      {product.sizeChart && (
        <button
          onClick={() => setSizeGuideOpen(true)}
          className="w-full py-4 font-semibold text-base transition-colors mb-10"
          style={{
            border: "1px solid rgba(26,48,64,0.2)",
            color: "#1A3040",
            borderRadius: "9999px",
            background: "transparent",
          }}
        >
          {t.sizeGuide}
        </button>
      )}

      {sizeGuideOpen && (
        <SizeGuide product={product} onClose={() => setSizeGuideOpen(false)} />
      )}

      {/* Infos als Klappboxen wie bei H&M – alle zu, Text bleibt für Google im HTML */}
      <Accordion
        items={[
          { id: "description", label: t.accDescription, content: <DetailText text={product.description[loc]} /> },
          ...(product.measurements || product.sizeChart
            ? [{
                id: "size-fit",
                label: t.accSizeFit,
                content: (
                  <div className="space-y-3">
                    {product.measurements && <DetailText text={product.measurements[loc]} />}
                    {product.sizeChart && (
                      <button
                        type="button"
                        onClick={() => setSizeGuideOpen(true)}
                        className="text-sm underline underline-offset-4"
                        style={{ color: "#1A3040" }}
                      >
                        {t.sizeGuide}
                      </button>
                    )}
                  </div>
                ),
              }]
            : []),
          { id: "material", label: t.accMaterial, content: <DetailText text={product.material[loc]} /> },
          { id: "care", label: t.accCare, content: <DetailText text={product.care[loc]} /> },
          {
            id: "delivery",
            label: t.accDelivery,
            content: (
              <div className="space-y-3">
                <DetailText text={[`– ${t.shipping}`, `– ${t.trustShipping}`, `– ${t.trustReturns}`, `– ${t.trustPayment}`].join("\n")} />
                <Link href={`/${loc}/versand`} className="text-sm underline underline-offset-4" style={{ color: "#1A3040" }}>
                  {t.deliveryMore}
                </Link>
              </div>
            ),
          },
        ]}
      />

      {/* Bewertungen als letzte Zeile, öffnet die Seitenleiste (Anker für den Mail-Link) */}
      <button
        type="button"
        id="reviews"
        onClick={() => setDrawerState(true)}
        className="w-full flex items-center justify-between py-5 text-left"
        style={{ color: "#1A3040", background: "transparent", cursor: "pointer", scrollMarginTop: "120px" }}
      >
        <span className="text-[15px] uppercase tracking-[0.04em]">
          {tr("count_many")}
          {reviews.length > 0 && <span style={{ color: "rgba(26,48,64,0.55)" }}> ({reviews.length})</span>}
        </span>
        <PlusIcon open={false} />
      </button>

      <ReviewDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        productSlug={product.slug}
        reviews={reviews}
        avg={avg}
        token={token}
        onAdded={addReview}
      />

    </div>
  );
}

/**
 * Detailtext mit einfacher Gliederung: Leerzeile = neuer Absatz,
 * Zeilen mit "– " oder "- " am Anfang = Aufzählung.
 */
function DetailText({ text }: { text: string }) {
  const color = "rgba(26,48,64,0.65)";
  return (
    <div className="space-y-3">
      {text.split(/\n\s*\n/).map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const isList = lines.length > 0 && lines.every((l) => /^[–-]\s/.test(l));
        return isList ? (
          <ul key={i} className="text-sm leading-relaxed list-disc pl-5 space-y-1" style={{ color }}>
            {lines.map((l) => (
              <li key={l}>{l.replace(/^[–-]\s+/, "")}</li>
            ))}
          </ul>
        ) : (
          <p key={i} className="text-sm leading-relaxed" style={{ color }}>
            {lines.join(" ")}
          </p>
        );
      })}
    </div>
  );
}

/** Dünnes Plus, das beim Aufklappen zum Minus wird. */
function PlusIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden style={{ flexShrink: 0 }}>
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="12" y1="4" x2="12" y2="20" style={{ transform: open ? "scaleY(0)" : "none", transformOrigin: "center", transition: "transform 0.25s ease" }} />
    </svg>
  );
}

/** Klappboxen: Titel in Versalien links, Plus rechts, Inhalt gleitet auf. Mehrere dürfen offen sein. */
function Accordion({ items }: { items: { id: string; label: string; content: React.ReactNode }[] }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      {items.map(({ id, label, content }) => {
        const isOpen = open.has(id);
        return (
          <div key={id}>
            <button
              type="button"
              id={`acc-${id}`}
              aria-expanded={isOpen}
              aria-controls={`acc-${id}-panel`}
              onClick={() => toggle(id)}
              className="w-full flex items-center justify-between py-5 text-left"
              style={{ color: "#1A3040", background: "transparent", cursor: "pointer" }}
            >
              <span className="text-[15px] uppercase tracking-[0.04em]">{label}</span>
              <PlusIcon open={isOpen} />
            </button>
            {/* grid 0fr → 1fr: weiches Aufklappen ohne feste Höhe */}
            <div
              id={`acc-${id}-panel`}
              role="region"
              aria-labelledby={`acc-${id}`}
              style={{ display: "grid", gridTemplateRows: isOpen ? "1fr" : "0fr", transition: "grid-template-rows 0.3s ease" }}
            >
              <div style={{ overflow: "hidden" }}>
                <div className="pb-6">{content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
