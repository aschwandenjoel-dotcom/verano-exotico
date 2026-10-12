import { getTranslations } from "next-intl/server";
import VTLanding from "@/components/landing/VTLanding";
import { fetchProducts } from "@/lib/api";
import { getCategory } from "@/lib/categories";
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
  // Neueste zuerst; oben Bikinis (ohne Sets mit Rock/Kleid), unter den Bildkacheln Badeanzüge
  const all = (await fetchProducts())
    .filter((p) => !HOMEPAGE_HIDDEN_SLUGS.includes(p.slug))
    .reverse();
  const isSet = getCategory("bikini-sets")!.match;
  const bikinis = all.filter((p) => getCategory("bikinis")!.match(p) && !isSet(p)).slice(0, 8);
  const swimsuits = all.filter(getCategory("badeanzuege")!.match).slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />
      <VTLanding locale={locale as Locale} bikinis={bikinis} swimsuits={swimsuits} />
    </>
  );
}
