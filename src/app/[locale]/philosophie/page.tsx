import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import Philosophy from "@/components/sections/Philosophy";
import ShopShell from "@/components/ui/ShopShell";
import type { Locale } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return pageMetadata(locale, "/philosophie", t("philosophy_title"), t("philosophy_description"));
}

export default async function PhilosophyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ShopShell locale={locale as Locale}>
      <div className="pt-[72px]">
        <Philosophy locale={locale as Locale} />
      </div>
    </ShopShell>
  );
}
