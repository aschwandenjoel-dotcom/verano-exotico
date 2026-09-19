-- ============================================================
-- Verano Exotico — Hostpoint-MySQL-Schema (Ersatz für supabase-schema.sql)
-- Einmalig über phpMyAdmin / Hostpoint Control Panel > Datenbanken ausführen.
-- Erfordert MySQL/MariaDB mit JSON-Spaltentyp (MySQL 5.7.8+ / MariaDB 10.2+).
-- ============================================================

-- Produkte
create table if not exists products (
  id              char(36) primary key,
  slug            varchar(190) unique not null,
  name_de         varchar(200) not null,
  name_en         varchar(200) not null,
  price           decimal(10,2) not null,
  category        varchar(60) not null,
  is_new          boolean default false,
  colors          json,
  color_names_de  json,
  color_names_en  json,
  sizes           json,
  images          json,
  color_images    json,
  description_de  text,
  description_en  text,
  material_de     text,
  material_en     text,
  care_de         text,
  care_en         text,
  measurements_de text,
  measurements_en text,
  size_chart      json,
  active          boolean default true,
  created_at      datetime default current_timestamp
);

-- Bestellungen
create table if not exists orders (
  id                char(36) primary key,
  order_number      int auto_increment unique,
  status            varchar(30) default 'pending',
  customer_email    varchar(200) not null,
  customer_name     varchar(200),
  shipping_address  json,
  subtotal          decimal(10,2) not null,
  payment_currency  varchar(3) default 'CHF',
  payment_amount    decimal(10,2),
  locale            varchar(5) default 'de',
  stripe_session_id varchar(255),
  stripe_payment_intent varchar(255),
  cj_order_id       varchar(100),
  cj_order_status   varchar(60),
  fulfillment_error text,
  tracking_number   varchar(100),
  tracking_provider varchar(100),
  shipped_at        datetime,
  review_request_sent_at datetime,
  created_at        datetime default current_timestamp,
  updated_at        datetime default current_timestamp on update current_timestamp
);

-- Bestellpositionen
create table if not exists order_items (
  id           char(36) primary key,
  order_id     char(36) not null,
  product_slug varchar(190) not null,
  product_name varchar(200) not null,
  price        decimal(10,2) not null,
  quantity     int not null default 1,
  color        varchar(20),
  color_name   varchar(60),
  size         varchar(20),
  image        varchar(300),
  foreign key (order_id) references orders(id) on delete cascade
);

-- Produkt-Bewertungen (öffentlich einsehbar, siehe /api/reviews)
-- `order_id` + `verified` werden gesetzt, wenn die Bewertung über den signierten
-- Link aus der Bewertungs-Mail kommt → Anzeige als „Verifizierter Kauf".
-- Der Unique-Key verhindert zwei Bewertungen desselben Artikels aus derselben
-- Bestellung (mehrere NULL-order_id bleiben erlaubt — freie Bewertungen).
create table if not exists reviews (
  id           char(36) primary key,
  product_slug varchar(190) not null,
  name         varchar(80) default 'Anonym',
  rating       int not null,
  comment      text not null,
  approved     boolean default true,
  order_id     char(36),
  verified     boolean default false,
  created_at   datetime default current_timestamp,
  unique key uniq_review_order_product (order_id, product_slug)
);

-- Newsletter-Anmeldungen
create table if not exists newsletter_subscribers (
  id         char(36) primary key,
  email      varchar(200) unique not null,
  locale     varchar(5) default 'de',
  created_at datetime default current_timestamp
);

-- Hinweis: Es gibt bewusst keine Row-Level-Security wie bei Supabase —
-- MySQL kennt kein RLS. Der Zugriffsschutz erfolgt ausschliesslich auf
-- App-Ebene (alle Schreib-/Leseoperationen laufen server-seitig über
-- src/lib/db.ts, nie direkt vom Client aus).

-- ============================================================
-- Produktdaten NICHT enthalten: Die 57 aktuellen Produkte liegen aktuell in
-- Supabase (Postgres) und müssen manuell exportiert und hier importiert
-- werden (z.B. via Supabase-Tabellen-Export als CSV/JSON, dann Umwandlung
-- in INSERT-Statements passend zu obigem Schema).
-- ============================================================
