"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import ProductCard from "@/components/ui/ProductCard";
import { products } from "@/lib/products";
import type { Locale } from "@/types";

interface Props {
  locale: Locale;
}

export default function CollectionPreview({ locale }: Props) {
  const t = useTranslations("collection");
  const featured = products.filter((p) => p.isNew).slice(0, 3);

  return (
    <section className="py-20 px-6 md:px-10 bg-bg-dark border-t border-white/8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[10px] font-mono tracking-[0.3em] text-tan uppercase mb-2">
              {t("filter_new")} — SS25
            </p>
            <h2
              className="font-black uppercase text-text-primary leading-none"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
            >
              {t("title")}
            </h2>
          </div>
          <Link
            href={`/${locale}/collection`}
            className="hidden md:inline-flex text-[10px] font-mono tracking-widest text-tan uppercase hover:text-cream transition-colors"
          >
            {t("subtitle")} →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-white/8">
          {featured.map((product) => (
            <ProductCard key={product.slug} product={product} locale={locale} />
          ))}
        </div>

        <div className="mt-8 md:hidden text-center">
          <Link
            href={`/${locale}/collection`}
            className="text-xs font-mono tracking-widest text-tan uppercase hover:text-cream"
          >
            {t("subtitle")} →
          </Link>
        </div>
      </div>
    </section>
  );
}
