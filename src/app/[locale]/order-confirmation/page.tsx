import Link from "next/link";
import ShopShell from "@/components/ui/ShopShell";
import ClearCartOnSuccess from "@/components/ui/ClearCartOnSuccess";
import type { Locale } from "@/types";

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { locale } = await params;
  const { session_id } = await searchParams;

  return (
    <ShopShell locale={locale as Locale}>
      <div
        style={{
          minHeight: "80vh",
          background: "#F8F3E8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "100%",
            background: "#FFFFFF",
            borderRadius: "24px",
            padding: "48px 40px",
            textAlign: "center",
            boxShadow: "0 8px 40px rgba(26,48,64,0.08)",
          }}
        >
          <ClearCartOnSuccess />
          {/* Icon */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(46,125,94,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2E7D5E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <p style={{ fontSize: "10px", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.2em", textTransform: "uppercase", color: "#2E7D5E", marginBottom: "12px" }}>
            Zahlung erfolgreich
          </p>
          <h1 style={{ fontSize: "24px", fontFamily: "var(--font-archivo-black),sans-serif", fontWeight: 900, textTransform: "uppercase", color: "#1A3040", marginBottom: "16px", lineHeight: 1.2 }}>
            Danke für deine Bestellung!
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(26,48,64,0.55)", lineHeight: 1.7, marginBottom: "32px", fontFamily: "var(--font-syne)" }}>
            Du erhältst in Kürze eine Bestätigungs-E-Mail. Wir bereiten deine Bestellung vor.
          </p>

          {session_id && (
            <p style={{ fontSize: "10px", fontFamily: "var(--font-geist-mono)", color: "rgba(26,48,64,0.3)", marginBottom: "32px", wordBreak: "break-all" }}>
              Ref: {session_id.slice(-8).toUpperCase()}
            </p>
          )}

          <Link
            href={`/${locale}/collection`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#1A3040",
              color: "#F8F3E8",
              borderRadius: "9999px",
              padding: "14px 32px",
              fontSize: "11px",
              fontFamily: "var(--font-archivo-black),sans-serif",
              fontWeight: 900,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            Weiter shoppen →
          </Link>
        </div>
      </div>
    </ShopShell>
  );
}
