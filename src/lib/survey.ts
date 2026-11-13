/** Antworten der Umfrage "Wie hast du uns gefunden?" (Client und Server). */
export const SURVEY_SOURCES = ["instagram", "tiktok", "google", "pinterest", "facebook", "friend", "other"] as const;
export type SurveySource = (typeof SURVEY_SOURCES)[number];
