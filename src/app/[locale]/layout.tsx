import type { Metadata } from "next";
import { Cormorant_Garamond, EB_Garamond, Jost } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/types";
import ClientProviders from "@/components/ui/ClientProviders";
import CookieConsent from "@/components/ui/CookieConsent";
import NewsletterPopup from "@/components/ui/NewsletterPopup";
import "../globals.css";

// Old-Money-Typografie (seit 13.11.2026). Die Variablennamen bleiben, damit
// bestehende Stellen weiter greifen: "archivo-black" = Titel, "dm-serif" =
// kursive Akzente, "syne" = Fliesstext, "geist-mono" = gesperrte Versal-Labels.
const syne = EB_Garamond({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

const archivoBlack = Cormorant_Garamond({
  weight: ["400", "500", "600"],
  variable: "--font-archivo-black",
  subsets: ["latin"],
  display: "swap",
});

const dmSerif = Cormorant_Garamond({
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-dm-serif",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Jost({
  weight: ["300", "400", "500"],
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    metadataBase: new URL(base),
    // Inhaber-Nachweise: Google Merchant Center / Search Console, Pinterest-Katalog.
    verification: {
      google: "YxSS3sAM_OByeW5eDyI_EA0Kz_X_sf4RqD4WAXsJnIU",
      other: { "p:domain_verify": "09ee50754cee25bb1ffb955151884e84" },
    },
    title: t("home_title"),
    description: t("home_description"),
    openGraph: {
      type: "website",
      siteName: "Verano Exotico",
      title: t("home_title"),
      description: t("home_description"),
      locale: locale === "de" ? "de_CH" : "en_US",
      images: [{ url: "/images/og-image.jpg", width: 1200, height: 630, alt: "Verano Exotico" }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("home_title"),
      description: t("home_description"),
      images: ["/images/og-image.jpg"],
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${syne.variable} ${archivoBlack.variable} ${dmSerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <ClientProviders>
            {children}
          </ClientProviders>
        </NextIntlClientProvider>
        {/* Hinweis auf die Reichweitenmessung; Vercel Web Analytics wird erst
            nach Zustimmung geladen (Besucher, Herkunft, Seitenaufrufe im
            Vercel-Dashboard unter "Analytics"). */}
        <NextIntlClientProvider messages={messages}>
          <CookieConsent />
          {/* Nach 2 Minuten auf der Seite (über Seitenwechsel hinweg) */}
          <NewsletterPopup />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
