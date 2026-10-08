import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import BrandStory from "@/components/sections/BrandStory";
import ShopShell from "@/components/ui/ShopShell";
import type { Locale } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return pageMetadata(locale, "/about", t("about_title"), t("about_description"));
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ShopShell locale={locale as Locale}>
      <div className="pt-16">
        <BrandStory />
      </div>
    </ShopShell>
  );
}
