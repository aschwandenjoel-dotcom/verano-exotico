import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ShopShell from "@/components/ui/ShopShell";
import ProductGallery from "@/components/ui/ProductGallery";
import ReviewSection from "@/components/ui/ReviewSection";
import { getProductBySlug, products } from "@/lib/products";
import type { Locale } from "@/types";

export async function generateStaticParams() {
  return products.flatMap((p) =>
    (["de", "en"] as Locale[]).map((locale) => ({ locale, slug: p.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return { title: `${product.name[locale as Locale]} — Verano Exotico` };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) notFound();

  const t = await getTranslations({ locale, namespace: "product" });
  const loc = locale as Locale;

  return (
    <ShopShell locale={loc}>
      <div className="bg-bg-dark pt-24 pb-20 px-6 md:px-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Image gallery (client component) */}
          <ProductGallery product={product} locale={loc} />

          {/* Product info */}
          <div className="pt-4 md:pt-8">
            <p className="text-xs font-mono tracking-widest text-text-muted uppercase mb-3">
              {product.category}
            </p>
            <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-4">
              {product.name[loc]}
            </h1>
            <p className="text-3xl font-bold text-primary mb-8">CHF {product.price}</p>

            {/* Color swatches */}
            {product.colors.length > 0 && (
              <div className="mb-8">
                <p className="text-xs font-mono tracking-widest text-text-muted uppercase mb-3">
                  {t("color")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color, i) => {
                    const name = product.colorNames?.[loc]?.[i];
                    return (
                      <div key={color} className="group relative">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-white/20 cursor-pointer hover:scale-110 transition-transform"
                          style={{ background: color }}
                        />
                        {name && (
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-surface border border-white/10 text-[10px] font-mono text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
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
                <p className="text-xs font-mono tracking-widest text-text-muted uppercase mb-3">
                  {t("size")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className="px-4 py-2 rounded-lg border border-white/20 text-xs font-mono text-text-primary hover:border-white/60 hover:bg-white/5 transition-all"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button className="w-full py-4 rounded-full bg-primary text-white font-semibold text-base hover:bg-primary/80 transition-colors mb-4">
              {t("add_to_cart")}
            </button>
            <button className="w-full py-4 rounded-full border border-white/20 text-text-primary font-semibold text-base hover:border-white/50 transition-colors mb-10">
              {t("size_guide")}
            </button>

            {/* Details */}
            <div className="space-y-6 border-t border-white/10 pt-8">
              {[
                { label: t("details"), content: product.description[loc] },
                { label: t("material"), content: product.material[loc] },
                { label: t("care"), content: product.care[loc] },
                ...(product.measurements
                  ? [{ label: t("measurements"), content: product.measurements[loc] }]
                  : []),
              ].map(({ label, content }) => (
                <div key={label}>
                  <h3 className="text-sm font-mono font-bold text-text-muted uppercase tracking-widest mb-2">
                    {label}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">{content}</p>
                </div>
              ))}
            </div>

            <p className="mt-8 text-xs font-mono text-text-muted/60 text-center">
              {t("shipping")}
            </p>
          </div>
        </div>
      </div>

      <ReviewSection productSlug={product.slug} />
      <div className="pb-20" />
    </ShopShell>
  );
}
