-- ============================================================
-- Migration: Newsletter mit Bestätigung (Double-Opt-in), Willkommensrabatt
-- und Erinnerung bei abgebrochenem Kauf
-- Einmalig über phpMyAdmin (Hostpoint) auf der bestehenden Datenbank ausführen.
-- Danach entspricht die DB wieder hostpoint-schema.sql.
--
-- Falls eine Spalte schon existiert, meldet MySQL "Duplicate column name" —
-- die Zeile kann dann übersprungen werden.
-- ============================================================

-- Einweg-Token für Bestätigungs- und Abmeldelink (kein Login nötig)
alter table newsletter_subscribers add column token char(32);
-- 'form' = Anmeldefeld auf der Website, 'checkout' = Häkchen beim Bestellen
alter table newsletter_subscribers add column source varchar(20) default 'form';
-- Erst ab hier gilt die Anmeldung — Nachweis der Einwilligung
alter table newsletter_subscribers add column confirmed_at datetime;
-- Wann zuletzt eine Bestätigungsmail rausging (Schutz vor Mail-Bombing)
alter table newsletter_subscribers add column confirm_sent_at datetime;
alter table newsletter_subscribers add column unsubscribed_at datetime;
-- Persönlicher Rabattcode aus der Willkommensmail (Stripe-Promotion-Code)
alter table newsletter_subscribers add column welcome_code varchar(40);
alter table newsletter_subscribers add column welcome_sent_at datetime;

-- Bestehende Anmeldungen bekommen ein Token, damit sie sich abmelden können.
-- Sie bleiben unbestätigt (confirmed_at NULL) und erhalten keine Newsletter,
-- bis sie sich erneut anmelden.
update newsletter_subscribers
   set token = replace(uuid(), '-', '')
 where token is null;

create unique index uniq_newsletter_token on newsletter_subscribers (token);

-- Häkchen "Newsletter & Erinnerung" im Bestellformular. Nur mit diesem
-- Häkchen gibt es eine Erinnerungsmail bei abgebrochener Zahlung.
alter table orders add column marketing_consent boolean default false;
alter table orders add column recovery_email_sent_at datetime;
-- Rabatt aus einem Stripe-Gutscheincode, in CHF (subtotal ist bereits abzüglich Rabatt)
alter table orders add column discount_amount decimal(10,2);
