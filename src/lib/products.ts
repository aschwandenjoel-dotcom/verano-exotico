import type { Product } from "@/types";

export const products: Product[] = [
  /* ── NEVE TURTLENECK ─────────────────────────────────────── */
  {
    slug: "neve-turtleneck",
    name: { de: "Névé Turtleneck", en: "Névé Turtleneck" },
    price: 89,
    category: "tops",
    isNew: true,
    colors: ["#F0EDE8", "#1A1A1A", "#8E8E8E", "#6B7A8D", "#6B2D3E", "#F5F0E8", "#4A3728"],
    colorNames: {
      de: ["Off-White", "Noir", "Cinder Grey", "Slate Blue", "Bordeaux", "Ivory Cream", "Espresso"],
      en: ["Off-White", "Noir", "Cinder Grey", "Slate Blue", "Bordeaux", "Ivory Cream", "Espresso"],
    },
    sizes: ["One Size"],
    images: [
      "/products/neve-turtleneck-1.webp",
      "/products/neve-turtleneck-2.webp",
      "/products/neve-turtleneck-3.webp",
    ],
    measurements: {
      de: "Brustumfang 110 cm · Länge 68 cm · Schulterbreite 110 cm · Ärmellänge 44 cm · Kragenhöhe 42 cm",
      en: "Chest 110 cm · Length 68 cm · Shoulder width 110 cm · Sleeve length 44 cm · Collar height 42 cm",
    },
    description: {
      de: "Eine Silhouette, die nicht versucht aufzufallen — und genau deshalb auffällt. Der Névé sitzt großzügig, fällt weich über die Schultern und vermittelt das Gefühl, in etwas investiert zu haben, das bleibt. Stehkragen, lockere Schulterpartie, leicht verlängerter Rücken. Einheitsgröße für EU 34–42.",
      en: "A silhouette that doesn't try to stand out — and that's exactly why it does. The Névé sits generously, falls softly over the shoulders and gives the feeling of having invested in something that lasts. Stand collar, relaxed shoulder, slightly extended back. One size fits EU 34–42.",
    },
    material: {
      de: "Gebürstetes Strick-Fleece mit Wollcharakter, weich und wärmend",
      en: "Brushed knit fleece with wool character, soft and warming",
    },
    care: {
      de: "30°C Kaltwasche, links waschen, nicht trockner",
      en: "Cold wash 30°C, wash inside out, no tumble dry",
    },
  },

  /* ── SOLSTICE WRAP TOP ───────────────────────────────────── */
  {
    slug: "solstice-wrap-top",
    name: { de: "Solstice Wrap Top", en: "Solstice Wrap Top" },
    price: 49,
    category: "tops",
    isNew: true,
    colors: ["#C49A6C", "#1A1A1A", "#EDE8E0", "#F5F5F5", "#9E9E9E", "#E8B4B8", "#B5AA84"],
    colorNames: {
      de: ["Caramel Brown", "Onyx", "Oatmeal", "Dove White", "Ash Grey", "Blush Pink", "Warm Khaki"],
      en: ["Caramel Brown", "Onyx", "Oatmeal", "Dove White", "Ash Grey", "Blush Pink", "Warm Khaki"],
    },
    sizes: ["S (EU 36)", "M (EU 38)", "L (EU 40/42)", "XL (EU 44)"],
    images: [
      "/products/solstice-wrap-top-1.webp",
      "/products/solstice-wrap-top-2.webp",
      "/products/solstice-wrap-top-3.webp",
    ],
    measurements: {
      de: "Brustumfang (S) 76 cm · Länge (S) 51 cm",
      en: "Chest (S) 76 cm · Length (S) 51 cm",
    },
    description: {
      de: "Das Top, das du immer suchst, wenn du nichts findest. Ein tiefer V-Ausschnitt, der selbstbewusst ist ohne aufdringlich zu sein. Geschmeidiges Stretch-Jersey mit minimalem Glanz. Leichter Seitenschlitz, der beim Gehen mitschwingt. Ideal zum Midi-Rock oder High-Waist-Jeans.",
      en: "The top you always look for when you can't find anything. A deep V-neckline that's confident without being obtrusive. Smooth stretch jersey with minimal sheen. Subtle side slit that flows when you walk. Perfect with a midi skirt or high-waist jeans.",
    },
    material: {
      de: "Stretch-Jersey, fließend, minimaler Glanz, angenehm auf der Haut",
      en: "Stretch jersey, fluid, minimal sheen, comfortable against the skin",
    },
    care: {
      de: "30°C Maschinenwäsche, links waschen, hängend trocknen",
      en: "Machine wash 30°C, wash inside out, hang dry",
    },
  },

  /* ── CORSET RIB CROP ─────────────────────────────────────── */
  {
    slug: "corset-rib-crop",
    name: { de: "Corset Rib Crop", en: "Corset Rib Crop" },
    price: 35,
    category: "tops",
    isNew: false,
    colors: ["#C97B5A", "#F5F5F5", "#1A1A1A", "#2D5A3D"],
    colorNames: {
      de: ["Terracotta", "White", "Onyx", "Forest Green"],
      en: ["Terracotta", "White", "Onyx", "Forest Green"],
    },
    sizes: ["XS (EU 34)", "S (EU 36)", "M (EU 38)", "L (EU 40/42)"],
    images: [
      "/products/corset-rib-crop-1.webp",
      "/products/corset-rib-crop-2.webp",
      "/products/corset-rib-crop-3.webp",
    ],
    measurements: {
      de: "Brustumfang (S) 70 cm · Länge (S) 41 cm",
      en: "Chest (S) 70 cm · Length (S) 41 cm",
    },
    description: {
      de: "Figurbetonend ohne zu beengen. Das Corset Rib kombiniert eine strukturierte Korsett-Silhouette mit dem Komfort eines Strick-Oberteils. Geripptes Baumwoll-Lycra-Gewebe, das sich anschmiegt und trotzdem atmet. Knopfleiste verleiht Struktur. Breite Träger, weiche Kante. Solo oder offen über einem BH.",
      en: "Figure-hugging without constraining. The Corset Rib combines a structured corset silhouette with the comfort of a knit top. Ribbed cotton-lycra fabric that clings and breathes. Button placket adds structure. Wide straps, soft edge. Worn solo or open over a bra.",
    },
    material: {
      de: "Geripptes Baumwoll-Lycra, atmungsaktiv, formbeständig",
      en: "Ribbed cotton-lycra, breathable, shape-retaining",
    },
    care: {
      de: "Handwäsche oder 30°C Schonwäsche, nicht trockner",
      en: "Hand wash or 30°C delicate cycle, no tumble dry",
    },
  },

  /* ── HALTER RIB TANK ─────────────────────────────────────── */
  {
    slug: "halter-rib-tank",
    name: { de: "Halter Rib Tank", en: "Halter Rib Tank" },
    price: 32,
    category: "tops",
    isNew: false,
    colors: ["#9AAB7A", "#1A1A1A", "#5C3D2E", "#E8B4B8", "#C0392B"],
    colorNames: {
      de: ["Sage Green", "Onyx", "Chocolate", "Blush Pink", "Cherry Red"],
      en: ["Sage Green", "Onyx", "Chocolate", "Blush Pink", "Cherry Red"],
    },
    sizes: ["XS (EU 34)", "S (EU 36)", "M (EU 38)", "L (EU 40/42)"],
    images: [
      "/products/halter-rib-tank-1.webp",
      "/products/halter-rib-tank-2.webp",
      "/products/halter-rib-tank-3.webp",
    ],
    measurements: {
      de: "Brustumfang (S) 72 cm · Länge (S) 30 cm",
      en: "Chest (S) 72 cm · Length (S) 30 cm",
    },
    description: {
      de: "Reduziert auf das Wesentliche. Ein Neckholder-Schnitt, der die Schultern freilässt und trotzdem hält. Geripptes Jersey mit gutem Recovery — behält seine Form. Rückenfreies Design, ideal für den Sommer oder als Layer unter einem Blazer. Knappe Länge definiert die Taille mit High-Waist-Bottoms.",
      en: "Reduced to the essentials. A halter-neck cut that leaves the shoulders free and still holds its shape. Ribbed jersey with good recovery — keeps its form. Backless design, perfect for summer or as a layer under a blazer. Cropped length defines the waist with high-waist bottoms.",
    },
    material: {
      de: "Geripptes Stretch-Jersey, weich, formbeständig",
      en: "Ribbed stretch jersey, soft, shape-retaining",
    },
    care: {
      de: "30°C Kaltwasche, hängend trocknen",
      en: "Cold wash 30°C, hang dry",
    },
  },

  /* ── ATELIER WIDE LEG ────────────────────────────────────── */
  {
    slug: "atelier-wide-leg",
    name: { de: "Atelier Wide Leg", en: "Atelier Wide Leg" },
    price: 69,
    category: "bottoms",
    isNew: true,
    colors: ["#1A1A1A", "#1B2A4A", "#D4C4A0", "#C4A0A8", "#C4952A", "#4A3728"],
    colorNames: {
      de: ["Noir", "Midnight Navy", "Warm Sand", "Dusty Rose", "Camel", "Espresso"],
      en: ["Noir", "Midnight Navy", "Warm Sand", "Dusty Rose", "Camel", "Espresso"],
    },
    sizes: ["XS (EU 34)", "S (EU 36)", "M (EU 38)", "L (EU 40/42)", "XL (EU 44)"],
    images: [
      "/products/atelier-wide-leg-1.webp",
      "/products/atelier-wide-leg-2.webp",
      "/products/atelier-wide-leg-3.webp",
    ],
    measurements: {
      de: "Taille (M) 80 cm · Hüfte (M) 120 cm · Länge 105 cm",
      en: "Waist (M) 80 cm · Hip (M) 120 cm · Length 105 cm",
    },
    description: {
      de: "Die Atelier fließt. Ein plissierter Stoff, der bei jedem Schritt mitgeht — weich, leicht, angenehm an der Haut. Hochsitzende Taille mit Bindekordel, weites Bein, das optisch verlängert. Fällt ohne Knitter. Für Büro, Markt oder Abend — je nach was du oben trägst.",
      en: "The Atelier flows. A pleated fabric that moves with every step — soft, light, pleasant against the skin. High-sitting waist with drawstring, wide leg that elongates the silhouette. Falls without wrinkles. For office, market or evening — depending on what you wear on top.",
    },
    material: {
      de: "Plissierter Fließstoff, leicht und fließend, knitterarm",
      en: "Pleated flow fabric, light and fluid, wrinkle-resistant",
    },
    care: {
      de: "30°C Kaltwasche, hängend trocknen, nicht bügeln",
      en: "Cold wash 30°C, hang dry, do not iron",
    },
  },

  /* ── ARCHIVE BAGGY JEAN ──────────────────────────────────── */
  {
    slug: "archive-baggy-jean",
    name: { de: "Archive Baggy Jean", en: "Archive Baggy Jean" },
    price: 95,
    category: "bottoms",
    isNew: true,
    colors: ["#3A5FA0", "#8BA4CC", "#5A7AAA", "#9AA0B0", "#4A4A5A", "#9E9E9E", "#2A2A3A"],
    colorNames: {
      de: ["Medium Indigo", "Light Wash", "Faded Blue", "Stone Wash", "Charcoal", "Ash Grey", "Washed Black"],
      en: ["Medium Indigo", "Light Wash", "Faded Blue", "Stone Wash", "Charcoal", "Ash Grey", "Washed Black"],
    },
    sizes: ["XS (EU 34)", "S (EU 36)", "M (EU 38)", "L (EU 40/42)", "XL (EU 44)"],
    images: [
      "/products/archive-baggy-jean-1.webp",
      "/products/archive-baggy-jean-2.webp",
      "/products/archive-baggy-jean-3.webp",
    ],
    measurements: {
      de: "Taille (S) 62 cm · Hüfte (S) 98 cm · Schrittlänge 27 cm",
      en: "Waist (S) 62 cm · Hip (S) 98 cm · Inseam 27 cm",
    },
    description: {
      de: "Sitzt tief und gibt Raum. Ein geradliniges Bein, das weder zu weit noch zu eng ist — der Sweet Spot zwischen Boyfriend und Straight. Mittelschweres Denim mit weichem Hand-Feel und echten Nähten. Tiefe Gesäßtaschen, klassischer Five-Pocket-Schnitt. Die Jeans, die du täglich anziehst.",
      en: "Sits low and gives room. A straight leg that's neither too wide nor too narrow — the sweet spot between boyfriend and straight cut. Medium-weight denim with soft hand-feel and real stitching. Deep back pockets, classic five-pocket cut. The jeans you put on every day.",
    },
    material: {
      de: "Mittelschweres Denim, weicher Griff, authentische Nahtdetails",
      en: "Medium-weight denim, soft hand-feel, authentic seam details",
    },
    care: {
      de: "Cold Wash, hängend trocknen, erste Wäsche separat",
      en: "Cold wash, hang dry, first wash separately",
    },
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
