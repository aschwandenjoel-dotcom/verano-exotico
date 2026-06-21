"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale, Product } from "@/types";

interface Props {
  product: Product;
  locale: Locale;
}

export default function ProductCard({ product, locale }: Props) {
  const t = useTranslations("collection");
  const name = product.name[locale];
  const [activeImg, setActiveImg] = useState(0);
  const images = product.images ?? [];

  return (
    <Link
      href={`/${locale}/product/${product.slug}`}
      className="group block bg-surface overflow-hidden"
    >
      <div className="relative aspect-square overflow-hidden bg-[#111]">
        {images.length > 0 ? (
          <>
            <Image
              src={images[activeImg]}
              alt={name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-contain transition-transform duration-500 group-hover:scale-105"
            />
            {/* Thumbnail strip — hover to switch image */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => { e.preventDefault(); setActiveImg(i); }}
                    className={[
                      "w-1.5 h-1.5 rounded-full transition-all",
                      i === activeImg ? "bg-white scale-125" : "bg-white/40 hover:bg-white/70",
                    ].join(" ")}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-end justify-center h-full gap-3 group-hover:scale-105 transition-transform duration-500">
            {product.colors.slice(0, 3).map((color, i) => (
              <div
                key={color}
                className="rounded-sm"
                style={{ background: color, width: 48, height: 64 + i * 24, opacity: 0.85 }}
              />
            ))}
          </div>
        )}

        {product.isNew && (
          <span className="absolute top-3 left-3 text-[10px] font-mono font-bold px-2 py-1 bg-primary text-cream tracking-widest uppercase z-10">
            DROP
          </span>
        )}
      </div>

      {/* Color swatches */}
      {product.colors.length > 0 && (
        <div className="px-4 pt-3 flex gap-1.5 flex-wrap">
          {product.colors.map((color) => (
            <div
              key={color}
              className="w-4 h-4 rounded-full border border-white/20"
              style={{ background: color }}
            />
          ))}
        </div>
      )}

      <div className="px-4 py-3 border-t border-white/8 mt-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-0.5">
              {product.category}
            </p>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">{name}</h3>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-cream">CHF {product.price}</span>
            <p className="text-[10px] font-mono text-text-muted mt-0.5">
              {t("view_product")} →
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
