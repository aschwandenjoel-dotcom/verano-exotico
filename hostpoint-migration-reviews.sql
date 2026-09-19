-- ============================================================
-- Migration: Bewertungsanfrage nach Lieferung
-- Einmalig über phpMyAdmin (Hostpoint) auf der bestehenden Datenbank ausführen.
-- Danach entspricht die DB wieder hostpoint-schema.sql.
--
-- MariaDB kennt kein "add column if not exists" in allen Versionen — falls eine
-- Spalte schon existiert, meldet MySQL "Duplicate column name" und die Zeile
-- kann übersprungen werden.
-- ============================================================

-- Wann ging das Paket raus? Basis für den Versandzeitpunkt der Bewertungs-Mail.
alter table orders add column shipped_at datetime;

-- Verhindert, dass dieselbe Bestellung mehrfach angeschrieben wird.
alter table orders add column review_request_sent_at datetime;

-- Bewertung stammt aus einer echten Bestellung (Link aus der Bewertungs-Mail).
alter table reviews add column order_id char(36);
alter table reviews add column verified boolean default false;

-- Eine Bewertung je Artikel und Bestellung. NULL-order_id bleibt mehrfach
-- erlaubt (MySQL/MariaDB ignorieren NULLs im Unique-Key) — freie Bewertungen
-- ohne Bestellbezug funktionieren also weiterhin.
alter table reviews add unique key uniq_review_order_product (order_id, product_slug);

-- Bereits versandte Bestellungen bekommen rückwirkend KEIN shipped_at:
-- sie bleiben ohne Bewertungsanfrage. Wer sie trotzdem anschreiben will,
-- setzt shipped_at manuell, z. B.:
--   update orders set shipped_at = updated_at
--   where status = 'shipped' and shipped_at is null;
