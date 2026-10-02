/**
 * Willkommensangebot für Newsletter-Anmeldungen. Eigene Datei ohne
 * Server-Importe, damit auch das Anmeldeformular (Client) den Wert anzeigen
 * kann — Website-Text und Rabattcode stimmen so immer überein.
 *
 * 0 = kein Rabattcode, die Willkommensmail kommt dann ohne Code.
 */
export const WELCOME_DISCOUNT_PERCENT = 10;

/** So lange ist der persönliche Code nach der Anmeldung einlösbar. */
export const WELCOME_CODE_VALID_DAYS = 60;
