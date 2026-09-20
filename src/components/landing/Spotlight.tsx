"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Locale, Product } from "@/types";

/**
 * Spotlight "Mehr als ein Bikini" - die angepinnte Sektion, in der der Tag
 * zur Nacht wird.
 *
 * Aufbau: Die aeussere Sektion ist 2.6 Viewport-Hoehen hoch und traegt
 * data-scroll="pin"; das innere Element klebt (sticky) eine Viewport-Hoehe
 * lang am oberen Rand. Waehrend die Besucherin durch die Strecke scrollt,
 * liefert useScrollProgress den Fortschritt --p, und das CSS (globals.css,
 * .spot*) blendet den Hintergrund von Sand nach Nachtblau, laesst den
 * goldenen Schein verglühen und schiebt die Karten nacheinander herein.
 *
 * Auf dem Handy passen drei Karten nicht nebeneinander: dort gleitet die
 * Reihe mit dem Scrollen seitlich durch (--slide: 1 im CSS).
 */
export default function Spotlight({ products, locale }: { products: Product[]; locale: Locale }) {
  const t = useTranslations("landing");
  if (products.length === 0) return null;

  return (
    <section className="spot" data-scroll="pin" style={{ "--n": products.length } as React.CSSProperties} aria-label={t("spot_eyebrow")}>
      <div className="spot-sticky">
        {/* Goldener Schein: Sonne, die untergeht */}
        <div className="spot-glow" aria-hidden="true" />

        <div className="spot-inner px-6 md:px-10">
          <div className="spot-head">
            <p className="spot-eyebrow">{t("spot_eyebrow")}</p>
            <h2 className="spot-title">
              <span className="block">{t("spot_title_1")}</span>
              <span className="block spot-title-accent">{t("spot_title_2")}</span>
            </h2>
            <p className="spot-text">{t("spot_text")}</p>
          </div>

          <div className="spot-row">
            {products.map((product, i) => {
              const image = product.images?.[0] ?? product.colorImages?.find(Boolean);
              const isSet = /set/i.test(product.slug);
              return (
                <Link
                  key={product.slug}
                  href={`/${locale}/product/${product.slug}`}
                  className="spot-card"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <div className="spot-card-media">
                    {image && (
                      <Image
                        src={image}
                        alt={product.name[locale]}
                        fill
                        sizes="(max-width: 768px) 64vw, 30vw"
                        style={{ objectFit: "cover", objectPosition: "top" }}
                      />
                    )}
                    <span className="spot-badge">{isSet ? t("spot_badge_set") : t("spot_badge_three")}</span>
                  </div>
                  <div className="spot-card-body">
                    <p className="spot-card-name">{product.name[locale]}</p>
                    <p className="spot-card-price">CHF {product.price.toFixed(2)}</p>
                    <span className="spot-card-cta">
                      {t("spot_cta")} <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
