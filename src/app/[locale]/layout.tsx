import type { Metadata } from "next";
import { Syne, Archivo_Black, DM_Serif_Display } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/types";
import CursorGuard from "@/components/ui/CursorGuard";
import ClientProviders from "@/components/ui/ClientProviders";
import { Analytics } from "@vercel/analytics/next";
import "../globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

const archivoBlack = Archivo_Black({
  weight: "400",
  variable: "--font-archivo-black",
  subsets: ["latin"],
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-dm-serif",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
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
    // Inhaber-Nachweis für Google Merchant Center / Search Console.
    verification: { google: "YxSS3sAM_OByeW5eDyI_EA0Kz_X_sf4RqD4WAXsJnIU" },
    title: t("home_title"),
    description: t("home_description"),
    alternates: {
      languages: { de: "/de", en: "/en" },
    },
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
          <CursorGuard />
          <ClientProviders>
            {children}
          </ClientProviders>
        </NextIntlClientProvider>
        {/* Vercel Web Analytics: Besucher, Herkunft, Seitenaufrufe — im Vercel-Dashboard unter "Analytics" */}
        <Analytics />
      </body>
    </html>
  );
}
