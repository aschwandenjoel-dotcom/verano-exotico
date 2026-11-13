-- Umfrage nach dem Kauf ("Wie hast du uns gefunden?") auf der Bestätigungsseite.
-- Einmal in phpMyAdmin (Hostpoint) ausführen. Ohne diese Spalte blendet die
-- Bestätigungsseite die Umfrage trotzdem ein, die Antwort wird aber nicht gespeichert.
alter table orders add column survey_source varchar(20) null;
alter table orders add column survey_answered_at datetime null;
