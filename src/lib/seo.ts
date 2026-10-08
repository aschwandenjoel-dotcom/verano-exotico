import type { Metadata } from "next";
import { calcShipping } from "@/lib/shipping";
import type { Locale, Product } from "@/types";

/**
 * Gemeinsame SEO-Bausteine: Canonical + hreflang pro Seite, Open-Graph-Defaults
 * und die strukturierten Daten (JSON-LD) für Google.
 *
 * Wichtig: Next.js ersetzt `openGraph`/`alternates` einer Seite komplett statt
 * sie mit dem Layout zu mischen — deshalb setzt pageMetadata() alles selbst.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const SITE_NAME = "Verano Exotico";

const OG_IMAGE = { url: "/images/og-image.jpg", width: 1200, height: 630, alt: SITE_NAME };

export const SOCIAL_PROFILES = [
  "https://www.instagram.com/veranoexotico/",
  "https://www.pinterest.com/veranoexotico/",
];

interface PageMetaOptions {
  /** Seite existiert nur auf Deutsch (Rechtstexte, FAQ): /en verweist per Canonical auf /de. */
  germanOnly?: boolean;
  /** Bild für Social-Vorschau, sonst das allgemeine OG-Bild. */
  image?: string;
  noindex?: boolean;
}

/** `path` ohne Sprachpräfix, z. B. "" (Startseite), "/faq" oder "/product/marea-bikini". */
export function pageMetadata(
  locale: string,
  path: string,
  title: string,
  description: string,
  { germanOnly = false, image, noindex = false }: PageMetaOptions = {}
): Metadata {
  const url = `/${germanOnly ? "de" : locale}${path}`;
  const images = image ? [{ url: image, alt: title }] : [OG_IMAGE];
  return {
    title,
    description,
    alternates: germanOnly
      ? { canonical: url }
      : {
          canonical: url,
          languages: { de: `/de${path}`, en: `/en${path}`, "x-default": `/de${path}` },
        },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url,
      locale: locale === "de" ? "de_CH" : "en_US",
      images,
    },
    twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Erster Absatz eines Produkttexts als Fliesstext (für Meta-Beschreibung). */
export function firstParagraph(text: string | undefined, max = 160): string {
  const para = (text ?? "").split(/\n\s*\n/)[0].replace(/\s+/g, " ").trim();
  return para.length <= max ? para : `${para.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

/** Produkttext ohne Aufzählungszeichen, Zeilen zu Sätzen (für JSON-LD/Feeds). */
export function plainText(text: string | undefined): string {
  return (text ?? "")
    .split("\n")
    .map((l) => l.trim().replace(/^[–-]\s+/, ""))
    .filter(Boolean)
    .map((l) => (/[.!?…]$/.test(l) ? l : `${l}.`))
    .join(" ");
}

/** Shop als Organisation + Website — einmal auf der Startseite. */
export function organizationJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/images/brand-logo.png`,
      image: `${SITE_URL}${OG_IMAGE.url}`,
      sameAs: SOCIAL_PROFILES,
      areaServed: "CH",
      currenciesAccepted: "CHF",
      paymentAccepted: "TWINT, Kreditkarte",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: ["de-CH", "en"],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ];
}

/** Produkt + Breadcrumb. Versand wie im Merchant-Center-Feed (Schweiz, 1 Artikel). */
export function productJsonLd(product: Product, locale: Locale) {
  const url = `${SITE_URL}/${locale}/product/${product.slug}`;
  const images = [...(product.colorImages ?? []), ...(product.images ?? [])]
    .filter(Boolean)
    .filter((img, i, all) => all.indexOf(img) === i)
    .slice(0, 6)
    .map((img) => (img.startsWith("http") ? img : `${SITE_URL}${img}`));

  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${url}#product`,
      name: product.name[locale],
      description: plainText(product.description[locale]),
      sku: product.slug,
      url,
      image: images,
      brand: { "@type": "Brand", name: SITE_NAME },
      ...(product.material?.[locale] ? { material: product.material[locale] } : {}),
      ...(product.colorNames?.[locale]?.length ? { color: product.colorNames[locale].join(", ") } : {}),
      ...(product.sizes?.length ? { size: product.sizes.join(", ") } : {}),
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "CHF",
        price: product.price.toFixed(2),
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: { "@type": "MonetaryAmount", value: calcShipping("CH", 1).toFixed(2), currency: "CHF" },
          shippingDestination: { "@type": "DefinedRegion", addressCountry: "CH" },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
            transitTime: { "@type": "QuantitativeValue", minValue: 5, maxValue: 11, unitCode: "DAY" },
          },
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/${locale}` },
        { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/${locale}/collection` },
        { "@type": "ListItem", position: 3, name: product.name[locale], item: url },
      ],
    },
  ];
}

/** Kategorieseite: Produktliste + Breadcrumb. */
export function categoryJsonLd(locale: Locale, slug: string, name: string, products: Product[]) {
  const url = `${SITE_URL}/${locale}/${slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name,
      url,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: products.length,
        itemListElement: products.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE_URL}/${locale}/product/${p.slug}`,
          name: p.name[locale],
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/${locale}` },
        { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/${locale}/collection` },
        { "@type": "ListItem", position: 3, name, item: url },
      ],
    },
  ];
}
