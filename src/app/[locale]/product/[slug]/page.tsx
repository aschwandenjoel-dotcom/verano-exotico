import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ShopShell from "@/components/ui/ShopShell";
import BackButton from "@/components/ui/BackButton";
import ProductView from "@/components/ui/ProductView";
import ReviewSection from "@/components/ui/ReviewSection";
import { fetchProductBySlug, fetchProducts } from "@/lib/api";
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
  const image = product.colorImages?.[0] ?? product.images?.[0];
  return {
    title,
    description,
    alternates: {
      languages: { de: `/de/product/${slug}`, en: `/en/product/${slug}` },
    },
    openGraph: {
      title,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
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

  // Strukturierte Daten für Google (Preis, Verfügbarkeit, Bilder)
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const images = [...(product.colorImages ?? []), ...(product.images ?? [])]
    .filter(Boolean)
    .slice(0, 6)
    .map((img) => `${base}${img}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name[loc],
    description: product.description[loc],
    image: images,
    brand: { "@type": "Brand", name: "Verano Exotico" },
    offers: {
      "@type": "Offer",
      url: `${base}/${loc}/product/${product.slug}`,
      priceCurrency: "CHF",
      price: product.price.toFixed(2),
      availability: "https://schema.org/InStock",
    },
  };

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

      <ReviewSection productSlug={product.slug} />
      <div className="pb-20" style={{ background: "#F8F3E8" }} />
    </ShopShell>
  );
}
