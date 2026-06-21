-- ============================================================
-- Verano Exotico — Supabase Schema
-- Einmalig im Supabase SQL-Editor ausführen:
-- Dashboard → SQL Editor → New query → reinpaste → Run
-- ============================================================

-- Produkte
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name_de     text not null,
  name_en     text not null,
  price       numeric(10,2) not null,
  category    text not null,
  is_new      boolean default false,
  colors      text[] default '{}',
  color_names_de text[] default '{}',
  color_names_en text[] default '{}',
  sizes       text[] default '{}',
  images      text[] default '{}',
  description_de text,
  description_en text,
  material_de text,
  material_en text,
  care_de     text,
  care_en     text,
  measurements_de text,
  measurements_en text,
  size_chart  jsonb,
  active      boolean default true,
  created_at  timestamptz default now()
);

-- Bestellungen
create table if not exists orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  serial unique,
  status        text default 'pending',
  customer_email text not null,
  customer_name  text,
  shipping_address jsonb,
  subtotal      numeric(10,2) not null,
  stripe_session_id text unique,
  stripe_payment_intent text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Bestellpositionen
create table if not exists order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid references orders(id) on delete cascade,
  product_slug text not null,
  product_name text not null,
  price       numeric(10,2) not null,
  quantity    int not null default 1,
  color       text,
  color_name  text,
  size        text,
  image       text
);

-- Row Level Security
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Produkte: jeder darf lesen
create policy "Produkte öffentlich lesbar"
  on products for select using (active = true);

-- Bestellungen: nur Service-Role darf schreiben/lesen
create policy "Orders nur via Service-Key"
  on orders for all using (false);

create policy "Order-Items nur via Service-Key"
  on order_items for all using (false);

-- ============================================================
-- Produkte migrieren (deine 6 bestehenden Produkte)
-- ============================================================

insert into products (slug, name_de, name_en, price, category, is_new, colors, color_names_de, color_names_en, sizes, images, description_de, description_en, material_de, material_en, care_de, care_en, measurements_de, measurements_en) values

('neve-turtleneck', 'Névé Turtleneck', 'Névé Turtleneck', 89.00, 'tops', true,
  array['#F0EDE8','#1A1A1A','#8E8E8E','#6B7A8D','#6B2D3E','#F5F0E8','#4A3728'],
  array['Off-White','Noir','Cinder Grey','Slate Blue','Bordeaux','Ivory Cream','Espresso'],
  array['Off-White','Noir','Cinder Grey','Slate Blue','Bordeaux','Ivory Cream','Espresso'],
  array['One Size'],
  array['/products/neve-turtleneck-1.png'],
  'Eine Silhouette, die nicht versucht aufzufallen — und genau deshalb auffällt.',
  'A silhouette that doesn''t try to stand out — and that''s exactly why it does.',
  'Gebürstetes Strick-Fleece mit Wollcharakter, weich und wärmend',
  'Brushed knit fleece with wool character, soft and warming',
  '30°C Kaltwasche, links waschen, nicht trockner',
  'Cold wash 30°C, wash inside out, no tumble dry',
  'Brustumfang 110 cm · Länge 68 cm · Schulterbreite 110 cm',
  'Chest 110 cm · Length 68 cm · Shoulder width 110 cm'),

('solstice-wrap-top', 'Solstice Wrap Top', 'Solstice Wrap Top', 49.00, 'tops', true,
  array['#C49A6C','#1A1A1A','#EDE8E0','#F5F5F5','#9E9E9E','#E8B4B8','#B5AA84'],
  array['Caramel Brown','Onyx','Oatmeal','Dove White','Ash Grey','Blush Pink','Warm Khaki'],
  array['Caramel Brown','Onyx','Oatmeal','Dove White','Ash Grey','Blush Pink','Warm Khaki'],
  array['S (EU 36)','M (EU 38)','L (EU 40/42)','XL (EU 44)'],
  array['/products/solstice-wrap-top-1.png'],
  'Das Top, das du immer suchst, wenn du nichts findest.',
  'The top you always look for when you can''t find anything.',
  'Stretch-Jersey, fließend, minimaler Glanz',
  'Stretch jersey, fluid, minimal sheen',
  '30°C Maschinenwäsche, links waschen, hängend trocknen',
  'Machine wash 30°C, wash inside out, hang dry',
  'Brustumfang (S) 76 cm · Länge (S) 51 cm',
  'Chest (S) 76 cm · Length (S) 51 cm'),

('corset-rib-crop', 'Corset Rib Crop', 'Corset Rib Crop', 35.00, 'tops', false,
  array['#C97B5A','#F5F5F5','#1A1A1A','#2D5A3D'],
  array['Terracotta','White','Onyx','Forest Green'],
  array['Terracotta','White','Onyx','Forest Green'],
  array['XS (EU 34)','S (EU 36)','M (EU 38)','L (EU 40/42)'],
  array['/products/corset-rib-crop-1.png'],
  'Figurbetonend ohne zu beengen.',
  'Figure-hugging without constraining.',
  'Geripptes Baumwoll-Lycra, atmungsaktiv',
  'Ribbed cotton-lycra, breathable',
  'Handwäsche oder 30°C Schonwäsche, nicht trockner',
  'Hand wash or 30°C delicate cycle, no tumble dry',
  'Brustumfang (S) 70 cm · Länge (S) 41 cm',
  'Chest (S) 70 cm · Length (S) 41 cm'),

('halter-rib-tank', 'Halter Rib Tank', 'Halter Rib Tank', 32.00, 'tops', false,
  array['#9AAB7A','#1A1A1A','#5C3D2E','#E8B4B8','#C0392B'],
  array['Sage Green','Onyx','Chocolate','Blush Pink','Cherry Red'],
  array['Sage Green','Onyx','Chocolate','Blush Pink','Cherry Red'],
  array['XS (EU 34)','S (EU 36)','M (EU 38)','L (EU 40/42)'],
  array['/products/halter-rib-tank-1.png'],
  'Reduziert auf das Wesentliche.',
  'Reduced to the essentials.',
  'Geripptes Stretch-Jersey, weich, formbeständig',
  'Ribbed stretch jersey, soft, shape-retaining',
  '30°C Kaltwasche, hängend trocknen',
  'Cold wash 30°C, hang dry',
  'Brustumfang (S) 72 cm · Länge (S) 30 cm',
  'Chest (S) 72 cm · Length (S) 30 cm'),

('atelier-wide-leg', 'Atelier Wide Leg', 'Atelier Wide Leg', 69.00, 'bottoms', true,
  array['#1A1A1A','#1B2A4A','#D4C4A0','#C4A0A8','#C4952A','#4A3728'],
  array['Noir','Midnight Navy','Warm Sand','Dusty Rose','Camel','Espresso'],
  array['Noir','Midnight Navy','Warm Sand','Dusty Rose','Camel','Espresso'],
  array['XS (EU 34)','S (EU 36)','M (EU 38)','L (EU 40/42)','XL (EU 44)'],
  array['/products/atelier-wide-leg-1.png'],
  'Die Atelier fließt.',
  'The Atelier flows.',
  'Plissierter Fließstoff, leicht und fließend, knitterarm',
  'Pleated flow fabric, light and fluid, wrinkle-resistant',
  '30°C Kaltwasche, hängend trocknen, nicht bügeln',
  'Cold wash 30°C, hang dry, do not iron',
  'Taille (M) 68 cm · Hüfte (M) 108 cm · Länge 103 cm',
  'Waist (M) 68 cm · Hip (M) 108 cm · Length 103 cm'),

('archive-baggy-jean', 'Archive Baggy Jean', 'Archive Baggy Jean', 95.00, 'bottoms', true,
  array['#3A5FA0','#8BA4CC','#5A7AAA','#9AA0B0','#4A4A5A','#9E9E9E','#2A2A3A'],
  array['Medium Indigo','Light Wash','Faded Blue','Stone Wash','Charcoal','Ash Grey','Washed Black'],
  array['Medium Indigo','Light Wash','Faded Blue','Stone Wash','Charcoal','Ash Grey','Washed Black'],
  array['XS (EU 34)','S (EU 36)','M (EU 38)','L (EU 40/42)','XL (EU 44)'],
  array['/products/archive-baggy-jean-1.png'],
  'Sitzt tief und gibt Raum.',
  'Sits low and gives room.',
  'Mittelschweres Denim, weicher Griff, authentische Nahtdetails',
  'Medium-weight denim, soft hand-feel, authentic seam details',
  'Cold Wash, hängend trocknen, erste Wäsche separat',
  'Cold wash, hang dry, first wash separately',
  'Taille (S) 62 cm · Hüfte (S) 98 cm · Schrittlänge 27 cm',
  'Waist (S) 62 cm · Hip (S) 98 cm · Inseam 27 cm');
