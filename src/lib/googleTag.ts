/**
 * Google-Tag für die Kaufmessung im Google Merchant Center („Schlüsselereignisse").
 *
 * Wird NUR nach „Einverstanden" im Cookie-Hinweis geladen (CookieConsent ruft
 * loadGoogleTag auf). Ohne Zustimmung gibt es weder Script noch Cookies.
 * Personalisierte Werbung/Remarketing bleibt aus (ad_personalization: denied) —
 * gemessen wird nur, ob ein Klick aus Google zu einem Kauf geführt hat.
 *
 * Die Tag-ID stammt aus dem Merchant Center (Einstellungen → Conversion-
 * Einstellungen / Schlüsselereignisse → Google-Tag). Leer = Tracking aus.
 */
export const GOOGLE_TAG_ID = "GT-PJSWQM95";

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

let loaded = false;

export function loadGoogleTag(): void {
  if (loaded || !GOOGLE_TAG_ID || typeof window === "undefined") return;
  loaded = true;

  window.dataLayer = window.dataLayer || [];
  // gtag muss `arguments` pushen (kein Array) — so erwartet es gtag.js.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("consent", "default", {
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "denied",
    analytics_storage: "granted",
  });
  window.gtag("js", new Date());
  window.gtag("config", GOOGLE_TAG_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GOOGLE_TAG_ID)}`;
  document.head.appendChild(script);
}

export interface PurchaseItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
}

export interface Purchase {
  transaction_id: string;
  value: number;
  currency: string;
  items: PurchaseItem[];
}

const SENT_PREFIX = "ve-purchase-sent-";

/** Kauf einmal pro Bestellung melden — ein Neuladen der Bestätigung zählt nicht doppelt. */
export function trackPurchase(purchase: Purchase): void {
  if (!GOOGLE_TAG_ID || typeof window === "undefined") return;
  const key = SENT_PREFIX + purchase.transaction_id;
  try {
    if (window.localStorage.getItem(key)) return;
  } catch {
    /* Speicher gesperrt: lieber einmal zu viel als gar nicht */
  }
  loadGoogleTag();
  window.gtag?.("event", "purchase", purchase);
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    /* ignorieren */
  }
}
