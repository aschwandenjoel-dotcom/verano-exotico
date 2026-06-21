import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ShopShell from "@/components/ui/ShopShell";
import BackButton from "@/components/ui/BackButton";
import ProductGallery from "@/components/ui/ProductGallery";
import ProductDetail from "@/components/ui/ProductDetail";
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
  return { title: `${product.name[locale as Locale]} — Verano Exotico` };
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

  return (
    <ShopShell locale={loc}>
      <div className="pt-24 pb-20 px-6 md:px-10" style={{ background: "#F8F3E8" }}>
        <div className="max-w-6xl mx-auto">
          <BackButton />
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <ProductGallery product={product} locale={loc} />
          <ProductDetail
            product={product}
            locale={loc}
            labels={{
              color: t("color"),
              size: t("size"),
              addToCart: t("add_to_cart"),
              sizeGuide: t("size_guide"),
              details: t("details"),
              material: t("material"),
              care: t("care"),
              measurements: t("measurements"),
              shipping: t("shipping"),
            }}
          />
        </div>
      </div>

      <ReviewSection productSlug={product.slug} />
      <div className="pb-20" style={{ background: "#F8F3E8" }} />
    </ShopShell>
  );
}
