import QRCode from "qrcode";

/**
 * Schweizer QR-Rechnung (Swiss Payment Standards, SIX). Codiert IBAN,
 * Empfänger, Betrag und eine Zahlungsmitteilung so, dass Banking-Apps
 * (inkl. Neon) den Zahlungsauftrag automatisch ausfüllen können.
 *
 * Referenztyp ist bewusst "NON" (keine strukturierte Referenz), da wir eine
 * normale IBAN und keine spezielle QR-IBAN haben — die Bestellreferenz steht
 * stattdessen in der unstrukturierten Mitteilung. Laut Spezifikation ist der
 * Betrag nur in CHF ODER EUR zulässig — für alle anderen Zahlungswährungen
 * (USD/GBP/CAD/AUD) gibt es deshalb keinen QR-Code, nur die manuelle
 * Überweisung. Bei EUR wird der EUR-Betrag codiert (1:1, keine Umrechnung
 * durch uns nötig), bei CHF der CHF-Betrag.
 */

export type SwissQrCurrency = "CHF" | "EUR";

interface SwissQrParams {
  iban: string;
  creditorName: string;
  creditorStreet: string;
  creditorZip: string;
  creditorCity: string;
  /** ISO-3166 Alpha-2, z. B. "CH" */
  creditorCountry: string;
  /** Betrag in `currency` */
  amount: number;
  /** Nur "CHF" oder "EUR" — andere Währungen lässt die Spezifikation nicht zu. */
  currency: SwissQrCurrency;
  /** Freitext, z. B. "Bestellung VE-42" */
  message: string;
}

function buildPayload({
  iban,
  creditorName,
  creditorStreet,
  creditorZip,
  creditorCity,
  creditorCountry,
  amount,
  currency,
  message,
}: SwissQrParams): string {
  const lines = [
    "SPC", // QRType
    "0200", // Version
    "1", // Coding: UTF-8
    iban.replace(/\s/g, ""),
    "K", // Adresstyp: kombiniert (unstrukturiert)
    creditorName,
    creditorStreet,
    `${creditorZip} ${creditorCity}`,
    "",
    "",
    creditorCountry,
    // UltmtCdtr (7 leere Zeilen, reserviert)
    "", "", "", "", "", "", "",
    amount.toFixed(2),
    currency,
    // UltmtDbtr (7 leere Zeilen, Zahlerin unbekannt)
    "", "", "", "", "", "", "",
    "NON", // Referenztyp
    "", // keine strukturierte Referenz
    message.slice(0, 140),
    "EPD", // Trailer
  ];
  return lines.join("\r\n");
}

/** Rendert die Schweizer QR-Rechnung als PNG-Buffer. */
export async function renderSwissQrPng(params: SwissQrParams): Promise<Buffer> {
  const payload = buildPayload(params);
  return QRCode.toBuffer(payload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 400,
  });
}

/** Rendert die Schweizer QR-Rechnung als data:-URI (für serverseitiges Rendering ohne Datei). */
export async function renderSwissQrDataUrl(params: SwissQrParams): Promise<string> {
  const payload = buildPayload(params);
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 400,
  });
}
