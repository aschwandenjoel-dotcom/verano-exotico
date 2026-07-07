/**
 * Einfache Währungsumrechnung — ausschliesslich für die Kasse (Payment-Currency).
 * Alle Preise sind intern und in der Datenbank IMMER in CHF gespeichert; hier
 * wird nur der an der Kasse gewählte Zahlungsbetrag umgerechnet, damit die
 * Kundin weiss, wie viel sie in ihrer Wunschwährung überweisen soll (das
 * Neon-Geschäftskonto rechnet eingehende Fremdwährung automatisch in CHF um).
 *
 * Kurse sind statisch hinterlegt (kein Live-API-Call) und sollten gelegentlich
 * aktualisiert werden — hier den `rate`-Wert anpassen (Einheiten Fremdwährung
 * pro 1 CHF).
 */

export interface Currency {
  code: string;
  symbol: string;
  /** Wie viele Einheiten dieser Währung entsprechen 1 CHF. */
  rate: number;
}

export const CURRENCIES: Currency[] = [
  { code: "CHF", symbol: "CHF", rate: 1 },
  { code: "EUR", symbol: "€", rate: 1.06 },
  { code: "USD", symbol: "$", rate: 1.13 },
  { code: "GBP", symbol: "£", rate: 0.88 },
  { code: "CAD", symbol: "CA$", rate: 1.55 },
  { code: "AUD", symbol: "AU$", rate: 1.72 },
];

export const DEFAULT_CURRENCY = "CHF";

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

/** Rechnet einen CHF-Betrag in die Zielwährung um. */
export function convert(amountChf: number, currencyCode: string): number {
  const currency = getCurrency(currencyCode);
  return amountChf * currency.rate;
}

/** Formatiert einen CHF-Betrag in der Zielwährung, z. B. "€ 32.10". */
export function formatPrice(amountChf: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode);
  const value = convert(amountChf, currencyCode);
  return `${currency.symbol} ${value.toFixed(2)}`;
}
