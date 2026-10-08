import { getTranslations } from "next-intl/server";
import VTLanding from "@/components/landing/VTLanding";
import { fetchLatestProducts } from "@/lib/api";
import { organizationJsonLd, pageMetadata } from "@/lib/seo";
import type { Locale } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return pageMetadata(locale, "", t("home_title"), t("home_description"));
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const HOMEPAGE_HIDDEN_SLUGS = ["safari-leopard"];
  const fetched = await fetchLatestProducts(6 + HOMEPAGE_HIDDEN_SLUGS.length);
  const products = fetched
    .filter((p) => !HOMEPAGE_HIDDEN_SLUGS.includes(p.slug))
    .slice(0, 6);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />
      <VTLanding locale={locale as Locale} products={products} />
    </>
  );
}
