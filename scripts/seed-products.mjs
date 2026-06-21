import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const SUPABASE_URL = "https://jyngxwofylbytivhyjdz.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bmd4d29meWxieXRpdmh5amR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY1OTg0NCwiZXhwIjoyMDk2MjM1ODQ0fQ.KWIX6KzT-CPtmBgyZZOwAsTKneL3YeqaFWhyLFMWWvM";

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  realtime: { transport: ws },
});

const products = [
  {
    slug: "neve-turtleneck",
    name_de: "Névé Turtleneck", name_en: "Névé Turtleneck",
    price: 89, category: "tops", is_new: true, active: true,
    colors: ["#F0EDE8","#1A1A1A","#8E8E8E","#6B7A8D","#6B2D3E","#F5F0E8","#4A3728"],
    color_names_de: ["Off-White","Noir","Cinder Grey","Slate Blue","Bordeaux","Ivory Cream","Espresso"],
    color_names_en: ["Off-White","Noir","Cinder Grey","Slate Blue","Bordeaux","Ivory Cream","Espresso"],
    sizes: ["One Size"],
    images: ["/products/neve-turtleneck-1.png"],
    measurements_de: "Brustumfang 110 cm · Länge 68 cm · Schulterbreite 110 cm · Ärmellänge 44 cm · Kragenhöhe 42 cm",
    measurements_en: "Chest 110 cm · Length 68 cm · Shoulder width 110 cm · Sleeve length 44 cm · Collar height 42 cm",
    description_de: "Eine Silhouette, die nicht versucht aufzufallen — und genau deshalb auffällt. Der Névé sitzt großzügig, fällt weich über die Schultern und vermittelt das Gefühl, in etwas investiert zu haben, das bleibt. Stehkragen, lockere Schulterpartie, leicht verlängerter Rücken. Einheitsgröße für EU 34–42.",
    description_en: "A silhouette that doesn't try to stand out — and that's exactly why it does. The Névé sits generously, falls softly over the shoulders and gives the feeling of having invested in something that lasts. Stand collar, relaxed shoulder, slightly extended back. One size fits EU 34–42.",
    material_de: "Gebürstetes Strick-Fleece mit Wollcharakter, weich und wärmend",
    material_en: "Brushed knit fleece with wool character, soft and warming",
    care_de: "30°C Kaltwasche, links waschen, nicht trockner",
    care_en: "Cold wash 30°C, wash inside out, no tumble dry",
  },
  {
    slug: "solstice-wrap-top",
    name_de: "Solstice Wrap Top", name_en: "Solstice Wrap Top",
    price: 49, category: "tops", is_new: true, active: true,
    colors: ["#C49A6C","#1A1A1A","#EDE8E0","#F5F5F5","#9E9E9E","#E8B4B8","#B5AA84"],
    color_names_de: ["Caramel Brown","Onyx","Oatmeal","Dove White","Ash Grey","Blush Pink","Warm Khaki"],
    color_names_en: ["Caramel Brown","Onyx","Oatmeal","Dove White","Ash Grey","Blush Pink","Warm Khaki"],
    sizes: ["S (EU 36)","M (EU 38)","L (EU 40/42)","XL (EU 44)"],
    images: ["/products/solstice-wrap-top-1.png"],
    measurements_de: "Brustumfang (S) 76 cm · Länge (S) 51 cm",
    measurements_en: "Chest (S) 76 cm · Length (S) 51 cm",
    description_de: "Das Top, das du immer suchst, wenn du nichts findest. Ein tiefer V-Ausschnitt, der selbstbewusst ist ohne aufdringlich zu sein. Geschmeidiges Stretch-Jersey mit minimalem Glanz. Leichter Seitenschlitz, der beim Gehen mitschwingt. Ideal zum Midi-Rock oder High-Waist-Jeans.",
    description_en: "The top you always look for when you can't find anything. A deep V-neckline that's confident without being obtrusive. Smooth stretch jersey with minimal sheen. Subtle side slit that flows when you walk. Perfect with a midi skirt or high-waist jeans.",
    material_de: "Stretch-Jersey, fließend, minimaler Glanz, angenehm auf der Haut",
    material_en: "Stretch jersey, fluid, minimal sheen, comfortable against the skin",
    care_de: "30°C Maschinenwäsche, links waschen, hängend trocknen",
    care_en: "Machine wash 30°C, wash inside out, hang dry",
  },
  {
    slug: "corset-rib-crop",
    name_de: "Corset Rib Crop", name_en: "Corset Rib Crop",
    price: 35, category: "tops", is_new: false, active: true,
    colors: ["#C97B5A","#F5F5F5","#1A1A1A","#2D5A3D"],
    color_names_de: ["Terracotta","White","Onyx","Forest Green"],
    color_names_en: ["Terracotta","White","Onyx","Forest Green"],
    sizes: ["XS (EU 34)","S (EU 36)","M (EU 38)","L (EU 40/42)"],
    images: ["/products/corset-rib-crop-1.png"],
    measurements_de: "Brustumfang (S) 70 cm · Länge (S) 41 cm",
    measurements_en: "Chest (S) 70 cm · Length (S) 41 cm",
    description_de: "Figurbetonend ohne zu beengen. Das Corset Rib kombiniert eine strukturierte Korsett-Silhouette mit dem Komfort eines Strick-Oberteils. Geripptes Baumwoll-Lycra-Gewebe, das sich anschmiegt und trotzdem atmet. Knopfleiste verleiht Struktur. Breite Träger, weiche Kante. Solo oder offen über einem BH.",
    description_en: "Figure-hugging without constraining. The Corset Rib combines a structured corset silhouette with the comfort of a knit top. Ribbed cotton-lycra fabric that clings and breathes. Button placket adds structure. Wide straps, soft edge. Worn solo or open over a bra.",
    material_de: "Geripptes Baumwoll-Lycra, atmungsaktiv, formbeständig",
    material_en: "Ribbed cotton-lycra, breathable, shape-retaining",
    care_de: "Handwäsche oder 30°C Schonwäsche, nicht trockner",
    care_en: "Hand wash or 30°C delicate cycle, no tumble dry",
  },
  {
    slug: "halter-rib-tank",
    name_de: "Halter Rib Tank", name_en: "Halter Rib Tank",
    price: 32, category: "tops", is_new: false, active: true,
    colors: ["#9AAB7A","#1A1A1A","#5C3D2E","#E8B4B8","#C0392B"],
    color_names_de: ["Sage Green","Onyx","Chocolate","Blush Pink","Cherry Red"],
    color_names_en: ["Sage Green","Onyx","Chocolate","Blush Pink","Cherry Red"],
    sizes: ["XS (EU 34)","S (EU 36)","M (EU 38)","L (EU 40/42)"],
    images: ["/products/halter-rib-tank-1.png"],
    measurements_de: "Brustumfang (S) 72 cm · Länge (S) 30 cm",
    measurements_en: "Chest (S) 72 cm · Length (S) 30 cm",
    description_de: "Reduziert auf das Wesentliche. Ein Neckholder-Schnitt, der die Schultern freilässt und trotzdem hält. Geripptes Jersey mit gutem Recovery — behält seine Form. Rückenfreies Design, ideal für den Sommer oder als Layer unter einem Blazer. Knappe Länge definiert die Taille mit High-Waist-Bottoms.",
    description_en: "Reduced to the essentials. A halter-neck cut that leaves the shoulders free and still holds its shape. Ribbed jersey with good recovery — keeps its form. Backless design, perfect for summer or as a layer under a blazer. Cropped length defines the waist with high-waist bottoms.",
    material_de: "Geripptes Stretch-Jersey, weich, formbeständig",
    material_en: "Ribbed stretch jersey, soft, shape-retaining",
    care_de: "30°C Kaltwasche, hängend trocknen",
    care_en: "Cold wash 30°C, hang dry",
  },
  {
    slug: "atelier-wide-leg",
    name_de: "Atelier Wide Leg", name_en: "Atelier Wide Leg",
    price: 69, category: "bottoms", is_new: true, active: true,
    colors: ["#1A1A1A","#1B2A4A","#D4C4A0","#C4A0A8","#C4952A","#4A3728"],
    color_names_de: ["Noir","Midnight Navy","Warm Sand","Dusty Rose","Camel","Espresso"],
    color_names_en: ["Noir","Midnight Navy","Warm Sand","Dusty Rose","Camel","Espresso"],
    sizes: ["XS (EU 34)","S (EU 36)","M (EU 38)","L (EU 40/42)","XL (EU 44)"],
    images: ["/products/atelier-wide-leg-1.png"],
    measurements_de: "Taille (M) 68 cm · Hüfte (M) 108 cm · Länge 103 cm",
    measurements_en: "Waist (M) 68 cm · Hip (M) 108 cm · Length 103 cm",
    description_de: "Die Atelier fließt. Ein plissierter Stoff, der bei jedem Schritt mitgeht — weich, leicht, angenehm an der Haut. Hochsitzende Taille mit Bindekordel, weites Bein, das optisch verlängert. Fällt ohne Knitter. Für Büro, Markt oder Abend — je nach was du oben trägst.",
    description_en: "The Atelier flows. A pleated fabric that moves with every step — soft, light, pleasant against the skin. High-sitting waist with drawstring, wide leg that elongates the silhouette. Falls without wrinkles. For office, market or evening — depending on what you wear on top.",
    material_de: "Plissierter Fließstoff, leicht und fließend, knitterarm",
    material_en: "Pleated flow fabric, light and fluid, wrinkle-resistant",
    care_de: "30°C Kaltwasche, hängend trocknen, nicht bügeln",
    care_en: "Cold wash 30°C, hang dry, do not iron",
    size_chart: {
      columns: ["Taillengröße","Hüftgröße","Länge (Unterteil)"],
      rows: [
        { size: "XS", eu: "34",    cm: [60,100,101], in: [23.62,39.37,39.76] },
        { size: "S",  eu: "36",    cm: [64,104,102], in: [25.20,40.94,40.16] },
        { size: "M",  eu: "38",    cm: [68,108,103], in: [26.77,42.52,40.55] },
        { size: "L",  eu: "40/42", cm: [74,114,104], in: [29.13,44.88,40.94] },
        { size: "XL", eu: "44",    cm: [80,120,105], in: [31.50,47.24,41.34] },
      ],
    },
  },
  {
    slug: "archive-baggy-jean",
    name_de: "Archive Baggy Jean", name_en: "Archive Baggy Jean",
    price: 95, category: "bottoms", is_new: true, active: true,
    colors: ["#3A5FA0","#8BA4CC","#5A7AAA","#9AA0B0","#4A4A5A","#9E9E9E","#2A2A3A"],
    color_names_de: ["Medium Indigo","Light Wash","Faded Blue","Stone Wash","Charcoal","Ash Grey","Washed Black"],
    color_names_en: ["Medium Indigo","Light Wash","Faded Blue","Stone Wash","Charcoal","Ash Grey","Washed Black"],
    sizes: ["XS (EU 34)","S (EU 36)","M (EU 38)","L (EU 40/42)","XL (EU 44)"],
    images: ["/products/archive-baggy-jean-1.png","/products/archive-baggy-jean-2.png"],
    measurements_de: "Taille (S) 62 cm · Hüfte (S) 98 cm · Schrittlänge 27 cm",
    measurements_en: "Waist (S) 62 cm · Hip (S) 98 cm · Inseam 27 cm",
    description_de: "Sitzt tief und gibt Raum. Ein geradliniges Bein, das weder zu weit noch zu eng ist — der Sweet Spot zwischen Boyfriend und Straight. Mittelschweres Denim mit weichem Hand-Feel und echten Nähten. Tiefe Gesäßtaschen, klassischer Five-Pocket-Schnitt. Die Jeans, die du täglich anziehst.",
    description_en: "Sits low and gives room. A straight leg that's neither too wide nor too narrow — the sweet spot between boyfriend and straight cut. Medium-weight denim with soft hand-feel and real stitching. Deep back pockets, classic five-pocket cut. The jeans you put on every day.",
    material_de: "Mittelschweres Denim, weicher Griff, authentische Nahtdetails",
    material_en: "Medium-weight denim, soft hand-feel, authentic seam details",
    care_de: "Cold Wash, hängend trocknen, erste Wäsche separat",
    care_en: "Cold wash, hang dry, first wash separately",
  },
];

const { error } = await db.from("products").upsert(products, { onConflict: "slug" });

if (error) {
  console.error("Fehler:", error.message);
} else {
  console.log(`${products.length} Produkte erfolgreich in Supabase eingefügt.`);
}
