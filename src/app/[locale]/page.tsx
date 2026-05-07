import VTLanding from "@/components/landing/VTLanding";
import type { Locale } from "@/types";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <VTLanding locale={locale as Locale} />;
}
