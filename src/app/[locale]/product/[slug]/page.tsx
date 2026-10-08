import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ShopShell from "@/components/ui/ShopShell";
import BackButton from "@/components/ui/BackButton";
import ProductView from "@/components/ui/ProductView";
import ReviewSection from "@/components/ui/ReviewSection";
import CustomerVoices from "@/components/ui/CustomerVoices";
import { fetchProductBySlug, fetchProducts } from "@/lib/api";
import { pageMetadata, productJsonLd } from "@/lib/seo";
import type { Locale } from "@/types";

export async function generateStaticParams() {
  const products = await fetchProducts();
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
  const product = await fetchProductBySlug(slug);
  if (!product) return {};
  const loc = locale as Locale;
  const title = `${product.name[loc]} — Verano Exotico`;
  const description = (product.description[loc] ?? "").slice(0, 160);
  const image = product.colorImages?.[0] || product.images?.[0];
  return pageMetadata(locale, `/product/${slug}`, title, description, { image });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) notFound();

  const t = await getTranslations({ locale, namespace: "product" });
  const loc = locale as Locale;

  // Strukturierte Daten für Google (Preis, Versand, Bilder, Breadcrumb)
  const jsonLd = productJsonLd(product, loc);

  return (
    <ShopShell locale={loc}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="pt-24 pb-20 px-6 md:px-10" style={{ background: "#F8F3E8" }}>
        <div className="max-w-6xl mx-auto">
          <BackButton />
        </div>
        <ProductView
          product={product}
          locale={loc}
          labels={{
            color: t("color"),
            size: t("size"),
            selectSize: t("select_size"),
            addToCart: t("add_to_cart"),
            added: t("added"),
            sizeGuide: t("size_guide"),
            details: t("details"),
            material: t("material"),
            care: t("care"),
            measurements: t("measurements"),
            shipping: t("shipping"),
            trustShipping: t("trust_shipping"),
            trustReturns: t("trust_returns"),
            trustPayment: t("trust_payment"),
          }}
        />
      </div>

      {/* Käuferstimmen zu genau diesem Modell (CJ). Rendert nichts, solange es
          für den Slug keine Kommentare gibt — Import: node tools/cj-reviews.mjs */}
      <CustomerVoices locale={loc} slug={product.slug} />

      {/* Suspense: ReviewSection liest den Bewertungs-Token aus ?r= — ohne die
          Grenze müsste Next.js die ganze Produktseite dynamisch rendern. */}
      <Suspense fallback={null}>
        <ReviewSection productSlug={product.slug} />
      </Suspense>
      <div className="pb-20" style={{ background: "#F8F3E8" }} />
    </ShopShell>
  );
}
