import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    // Vercel Hobby erlaubt 5'000 Bild-Transformationen pro Monat. Jede Kombination
    // aus Bild × Breite zählt, und nach Ablauf des Caches wird erneut gezählt.
    //
    // - minimumCacheTTL: Dateien aus public/ kommen mit max-age=0, ohne diesen
    //   Wert würde jede Variante alle 4 h neu erzeugt. Bilder ändern sich nur
    //   mit neuem Dateinamen, ein Jahr Cache ist daher sicher.
    // - deviceSizes: Produktfotos sind 800–1340 px breit; Varianten für 1920,
    //   2048 und 3840 px wären reine Verschwendung des Kontingents.
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [64, 96, 128, 256, 384],
  },
};

export default withNextIntl(nextConfig);
