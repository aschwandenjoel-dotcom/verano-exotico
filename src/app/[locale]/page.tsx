import VTLanding from "@/components/landing/VTLanding";
import { fetchLatestProducts } from "@/lib/api";
import type { Locale } from "@/types";

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

  return <VTLanding locale={locale as Locale} products={products} />;
}
