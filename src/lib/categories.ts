import type { Locale, Product } from "@/types";

/**
 * Kategorieseiten (/de/bikinis, /de/badeanzuege …) für die Google-Suche.
 *
 * Zuordnung über das Typwort im deutschen Produktnamen — deshalb folgen die
 * Namen dem Muster „<Typ> <Merkmal>" (z. B. „Push-up-Bikini Leopard",
 * „Badeanzug mit Cut-out"). Ein neues Produkt landet so automatisch in der
 * richtigen Kategorie, sobald es korrekt benannt ist.
 */

interface CategoryText {
  /** Linktext in Navigation/Footer */
  label: string;
  /** <title> */
  title: string;
  /** Meta-Beschreibung (~150 Zeichen) */
  description: string;
  h1: string;
  intro: string;
  /** Ratgeber unter dem Produktraster */
  sections: { heading: string; body: string }[];
}

export interface Category {
  slug: string;
  match: (p: Product) => boolean;
  de: CategoryText;
  en: CategoryText;
}

const nameHas = (re: RegExp) => (p: Product) => re.test(p.name.de);

const CARE_DE = {
  heading: "So bleibt deine Bademode länger schön",
  body: "Spüle Bikini und Badeanzug nach dem Baden kurz mit klarem, kaltem Wasser aus — Salz, Chlor und Sonnencreme greifen die Fasern sonst an. Danach von Hand kalt waschen, nicht auswringen und im Schatten liegend trocknen lassen. Trockner und Bleichmittel sind tabu.",
};
const CARE_EN = {
  heading: "Keep your swimwear looking good for longer",
  body: "Rinse your bikini or swimsuit in cold, clean water after swimming — salt, chlorine and sunscreen wear out the fibres. Then hand wash cold, don't wring it out and let it dry flat in the shade. No tumble dryer, no bleach.",
};
const SHOP_DE = {
  heading: "Bestellen bei Verano Exotico",
  body: "Du bezahlst bequem mit TWINT oder Karte. Der Versand in die Schweiz kostet ab CHF 4.90, wir liefern auch nach Liechtenstein, Deutschland, Österreich und in viele weitere Länder. Unsicher bei der Grösse? Auf jeder Produktseite findest du eine Grössentabelle mit Körpermassen.",
};
const SHOP_EN = {
  heading: "Shopping at Verano Exotico",
  body: "Pay easily with TWINT or card. Shipping to Switzerland starts at CHF 4.90, and we also deliver to Liechtenstein, Germany, Austria and many other countries. Not sure about your size? Every product page has a size chart with body measurements.",
};

export const CATEGORIES: Category[] = [
  {
    slug: "bikinis",
    match: nameHas(/bikini/i),
    de: {
      label: "Bikinis",
      title: "Bikinis online kaufen | Verano Exotico",
      description: "Bikinis für Strand und Pool: Triangel, Push-up, Bandeau, Neckholder und High-Waist in vielen Farben. Bezahlen mit TWINT, Versand in die Schweiz ab CHF 4.90.",
      h1: "Bikinis",
      intro: "Vom knappen Triangel-Bikini bis zum High-Waist-Modell: Hier findest du alle Bikinis von Verano Exotico — in kräftigen Farben, mit Prints oder schlicht unifarben.",
      sections: [
        {
          heading: "Welcher Bikini passt zu mir?",
          body: "Triangel-Bikinis sind leicht, flexibel und lassen sich über die Bänder gut anpassen — ideal für kleine bis mittlere Oberweiten. Push-up-Bikinis geben mehr Form und Halt. Bandeau-Oberteile kommen ohne Träger aus und sorgen für eine gleichmässige Bräune. Neckholder-Bikinis werden im Nacken gebunden und sitzen dadurch besonders sicher. Wer am Bauch mehr Stoff mag, greift zum High-Waist-Bikini.",
        },
        {
          heading: "Das richtige Höschen",
          body: "Klassische Bikinihosen bedecken den Po, brasilianische Schnitte sind am Gesäss knapper geschnitten, Tanga-Höschen zeigen am meisten Haut. Höschen mit seitlichen Bindebändern lassen sich in der Weite anpassen.",
        },
        SHOP_DE,
        CARE_DE,
      ],
    },
    en: {
      label: "Bikinis",
      title: "Shop Bikinis Online | Verano Exotico",
      description: "Bikinis for beach and pool: triangle, push-up, bandeau, halter and high-waist styles in many colours. Pay with TWINT, shipping to Switzerland from CHF 4.90.",
      h1: "Bikinis",
      intro: "From minimal triangle bikinis to high-waist styles: here you'll find every bikini by Verano Exotico — in bold colours, with prints or in classic solid shades.",
      sections: [
        {
          heading: "Which bikini suits me?",
          body: "Triangle bikinis are light, flexible and easy to adjust with their ties — great for small to medium busts. Push-up bikinis add shape and support. Bandeau tops are strapless and avoid tan lines. Halter bikinis tie behind the neck and stay securely in place. If you prefer more coverage at the waist, choose a high-waist bikini.",
        },
        {
          heading: "Choosing the right bottoms",
          body: "Classic bikini bottoms offer full coverage at the back, Brazilian cuts are a little more cheeky, and thong bottoms show the most skin. Side-tie bottoms let you adjust the fit.",
        },
        SHOP_EN,
        CARE_EN,
      ],
    },
  },
  {
    slug: "badeanzuege",
    match: nameHas(/badeanzug/i),
    de: {
      label: "Badeanzüge",
      title: "Badeanzüge für Damen online kaufen | Verano Exotico",
      description: "Badeanzüge für Damen: mit Cut-outs, Prints oder schlicht unifarben. Bezahlen mit TWINT oder Karte, Versand in die Schweiz ab CHF 4.90.",
      h1: "Badeanzüge",
      intro: "Ein Badeanzug sitzt beim Schwimmen, Spielen und Sonnen sicher — und sieht dabei richtig gut aus. Entdecke unsere Badeanzüge für Damen.",
      sections: [
        {
          heading: "Badeanzug oder Bikini?",
          body: "Ein Badeanzug bedeckt den Bauch, verrutscht beim Schwimmen kaum und wirkt mit Cut-outs, tiefem Rücken oder Print trotzdem alles andere als brav. Er ist ideal, wenn du dich im Wasser viel bewegst oder einfach einen ruhigen, schmeichelnden Look magst.",
        },
        {
          heading: "Die passende Grösse finden",
          body: "Massgebend sind beim Badeanzug Oberweite, Taille, Hüfte und auch die Rumpflänge. Miss dich am besten in Unterwäsche und vergleiche mit der Grössentabelle auf der Produktseite. Liegst du zwischen zwei Grössen, nimm die grössere.",
        },
        SHOP_DE,
        CARE_DE,
      ],
    },
    en: {
      label: "Swimsuits",
      title: "Women's Swimsuits Online | Verano Exotico",
      description: "Women's swimsuits with cut-outs, prints or in solid colours. Pay with TWINT or card, shipping to Switzerland from CHF 4.90.",
      h1: "Swimsuits",
      intro: "A swimsuit stays in place while you swim, play and sunbathe — and looks great doing it. Discover our women's swimsuits.",
      sections: [
        {
          heading: "Swimsuit or bikini?",
          body: "A swimsuit covers the stomach and hardly shifts while swimming, yet with cut-outs, a low back or a print it's anything but plain. It's ideal if you move a lot in the water or simply like a calm, flattering look.",
        },
        {
          heading: "Finding the right size",
          body: "For a swimsuit, bust, waist, hips and torso length all matter. Measure yourself in underwear and compare with the size chart on the product page. If you're between two sizes, go for the larger one.",
        },
        SHOP_EN,
        CARE_EN,
      ],
    },
  },
  {
    slug: "push-up-bikinis",
    match: nameHas(/push-up/i),
    de: {
      label: "Push-up-Bikinis",
      title: "Push-up-Bikinis online kaufen | Verano Exotico",
      description: "Push-up-Bikinis mit Form und Halt — mit Leoparden-, Blumen- oder Punkte-Print. Bezahlen mit TWINT, Versand in die Schweiz ab CHF 4.90.",
      h1: "Push-up-Bikinis",
      intro: "Push-up-Bikinis betonen das Dekolleté und geben dem Oberteil Form. Bei uns findest du sie in vielen Prints — von Leopard bis Blumen.",
      sections: [
        {
          heading: "Für wen eignet sich ein Push-up-Bikini?",
          body: "Ein Push-up-Oberteil hebt die Brust an und schafft mehr Volumen — besonders schön bei kleinerer Oberweite. Die geformten Cups geben dem Oberteil Stand und sorgen für sicheren Halt.",
        },
        {
          heading: "Kombinieren",
          body: "Zum Push-up-Oberteil passen knappe Höschen für einen sommerlichen Look genauso wie höher geschnittene Modelle. Mit einem leichten Überwurf oder Strandrock wird daraus ein Outfit für die Strandbar.",
        },
        SHOP_DE,
        CARE_DE,
      ],
    },
    en: {
      label: "Push-up Bikinis",
      title: "Push-up Bikinis Online | Verano Exotico",
      description: "Push-up bikinis with shape and support — in leopard, floral or polka dot prints. Pay with TWINT, shipping to Switzerland from CHF 4.90.",
      h1: "Push-up Bikinis",
      intro: "Push-up bikinis enhance your cleavage and give the top shape. Find them here in lots of prints — from leopard to florals.",
      sections: [
        {
          heading: "Who is a push-up bikini for?",
          body: "A push-up top lifts the bust and adds volume — especially flattering for smaller busts. The shaped cups give the top structure and a secure fit.",
        },
        {
          heading: "How to style it",
          body: "Pair a push-up top with cheeky bottoms for a summery look or with higher-cut styles. Add a light cover-up or beach skirt and you're ready for the beach bar.",
        },
        SHOP_EN,
        CARE_EN,
      ],
    },
  },
  {
    slug: "triangel-bikinis",
    match: nameHas(/triangel/i),
    de: {
      label: "Triangel-Bikinis",
      title: "Triangel-Bikinis online kaufen | Verano Exotico",
      description: "Triangel-Bikinis zum Binden — leicht, verstellbar und in vielen Prints. Bezahlen mit TWINT, Versand in die Schweiz ab CHF 4.90.",
      h1: "Triangel-Bikinis",
      intro: "Der Klassiker unter den Bikinis: dreieckige Cups, Bänder zum Binden und ein leichter Sitz. Hier findest du unsere Triangel-Bikinis.",
      sections: [
        {
          heading: "Warum ein Triangel-Bikini?",
          body: "Beim Triangel-Bikini lassen sich die Cups entlang der Bänder verschieben und die Träger im Nacken und am Rücken frei binden. So passt du den Sitz genau an deinen Körper an. Das Oberteil ist leicht, trocknet schnell und hinterlässt nur schmale Bräunungsstreifen.",
        },
        {
          heading: "Tipps zur Passform",
          body: "Binde die Nackenbänder nicht zu straff, damit nichts drückt. Bei grösserer Oberweite sorgen breitere Cups oder ein Modell mit zusätzlichem Halt für mehr Komfort.",
        },
        SHOP_DE,
        CARE_DE,
      ],
    },
    en: {
      label: "Triangle Bikinis",
      title: "Triangle Bikinis Online | Verano Exotico",
      description: "Tie triangle bikinis — light, adjustable and in lots of prints. Pay with TWINT, shipping to Switzerland from CHF 4.90.",
      h1: "Triangle Bikinis",
      intro: "The bikini classic: triangle cups, ties and a light fit. Here you'll find all our triangle bikinis.",
      sections: [
        {
          heading: "Why a triangle bikini?",
          body: "With a triangle bikini you can slide the cups along the strings and tie the straps at the neck and back as you like. That way the fit adapts to your body. The top is light, dries quickly and leaves only thin tan lines.",
        },
        {
          heading: "Fit tips",
          body: "Don't tie the neck straps too tight so nothing digs in. For a larger bust, wider cups or a style with extra support are more comfortable.",
        },
        SHOP_EN,
        CARE_EN,
      ],
    },
  },
  {
    slug: "neckholder-bikinis",
    match: nameHas(/neckholder/i),
    de: {
      label: "Neckholder-Bikinis",
      title: "Neckholder-Bikinis online kaufen | Verano Exotico",
      description: "Neckholder-Bikinis, im Nacken gebunden für sicheren Halt — mit Rüschen, Prints oder unifarben. Bezahlen mit TWINT, Versand in die Schweiz ab CHF 4.90.",
      h1: "Neckholder-Bikinis",
      intro: "Beim Neckholder-Bikini wird das Oberteil im Nacken gebunden — das gibt Halt und betont die Schultern. Hier sind unsere Neckholder-Modelle.",
      sections: [
        {
          heading: "Vorteile des Neckholders",
          body: "Die Träger laufen hinter dem Nacken zusammen und stützen das Oberteil von oben. Dadurch sitzt der Bikini auch beim Schwimmen oder Beachvolleyball sicher, und du kannst die Spannung über die Bänder selbst bestimmen.",
        },
        {
          heading: "Tipps",
          body: "Wenn du lange in der Sonne liegst, löse die Nackenbänder kurz — so vermeidest du Druckstellen. Für eine gleichmässige Bräune kannst du die Bänder auch seitlich nach unten legen.",
        },
        SHOP_DE,
        CARE_DE,
      ],
    },
    en: {
      label: "Halter Bikinis",
      title: "Halter Bikinis Online | Verano Exotico",
      description: "Halter bikinis that tie behind the neck for a secure fit — with ruffles, prints or in solid colours. Pay with TWINT, shipping to Switzerland from CHF 4.90.",
      h1: "Halter Bikinis",
      intro: "A halter bikini ties behind the neck — giving support and showing off your shoulders. Here are our halter styles.",
      sections: [
        {
          heading: "Why a halter neck?",
          body: "The straps meet behind your neck and support the top from above. That keeps the bikini in place while swimming or playing beach volleyball, and you control the tension with the ties.",
        },
        {
          heading: "Tips",
          body: "When sunbathing for a long time, loosen the neck ties now and then to avoid pressure marks. For an even tan, you can also lay the ties down to the sides.",
        },
        SHOP_EN,
        CARE_EN,
      ],
    },
  },
  {
    slug: "bikini-sets",
    match: nameHas(/set\b/i),
    de: {
      label: "Bikini-Sets mit Rock & Kleid",
      title: "Bikini-Sets mit Rock oder Strandkleid | Verano Exotico",
      description: "Bikini-Sets mit passendem Rock oder Strandkleid — der komplette Strandlook in einem Kauf. Bezahlen mit TWINT, Versand in die Schweiz ab CHF 4.90.",
      h1: "Bikini-Sets mit Rock & Kleid",
      intro: "Bikini und passender Überwurf in einem: Unsere Sets bringen alles mit, was du vom Strand bis zur Beachbar brauchst.",
      sections: [
        {
          heading: "Warum ein Set?",
          body: "Bei einem Set sind Bikini und Rock oder Strandkleid farblich aufeinander abgestimmt. Du musst nichts kombinieren und bist sofort angezogen, wenn es vom Wasser ins Café geht.",
        },
        SHOP_DE,
        CARE_DE,
      ],
    },
    en: {
      label: "Bikini Sets with Skirt & Dress",
      title: "Bikini Sets with Skirt or Beach Dress | Verano Exotico",
      description: "Bikini sets with a matching skirt or beach dress — your complete beach look in one. Pay with TWINT, shipping to Switzerland from CHF 4.90.",
      h1: "Bikini Sets with Skirt & Dress",
      intro: "Bikini and matching cover-up in one: our sets bring everything you need from the beach to the beach bar.",
      sections: [
        {
          heading: "Why a set?",
          body: "In a set, the bikini and skirt or beach dress are colour-matched. No need to mix and match — you're dressed in seconds when heading from the water to the café.",
        },
        SHOP_EN,
        CARE_EN,
      ],
    },
  },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function productsInCategory(category: Category, products: Product[]): Product[] {
  return products.filter(category.match);
}

export function categoryText(category: Category, locale: Locale): CategoryText {
  return category[locale];
}
