import Link from "next/link";
import { notFound } from "next/navigation";
import CollectionGrid from "@/components/sections/CollectionGrid";
import ShopShell from "@/components/ui/ShopShell";
import { fetchProducts } from "@/lib/api";
import { CATEGORIES, getCategory, productsInCategory } from "@/lib/categories";
import { categoryJsonLd, pageMetadata } from "@/lib/seo";
import type { Locale } from "@/types";

// Nur die definierten Kategorien — alles andere unter /de/<x> bleibt 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return (["de", "en"] as const).flatMap((locale) =>
    CATEGORIES.map((c) => ({ locale, category: c.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category: slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  const text = category[locale as Locale];
  return pageMetadata(locale, `/${slug}`, text.title, text.description);
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const loc = locale as Locale;
  const text = category[loc];
  const products = productsInCategory(category, await fetchProducts());
  const others = CATEGORIES.filter((c) => c.slug !== slug);

  return (
    <ShopShell locale={loc}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd(loc, slug, text.h1, products)) }}
      />
      <div style={{ background: "#F8F3E8" }}>
        <header className="max-w-6xl mx-auto px-6 md:px-10 pt-32 pb-10 text-center">
          <nav aria-label="Breadcrumb" className="text-[10px] font-mono uppercase tracking-[0.25em] mb-6" style={{ color: "rgba(26,48,64,0.45)" }}>
            <Link href={`/${loc}/collection`} style={{ color: "inherit" }}>Shop</Link>
            <span className="mx-2">/</span>
            <span>{text.h1}</span>
          </nav>
          <h1
            style={{
              fontFamily: "var(--font-archivo-black), sans-serif",
              fontSize: "clamp(2.2rem, 6vw, 4.5rem)",
              lineHeight: 0.95,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              color: "#1A3040",
            }}
          >
            {text.h1}
          </h1>
          <p className="mt-5 mx-auto max-w-2xl text-sm md:text-base leading-relaxed" style={{ color: "rgba(26,48,64,0.7)" }}>
            {text.intro}
          </p>
        </header>

        <CollectionGrid products={products} locale={loc} showFilters={false} />

        <section className="max-w-3xl mx-auto px-6 md:px-10 py-16 space-y-10">
          {text.sections.map((s) => (
            <div key={s.heading}>
              <h2
                className="mb-3"
                style={{
                  fontFamily: "var(--font-archivo-black), sans-serif",
                  fontSize: "clamp(1rem, 2vw, 1.25rem)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#1A3040",
                }}
              >
                {s.heading}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(26,48,64,0.7)" }}>
                {s.body}
              </p>
            </div>
          ))}

          <div>
            <h2 className="text-xs font-mono uppercase tracking-[0.25em] mb-4" style={{ color: "#5E7A8A" }}>
              {loc === "de" ? "Weitere Kategorien" : "More categories"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {others.map((c) => (
                <Link
                  key={c.slug}
                  href={`/${loc}/${c.slug}`}
                  className="px-4 py-2 text-xs font-mono rounded-full"
                  style={{ border: "1px solid rgba(26,48,64,0.2)", color: "#1A3040" }}
                >
                  {c[loc].label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </ShopShell>
  );
}
