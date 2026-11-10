import type { LogoVariantId } from './types';

export interface LogoOptionMeta {
  id: LogoVariantId;
  title: string;
  subtitle: string;
  emoji: string;
}

export const LOGO_OPTIONS: LogoOptionMeta[] = [
  {
    id: 'penguin',
    title: '1×1 Pinguin',
    subtitle: 'Für die Pinguin-Klasse',
    emoji: '🐧',
  },
  {
    id: 'otter',
    title: '1×1 Otter',
    subtitle: 'Für die Otter-Klasse',
    emoji: '🦦',
  },
  {
    id: 'owl',
    title: 'Mathe-Eule',
    subtitle: 'Mit Krone & 1×1-Schild',
    emoji: '🦉',
  },
  {
    id: 'rocket',
    title: 'Mathe-Rakete',
    subtitle: 'Start ins Zahlen-All',
    emoji: '🚀',
  },
  {
    id: 'fox',
    title: 'Rechen-Fuchs',
    subtitle: 'Schlaues Maskottchen',
    emoji: '🦊',
  },
];

export function getLogoSvgMarkup(variant: LogoVariantId, size = 120): string {
  switch (variant) {
    case 'penguin':
      return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pengBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0284C7" />
      <stop offset="100%" stop-color="#1E3A8A" />
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="28" fill="url(#pengBg)" />
  <!-- Schneeflocken-Punkte -->
  <circle cx="20" cy="24" r="2.5" fill="#E0F2FE" opacity="0.8" />
  <circle cx="100" cy="28" r="2" fill="#E0F2FE" opacity="0.8" />
  <circle cx="16" cy="54" r="1.8" fill="#E0F2FE" opacity="0.6" />
  <!-- Watschel-Füße -->
  <ellipse cx="44" cy="105" rx="11" ry="5.5" fill="#F97316" />
  <ellipse cx="76" cy="105" rx="11" ry="5.5" fill="#F97316" />
  <!-- Flügel / Flossen -->
  <path d="M26 52C14 58 14 82 25 88L30 56Z" fill="#0F172A" />
  <path d="M94 52C106 58 106 82 95 88L90 56Z" fill="#0F172A" />
  <!-- Pinguin-Körper & Kopf -->
  <path d="M26 54C26 28 40 16 60 16C80 16 94 28 94 54V82C94 98 80 105 60 105C40 105 26 98 26 82V54Z" fill="#0F172A" />
  <!-- Weißes Gesicht & Bauch -->
  <path d="M35 46C35 34 45 28 53 35C57 38 63 38 67 35C75 28 85 34 85 46V82C85 95 75 101 60 101C45 101 35 95 35 82V46Z" fill="#FFFFFF" />
  <!-- Rosa Wangen -->
  <ellipse cx="42" cy="53" rx="4.5" ry="2.8" fill="#FDA4AF" />
  <ellipse cx="78" cy="53" rx="4.5" ry="2.8" fill="#FDA4AF" />
  <!-- Augen -->
  <circle cx="46" cy="44" r="6" fill="#0F172A" />
  <circle cx="74" cy="44" r="6" fill="#0F172A" />
  <circle cx="48" cy="42" r="2.2" fill="#FFFFFF" />
  <circle cx="76" cy="42" r="2.2" fill="#FFFFFF" />
  <!-- Schnabel -->
  <path d="M52 48C56 46 64 46 68 48L60 57Z" fill="#F97316" />
  <!-- Roter Schal -->
  <path d="M32 61C46 66 74 66 88 61L86 69C72 73 48 73 34 69Z" fill="#EF4444" />
  <path d="M70 66L75 80L65 79Z" fill="#DC2626" />
  <!-- 1x1 Bauch-Badge -->
  <rect x="37" y="72" width="46" height="24" rx="12" fill="#E0F2FE" stroke="#0284C7" stroke-width="2" />
  <text x="60" y="89" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#0C4A6E">1×1</text>
</svg>`;

    case 'otter':
      return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="otterBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0D9488" />
      <stop offset="100%" stop-color="#115E59" />
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="28" fill="url(#otterBg)" />
  <!-- Kleine Wasserblasen -->
  <circle cx="22" cy="26" r="3" fill="#99F6E4" opacity="0.65" />
  <circle cx="98" cy="24" r="2.5" fill="#99F6E4" opacity="0.65" />
  <!-- Runde Otter-Ohren -->
  <circle cx="30" cy="34" r="10" fill="#78350F" />
  <circle cx="90" cy="34" r="10" fill="#78350F" />
  <circle cx="30" cy="34" r="5.5" fill="#FDE68A" />
  <circle cx="90" cy="34" r="5.5" fill="#FDE68A" />
  <!-- Otter-Körper & Kopf -->
  <path d="M26 48C26 27 40 20 60 20C80 20 94 27 94 48V86C94 100 80 106 60 106C40 106 26 100 26 86V48Z" fill="#92400E" />
  <!-- Heller Bauch -->
  <path d="M36 66C36 56 46 52 60 52C74 52 84 56 84 66V90C84 100 74 104 60 104C46 104 36 100 36 90V66Z" fill="#FDE68A" />
  <!-- Schnauze / Bäckchen -->
  <circle cx="51" cy="54" r="11" fill="#FEF3C7" />
  <circle cx="69" cy="54" r="11" fill="#FEF3C7" />
  <!-- Schnurrhaare -->
  <line x1="28" y1="52" x2="41" y2="53" stroke="#FEF3C7" stroke-width="2" stroke-linecap="round" />
  <line x1="29" y1="57" x2="41" y2="56" stroke="#FEF3C7" stroke-width="2" stroke-linecap="round" />
  <line x1="92" y1="52" x2="79" y2="53" stroke="#FEF3C7" stroke-width="2" stroke-linecap="round" />
  <line x1="91" y1="57" x2="79" y2="56" stroke="#FEF3C7" stroke-width="2" stroke-linecap="round" />
  <!-- Augen -->
  <circle cx="44" cy="40" r="5.8" fill="#1E1B4B" />
  <circle cx="76" cy="40" r="5.8" fill="#1E1B4B" />
  <circle cx="46" cy="38" r="2" fill="#FFFFFF" />
  <circle cx="78" cy="38" r="2" fill="#FFFFFF" />
  <!-- Otter-Nase & Mund -->
  <path d="M53 46C56 44 64 44 67 46L60 53Z" fill="#451A03" />
  <path d="M60 53V58M60 58C56 61 52 60 50 58M60 58C64 61 68 60 70 58" stroke="#451A03" stroke-width="2.2" stroke-linecap="round" />
  <!-- 1x1 Muschel-/Holzschild auf dem Bauch + Pfoten -->
  <rect x="33" y="69" width="54" height="27" rx="13.5" fill="#FFFFFF" stroke="#F59E0B" stroke-width="3" />
  <circle cx="34" cy="82" r="6" fill="#78350F" />
  <circle cx="86" cy="82" r="6" fill="#78350F" />
  <text x="60" y="88" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="#115E59">1×1</text>
</svg>`;

    case 'owl':
      return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="owlBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="100%" stop-color="#312E81" />
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="28" fill="url(#owlBg)" />
  <path d="M38 28L46 14L60 24L74 14L82 28H38Z" fill="#FBBF24" stroke="#F59E0B" stroke-width="2" stroke-linejoin="round" />
  <path d="M26 36C26 28 36 26 42 32C48 29 72 29 78 32C84 26 94 28 94 36V76C94 94 79 106 60 106C41 106 26 94 26 76V36Z" fill="#818CF8" />
  <path d="M26 56C19 62 19 80 28 86V56Z" fill="#6366F1" />
  <path d="M94 56C101 62 101 80 92 86V56Z" fill="#6366F1" />
  <rect x="35" y="68" width="50" height="30" rx="15" fill="#EEF2FF" />
  <text x="60" y="89" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="#312E81">1×1</text>
  <circle cx="45" cy="50" r="14" fill="#FFFFFF" />
  <circle cx="75" cy="50" r="14" fill="#FFFFFF" />
  <circle cx="47" cy="50" r="7" fill="#1E1B4B" />
  <circle cx="73" cy="50" r="7" fill="#1E1B4B" />
  <circle cx="49" cy="47" r="2.5" fill="#FFFFFF" />
  <circle cx="75" cy="47" r="2.5" fill="#FFFFFF" />
  <path d="M54 55L66 55L60 65Z" fill="#F59E0B" />
</svg>`;

    case 'rocket':
      return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="spaceBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1E1B4B" />
      <stop offset="100%" stop-color="#4338CA" />
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="28" fill="url(#spaceBg)" />
  <circle cx="24" cy="28" r="3" fill="#FDE047" />
  <circle cx="96" cy="24" r="2.5" fill="#FDE047" />
  <circle cx="98" cy="84" r="3" fill="#38BDF8" />
  <circle cx="22" cy="64" r="2" fill="#A5B4FC" />
  <path d="M46 88C46 98 54 108 60 112C66 108 74 98 74 88H46Z" fill="#F97316" />
  <path d="M51 88C51 95 56 102 60 105C64 102 69 95 69 88H51Z" fill="#FDE047" />
  <path d="M38 66L24 84L42 86Z" fill="#EF4444" />
  <path d="M82 66L96 84L78 86Z" fill="#EF4444" />
  <path d="M60 12C42 28 38 54 40 88H80C82 54 78 28 60 12Z" fill="#FFFFFF" />
  <path d="M60 12C51 20 46 30 44 38H76C74 30 69 20 60 12Z" fill="#EF4444" />
  <circle cx="60" cy="60" r="19" fill="#4F46E5" stroke="#CBD5E1" stroke-width="4" />
  <text x="60" y="66" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#FFFFFF">1×1</text>
</svg>`;

    case 'fox':
      return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="120" height="120" rx="28" fill="#312E81" />
  <path d="M24 16L48 36L22 52Z" fill="#EA580C" />
  <path d="M96 16L72 36L98 52Z" fill="#EA580C" />
  <path d="M28 24L43 36L26 46Z" fill="#FDE68A" />
  <path d="M92 24L77 36L94 46Z" fill="#FDE68A" />
  <path d="M22 48C22 30 38 24 60 24C82 24 98 30 98 48C98 68 78 82 60 84C42 82 22 68 22 48Z" fill="#F97316" />
  <path d="M22 52C34 52 48 64 60 84C40 82 22 68 22 52Z" fill="#FFFBEB" />
  <path d="M98 52C86 52 72 64 60 84C80 82 98 68 98 52Z" fill="#FFFBEB" />
  <circle cx="43" cy="48" r="5.5" fill="#1E1B4B" />
  <circle cx="77" cy="48" r="5.5" fill="#1E1B4B" />
  <circle cx="45" cy="46" r="2" fill="#FFFFFF" />
  <circle cx="79" cy="46" r="2" fill="#FFFFFF" />
  <circle cx="60" cy="68" r="5" fill="#1E1B4B" />
  <rect x="28" y="84" width="64" height="24" rx="12" fill="#10B981" />
  <text x="60" y="101" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="17" fill="#FFFFFF">1×1</text>
</svg>`;
  }
}

/**
 * Aktualisiert dynamisch das Browser-Favicon, das Apple-Touch-Icon (für iOS/iPadOS Home-Bildschirm)
 * sowie das Web-App-Manifest, damit beim "Zum Startbildschirm hinzufügen" das gewählte Logo genutzt wird.
 */
export function applyDynamicHomeScreenIcon(variant: LogoVariantId): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const svgMarkup = getLogoSvgMarkup(variant, 512);
  const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`;

  // 1. Aktualisiere SVG-Favicon sofort
  const iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (iconLink) {
    iconLink.href = svgDataUrl;
  }

  // 2. Rendere 180x180 & 512x512 PNG über Offscreen-Canvas für iOS apple-touch-icon und Android PWA Manifest
  const img = new Image();
  img.onload = () => {
    try {
      const renderPng = (dim: number): string => {
        const canvas = document.createElement('canvas');
        canvas.width = dim;
        canvas.height = dim;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, dim, dim);
        }
        return canvas.toDataURL('image/png');
      };

      const png180 = renderPng(180);
      const png192 = renderPng(192);
      const png512 = renderPng(512);

      const appleTouchLink = document.querySelector<HTMLLinkElement>(
        'link[rel="apple-touch-icon"]'
      );
      if (appleTouchLink) {
        appleTouchLink.href = png180;
      }

      const manifestLink = document.querySelector<HTMLLinkElement>(
        'link[rel="manifest"]'
      );
      if (manifestLink) {
        const startUrl = new URL('./', window.location.href).href;
        const dynamicManifest = {
          name: '1×1 Meister – Kleines Einmaleins spielend lernen',
          short_name: '1×1 Meister',
          description:
            'Kindgerechte Lern-App für das kleine 1×1 und Geteiltaufgaben mit intelligentem Spaced-Repetition-Training.',
          theme_color: '#4F46E5',
          background_color: '#EEF2FF',
          display: 'standalone',
          orientation: 'portrait',
          start_url: startUrl,
          scope: startUrl,
          lang: 'de',
          icons: [
            {
              src: png192,
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: png512,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: svgDataUrl,
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        };
        const blob = new Blob([JSON.stringify(dynamicManifest)], {
          type: 'application/manifest+json',
        });
        manifestLink.href = URL.createObjectURL(blob);
      }
    } catch {
      // Fallback auf Standard-Manifest bei Canvas-Einschränkungen
    }
  };
  img.src = svgDataUrl;
}

