/**
 * CJ Dropshipping API v2 Client
 * Doku: https://developers.cjdropshipping.com/en/api/
 *
 * CJ liefert standardmässig BLIND (keine CJ-Rechnung, kein CJ-Absender im Paket).
 * Eigenes Branding/Logo wird im CJ-Dashboard unter "Print on Demand / Branding"
 * bzw. den Account-Einstellungen konfiguriert, nicht über die API.
 */

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

// ── Token-Caching (im Speicher; überlebt keinen Cold-Start, wird dann neu geholt) ──
let cachedToken: { token: string; expiresAt: number } | null = null;

async function cjFetch<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { auth = true, headers, ...rest } = init;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };
  if (auth) finalHeaders["CJ-Access-Token"] = await getAccessToken();

  const res = await fetch(`${CJ_BASE}${path}`, { ...rest, headers: finalHeaders });
  const json = (await res.json()) as { result?: boolean; code?: number; message?: string; data?: T };

  // CJ liefert HTTP 200 auch bei Fehlern → result/code prüfen
  if (json.result === false || (json.code !== undefined && json.code !== 200)) {
    throw new Error(`CJ API Fehler (${path}): ${json.message ?? "unbekannt"} [code ${json.code}]`);
  }
  return json.data as T;
}

async function getAccessToken(): Promise<string> {
  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) throw new Error("CJ_API_KEY ist nicht gesetzt");

  // Manuell gesetzter Token hat Vorrang (z.B. für lokale Tests)
  if (process.env.CJ_ACCESS_TOKEN) return process.env.CJ_ACCESS_TOKEN;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const data = await cjFetch<{ accessToken: string; accessTokenExpiryDate: string }>(
    "/authentication/getAccessToken",
    { method: "POST", auth: false, body: JSON.stringify({ apiKey }) }
  );

  cachedToken = {
    token: data.accessToken,
    expiresAt: new Date(data.accessTokenExpiryDate).getTime(),
  };
  return data.accessToken;
}

// ── Bestellung anlegen ───────────────────────────────────────────
export interface CjOrderProduct {
  vid: string; // CJ Varianten-ID (pro Farbe/Grösse)
  quantity: number;
}

export interface CreateCjOrderParams {
  orderNumber: string; // eindeutig — verhindert Doppelbestellung bei Webhook-Retry
  shippingCustomerName: string;
  shippingCountryCode: string; // ISO-2, z.B. "CH"
  shippingCountry: string; // voller Ländername, z.B. "Switzerland" — von CJ verlangt
  shippingProvince: string;
  shippingCity: string;
  shippingAddress: string;
  shippingPhone: string;
  shippingZip: string;
  products: CjOrderProduct[];
  logisticName?: string;
  fromCountryCode?: string;
}

export async function createCjOrder(params: CreateCjOrderParams): Promise<{ orderId: string; orderStatus: string }> {
  return cjFetch("/shopping/order/createOrderV2", {
    method: "POST",
    body: JSON.stringify({
      logisticName: process.env.CJ_LOGISTIC_NAME ?? "CJPacket Ordinary",
      fromCountryCode: process.env.CJ_FROM_COUNTRY_CODE ?? "CN",
      ...params,
    }),
  });
}

// ── Bestelldetails / Tracking abfragen ───────────────────────────
export interface CjOrderDetail {
  orderId: string;
  orderStatus: string; // CREATED | UNPAID | UNSHIPPED | SHIPPED | DELIVERED | CANCELLED
  trackNumber?: string;
  trackingProvider?: string;
}

export async function getCjOrderDetail(orderId: string): Promise<CjOrderDetail> {
  return cjFetch(`/shopping/order/getOrderDetail?orderId=${encodeURIComponent(orderId)}`, {
    method: "GET",
  });
}
