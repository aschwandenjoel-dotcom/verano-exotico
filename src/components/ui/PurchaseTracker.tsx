"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getConsent, getServerConsent, subscribe } from "@/lib/consent";
import { trackPurchase, type Purchase } from "@/lib/googleTag";

/**
 * Meldet den Kauf an Google (Merchant Center, Schlüsselereignis "purchase") —
 * nur mit Zustimmung im Cookie-Hinweis. Stimmt jemand erst auf der
 * Bestätigungsseite zu, wird der Kauf dann noch gemeldet.
 */
export default function PurchaseTracker({ purchase }: { purchase: Purchase }) {
  const consent = useSyncExternalStore(subscribe, getConsent, getServerConsent);

  useEffect(() => {
    if (consent === "yes") trackPurchase(purchase);
  }, [consent, purchase]);

  return null;
}
