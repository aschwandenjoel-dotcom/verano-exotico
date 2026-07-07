/**
 * Individuelle Versandkosten-Berechnung — weltweiter Versand.
 *
 * Modell: Distanz wird über drei Versandzonen abgebildet (CH/LI = nah, Europa,
 * Rest der Welt), dazu ein Zuschlag pro zusätzlichem Artikel. Der Betrag wird
 * im Checkout auf die Zwischensumme aufgeschlagen und dem Kunden VOR der
 * Bestellung angezeigt.
 *
 * Ausgeschlossen sind Länder, die von den internationalen Logistikpartnern
 * (CJ Dropshipping / CJPacket, ePacket, YunExpress usw.) aktuell nicht oder
 * nur eingeschränkt beliefert werden (Sanktionen bzw. ausgesetzte Dienste).
 *
 * Preise hier anpassen — Checkout, Bestätigungsseite, E-Mail und /versand-Seite
 * rechnen alle mit dieser einen Funktion.
 */

interface Zone {
  /** Grundpreis für den ersten Artikel (CHF) */
  base: number;
  /** Zuschlag pro weiterem Artikel (CHF) */
  perItem: number;
  /** Obergrenze pro Bestellung (CHF) */
  cap: number;
}

const ZONES = {
  near: { base: 4.9, perItem: 1.0, cap: 14.9 } as Zone,
  europe: { base: 7.9, perItem: 1.5, cap: 19.9 } as Zone,
  world: { base: 16.9, perItem: 3.5, cap: 34.9 } as Zone,
};

type ZoneKey = keyof typeof ZONES;

/** Schweiz / Liechtenstein — die nahe Zone. */
const NEAR_COUNTRIES = ["CH", "LI"];

/** Europa (EU + naher europäischer Raum) — mittlere Zone. */
const EUROPE_COUNTRIES = [
  "DE", "AT", "FR", "IT", "ES", "PT", "NL", "BE", "LU", "IE",
  "DK", "SE", "FI", "NO", "IS", "PL", "CZ", "SK", "HU", "SI",
  "HR", "GR", "RO", "BG", "EE", "LV", "LT", "MT", "CY", "GB",
  "AD", "MC", "SM", "VA", "UA", "MD", "RS", "ME", "MK", "AL", "BA",
];

/**
 * Von den Logistikpartnern derzeit nicht bzw. nicht zuverlässig belieferbare
 * Länder (Sanktionen oder ausgesetzte internationale Versanddienste).
 */
const EXCLUDED_COUNTRIES = ["KP", "IR", "SY", "CU", "RU", "BY", "AF"];

/** Rest der Welt — alle übrigen, nicht ausgeschlossenen ISO-3166-1-Alpha-2-Länder. */
const WORLD_COUNTRIES = [
  "US", "CA", "MX", "BR", "AR", "CL", "CO", "PE", "UY", "PY", "BO", "EC",
  "VE", "CR", "PA", "GT", "HN", "SV", "NI", "DO", "JM", "TT", "BS", "BB",
  "AG", "DM", "GD", "KN", "LC", "VC",
  "AU", "NZ", "FJ", "PG", "WS", "TO", "VU", "KI", "FM", "MH", "NR", "TV", "PW",
  "JP", "KR", "CN", "HK", "MO", "TW", "SG", "MY", "TH", "VN", "PH", "ID",
  "IN", "PK", "BD", "LK", "NP", "BT", "MV", "KH", "LA", "MM", "MN", "TL",
  "KZ", "UZ", "KG", "TJ", "TM", "GE", "AM", "AZ",
  "TR", "IL", "PS", "JO", "LB", "IQ", "SA", "AE", "QA", "KW", "BH", "OM", "YE",
  "EG", "MA", "DZ", "TN", "LY", "SD", "SS",
  "ZA", "NG", "KE", "GH", "ET", "TZ", "UG", "RW", "SN", "CI", "CM", "ML",
  "BF", "NE", "TD", "MZ", "ZM", "ZW", "BW", "NA", "AO", "MG", "MU", "SC",
  "GA", "CG", "CD", "BJ", "TG", "GN", "SL", "LR", "GM", "GW", "CV", "MR",
  "SO", "DJ", "ER", "BI", "MW", "LS", "SZ", "ST", "GQ", "KM",
];

export const SHIPPING_COUNTRIES = [
  ...NEAR_COUNTRIES,
  ...EUROPE_COUNTRIES,
  ...WORLD_COUNTRIES,
].filter((c) => !EXCLUDED_COUNTRIES.includes(c)) as readonly string[];

export type ShippingCountry = string;

function zoneFor(country: string): ZoneKey | null {
  if (NEAR_COUNTRIES.includes(country)) return "near";
  if (EUROPE_COUNTRIES.includes(country)) return "europe";
  if (WORLD_COUNTRIES.includes(country)) return "world";
  return null;
}

export function isShippingCountry(c: string): boolean {
  return SHIPPING_COUNTRIES.includes(c);
}

/** Versandkosten in CHF für ein Zielland und die Gesamtzahl der Artikel. */
export function calcShipping(country: string, itemCount: number): number {
  const key = zoneFor(country);
  if (!key || itemCount <= 0) return 0;
  const zone = ZONES[key];
  const cost = zone.base + Math.max(0, itemCount - 1) * zone.perItem;
  return Math.round(Math.min(cost, zone.cap) * 100) / 100;
}

/** Für die /versand-Seite: Übersicht der Zonen. */
export function shippingTable(): { countries: string; base: number; perItem: number; cap: number }[] {
  return [
    { countries: "Schweiz, Liechtenstein", ...ZONES.near },
    { countries: "Europa (EU, UK, Norwegen, Schweiz-Nachbarländer …)", ...ZONES.europe },
    { countries: "Weltweit (alle übrigen Länder)", ...ZONES.world },
  ];
}
