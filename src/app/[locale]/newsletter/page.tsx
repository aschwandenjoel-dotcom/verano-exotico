import Link from "next/link";
import { LegalPage } from "@/components/ui/LegalSections";
import type { Locale } from "@/types";

export const metadata = {
  title: "Newsletter – Verano Exotico",
  robots: { index: false },
};

const TEXT = {
  de: {
    bestaetigt: {
      title: "Du bist dabei",
      body: "Danke für die Bestätigung. Deine Willkommensmail ist unterwegs — schau in den nächsten Minuten in dein Postfach (notfalls im Spam-Ordner).",
    },
    abgemeldet: {
      title: "Abgemeldet",
      body: "Du bekommst keine Newsletter und Erinnerungen mehr von uns. Bestellbestätigungen und Versandinfos erhältst du weiterhin.",
    },
    ungueltig: {
      title: "Link ungültig",
      body: "Dieser Link ist nicht (mehr) gültig. Melde dich einfach auf der Startseite neu an oder schreib uns an veranoexotico@gmail.com.",
    },
    abmelden: {
      title: "Newsletter abmelden",
      body: "Möchtest du keine Newsletter und Erinnerungen mehr von Verano Exotico bekommen?",
      button: "Ja, abmelden",
    },
    back: "Zum Shop",
  },
  en: {
    bestaetigt: {
      title: "You're in",
      body: "Thanks for confirming. Your welcome email is on its way — check your inbox in the next few minutes (and your spam folder, just in case).",
    },
    abgemeldet: {
      title: "Unsubscribed",
      body: "You won't receive newsletters or reminders from us anymore. Order confirmations and shipping updates will still reach you.",
    },
    ungueltig: {
      title: "Invalid link",
      body: "This link is no longer valid. Just sign up again on the homepage or write to us at veranoexotico@gmail.com.",
    },
    abmelden: {
      title: "Unsubscribe",
      body: "Don't want to receive newsletters and reminders from Verano Exotico anymore?",
      button: "Yes, unsubscribe",
    },
    back: "Back to the shop",
  },
} as const;

const buttonStyle = {
  display: "inline-block",
  marginTop: "24px",
  padding: "14px 28px",
  background: "#1A3040",
  color: "#F8F3E8",
  border: "none",
  borderRadius: "9999px",
  fontSize: "12px",
  fontFamily: "var(--font-archivo-black), sans-serif",
  fontWeight: 900,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  textDecoration: "none",
  cursor: "pointer",
};

/**
 * Statusseite für Bestätigung und Abmeldung. Die Abmeldung selbst passiert per
 * POST über den Knopf — siehe /api/newsletter/unsubscribe.
 */
export default async function NewsletterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ s?: string; a?: string; t?: string }>;
}) {
  const { locale } = await params;
  const { s, a, t: token } = await searchParams;
  const text = TEXT[locale === "en" ? "en" : "de"];

  const showUnsubscribeForm = a === "abmelden" && !!token;
  const state =
    s === "bestaetigt" || s === "abgemeldet" || s === "ungueltig" ? text[s] : showUnsubscribeForm ? text.abmelden : text.ungueltig;

  return (
    <LegalPage locale={locale as Locale} eyebrow="Newsletter" title={state.title}>
      <p style={{ fontSize: "16px" }}>{state.body}</p>
      {showUnsubscribeForm && !s ? (
        <form method="post" action="/api/newsletter/unsubscribe">
          <input type="hidden" name="t" value={token} />
          <input type="hidden" name="von" value="seite" />
          <button type="submit" style={buttonStyle}>{text.abmelden.button}</button>
        </form>
      ) : (
        <Link href={`/${locale}`} style={buttonStyle}>{text.back}</Link>
      )}
    </LegalPage>
  );
}
