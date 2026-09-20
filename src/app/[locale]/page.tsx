import VTLanding from "@/components/landing/VTLanding";
import { fetchLatestProducts, fetchProductsBySlugs } from "@/lib/api";
import type { Locale } from "@/types";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const HOMEPAGE_HIDDEN_SLUGS = ["safari-leopard"];
  const [fetched, highlights] = await Promise.all([
    fetchLatestProducts(6 + HOMEPAGE_HIDDEN_SLUGS.length),
    // Spotlight "Mehr als ein Bikini": die Ergaenzungen zum Bikini - Sets mit
    // Kleid/Rock und Dreiteiler. Reihenfolge = Reihenfolge auf der Seite.
    fetchProductsBySlugs([
      "costa-beach-dress-set",
      "esmeralda-threepiece-bikini",
      "costa-beach-dress-set-aquarell",
    ]),
  ]);
  const products = fetched
    .filter((p) => !HOMEPAGE_HIDDEN_SLUGS.includes(p.slug))
    .slice(0, 6);

  return <VTLanding locale={locale as Locale} products={products} highlights={highlights} />;
}
