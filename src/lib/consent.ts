/**
 * Entscheidung zur Reichweitenmessung — gemeinsamer Zustand für das Banner
 * (CookieConsent) und den Widerruf-Link in der Datenschutzerklärung
 * (ConsentReset).
 *
 * Gespeichert wird in localStorage, nicht in einem Cookie: Die Angabe bleibt
 * auf dem Gerät und wird nie an den Server geschickt. Jeder Zugriff ist
 * abgesichert — in privaten Fenstern oder bei gesperrtem Speicher wirft der
 * Browser, dann gilt "noch nicht entschieden".
 */
export type Consent = "yes" | "no" | "none";

const KEY = "ve-consent";
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  // Zweites Tab / anderes Fenster desselben Browsers
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function getConsent(): Consent {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "yes" || v === "no" ? v : "none";
  } catch {
    return "none";
  }
}

/** Serverseitig ist die Entscheidung unbekannt — dann wird nichts gerendert. */
export function getServerConsent(): Consent | "unknown" {
  return "unknown";
}

export function setConsent(value: "yes" | "no") {
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    /* ignorieren */
  }
  notify();
}

export function resetConsent() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignorieren */
  }
  notify();
}
