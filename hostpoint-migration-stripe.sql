-- ============================================================
-- Migration: Umstellung von Vorkasse auf Stripe
-- Einmalig über phpMyAdmin (Hostpoint) auf der bestehenden Datenbank ausführen.
--
-- Beide Spalten dienen nur der Nachvollziehbarkeit im Admin und im
-- Stripe-Dashboard. Der Bezahlvorgang funktioniert auch ohne sie: Der Webhook
-- findet die Bestellung über die Stripe-Metadaten, nicht über diese Spalten.
-- ============================================================

alter table orders add column stripe_session_id varchar(255);
alter table orders add column stripe_payment_intent varchar(255);

-- Wiederfinden einer Bestellung anhand der Stripe-Referenz
create index idx_orders_stripe_session on orders (stripe_session_id);

-- Hinweis zu Bestellstatus:
-- Neu hinzu kommt der Status 'payment_failed' — Bestellungen, bei denen die
-- Bezahlseite nicht erstellt werden konnte oder eine verzögerte Zahlung
-- fehlgeschlagen ist. Die Spalte `status` ist ein varchar, es ist also keine
-- Schema-Änderung nötig.
