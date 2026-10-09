import ShopShell from "@/components/ui/ShopShell";
import CheckoutForm from "@/components/ui/CheckoutForm";
import { ExpressCheckoutPage } from "@/components/ui/ExpressCheckout";
import { paymentMode } from "@/lib/stripe";
import type { Locale } from "@/types";

export const metadata = {
  title: "Kasse – Verano Exotico",
  robots: { index: false, follow: true },
};

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { locale } = await params;
  // `canceled=1` setzt Stripe beim Abbruch auf der Bezahlseite (cancel_url).
  const { canceled } = await searchParams;

  return (
    <ShopShell locale={locale as Locale}>
      <div style={{ background: "#F8F3E8", minHeight: "100vh", padding: "110px 24px 80px" }}>
        {/* Stripe erfasst Adresse und Zahlung selbst — das eigene Formular
            braucht es nur noch für die Vorkasse. */}
        {paymentMode() === "stripe" ? (
          <ExpressCheckoutPage locale={locale as Locale} canceled={canceled === "1"} />
        ) : (
          <CheckoutForm locale={locale as Locale} paymentMode="prepay" canceled={canceled === "1"} />
        )}
      </div>
    </ShopShell>
  );
}
