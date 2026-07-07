import ShopShell from "@/components/ui/ShopShell";
import CheckoutForm from "@/components/ui/CheckoutForm";
import type { Locale } from "@/types";

export const metadata = {
  title: "Kasse – Verano Exotico",
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <ShopShell locale={locale as Locale}>
      <div style={{ background: "#F8F3E8", minHeight: "100vh", padding: "110px 24px 80px" }}>
        <CheckoutForm locale={locale as Locale} />
      </div>
    </ShopShell>
  );
}
