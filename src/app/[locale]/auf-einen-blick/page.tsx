import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { organizationJsonLd, pageMetadata, SITE_URL } from "@/lib/seo";
import { fetchProducts } from "@/lib/api";
import AboutFacts from "@/components/sections/AboutFacts";
import AiBadge from "@/components/ui/AiBadge";
import ShopShell from "@/components/ui/ShopShell";
import type { Locale } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return pageMetadata(locale, "/auf-einen-blick", t("glance_title"), t("glance_description"));
}

/** Kernfakten der Marke auf eigener Seite unter "Über uns": Kampagnenbild, darunter die Fakten. */
export default async function GlancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const products = await fetchProducts();
  const en = locale === "en";
  return (
    <ShopShell locale={locale as Locale} transparentHeader>
      {/* Marke als Organisation + Seite über sie – für Suchmaschinen und KI-Assistenten */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            ...organizationJsonLd(),
            {
              "@context": "https://schema.org",
              "@type": "AboutPage",
              url: `${SITE_URL}/${locale}/auf-einen-blick`,
              name: en ? "Verano Exotico at a glance" : "Verano Exotico auf einen Blick",
              inLanguage: en ? "en" : "de-CH",
              about: { "@id": `${SITE_URL}/#organization` },
              isPartOf: { "@id": `${SITE_URL}/#website` },
            },
          ]),
        }}
      />
      {/* Titelbild randlos unter dem durchsichtigen Header, Model mittig */}
      <div className="relative w-full aspect-[4/5] md:aspect-[2752/1536]" style={{ maxHeight: "100svh" }}>
        <Image
          src="/images/about/auf-einen-blick.jpg"
          alt={en ? "Model in the striped Rayas bikini between white houses with blue doors" : "Model im gestreiften Rayas-Bikini zwischen weissen Häusern mit blauen Türen"}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "50% 30%" }}
        />
        <div
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(5,25,35,0.35) 0%, rgba(5,25,35,0) 22%)" }}
        />
        <AiBadge inset={16} />
      </div>
      <div data-header-solid-from>
        <AboutFacts locale={locale as Locale} productCount={products.length} />
      </div>
    </ShopShell>
  );
}
