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

/**
 * Liefert das SVG-Markup für ein Logo.
 * Wichtig für Android Chrome "Auto Dark Mode" (ForceDark):
 * Alle dunklen und weißen Hauptflächen nutzen SVG-LinearGradients (url(#...)),
 * da Chromium ForceDark keine SVG-Gradient-PaintServer invertiert.
 */
export function getLogoSvgMarkup(variant: LogoVariantId, size = 120): string {
  const sharedDefs = `
    <linearGradient id="gDark_${variant}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1E293B" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
    <linearGradient id="gWhite_${variant}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F8FAFC" />
    </linearGradient>
    <linearGradient id="gCream_${variant}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFBEB" />
      <stop offset="100%" stop-color="#FEF3C7" />
    </linearGradient>
    <linearGradient id="gOrange_${variant}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FB923C" />
      <stop offset="100%" stop-color="#EA580C" />
    </linearGradient>
    <linearGradient id="gGold_${variant}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="100%" stop-color="#F59E0B" />
    </linearGradient>
    <linearGradient id="gRed_${variant}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#EF4444" />
      <stop offset="100%" stop-color="#DC2626" />
    </linearGradient>
  `;

  switch (variant) {
    case 'penguin':
      return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="color-scheme: only light; forced-color-adjust: none;">
  <defs>
    ${sharedDefs}
    <linearGradient id="pengBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0284C7" />
      <stop offset="100%" stop-color="#1E3A8A" />
    </linearGradient>
    <linearGradient id="pengBadge" x1="0" y1="70" x2="0" y2="96" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#E0F2FE" />
      <stop offset="100%" stop-color="#BAE6FD" />
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="28" fill="url(#pengBg)" />
  <circle cx="20" cy="24" r="2.5" fill="url(#gWhite_${variant})" opacity="0.8" />
  <circle cx="100" cy="28" r="2" fill="url(#gWhite_${variant})" opacity="0.8" />
  <circle cx="16" cy="54" r="1.8" fill="url(#gWhite_${variant})" opacity="0.6" />
  <!-- Watschel-Füße -->
  <ellipse cx="44" cy="105" rx="11" ry="5.5" fill="url(#gOrange_${variant})" />
  <ellipse cx="76" cy="105" rx="11" ry="5.5" fill="url(#gOrange_${variant})" />
  <!-- Flügel / Flossen -->
  <path d="M26 52C14 58 14 82 25 88L30 56Z" fill="url(#gDark_${variant})" />
  <path d="M94 52C106 58 106 82 95 88L90 56Z" fill="url(#gDark_${variant})" />
  <!-- Pinguin-Körper & Kopf -->
  <path d="M26 54C26 28 40 16 60 16C80 16 94 28 94 54V82C94 98 80 105 60 105C40 105 26 98 26 82V54Z" fill="url(#gDark_${variant})" />
  <!-- Weißes Gesicht & Bauch -->
  <path d="M35 46C35 34 45 28 53 35C57 38 63 38 67 35C75 28 85 34 85 46V82C85 95 75 101 60 101C45 101 35 95 35 82V46Z" fill="url(#gWhite_${variant})" />
  <!-- Rosa Wangen -->
  <ellipse cx="42" cy="53" rx="4.5" ry="2.8" fill="#FDA4AF" />
  <ellipse cx="78" cy="53" rx="4.5" ry="2.8" fill="#FDA4AF" />
  <!-- Augen -->
  <circle cx="46" cy="44" r="6" fill="url(#gDark_${variant})" />
  <circle cx="74" cy="44" r="6" fill="url(#gDark_${variant})" />
  <circle cx="48" cy="42" r="2.2" fill="url(#gWhite_${variant})" />
  <circle cx="76" cy="42" r="2.2" fill="url(#gWhite_${variant})" />
  <!-- Schnabel -->
  <path d="M52 48C56 46 64 46 68 48L60 57Z" fill="url(#gOrange_${variant})" />
  <!-- Roter Schal -->
  <path d="M32 61C46 66 74 66 88 61L86 69C72 73 48 73 34 69Z" fill="url(#gRed_${variant})" />
  <path d="M70 66L75 80L65 79Z" fill="url(#gRed_${variant})" />
  <!-- 1x1 Bauch-Badge -->
  <rect x="37" y="72" width="46" height="24" rx="12" fill="url(#pengBadge)" stroke="#0284C7" stroke-width="2" />
  <text x="60" y="89" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="url(#gDark_${variant})">1×1</text>
</svg>`;

    case 'otter':
      return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="color-scheme: only light; forced-color-adjust: none;">
  <defs>
    ${sharedDefs}
    <linearGradient id="otterBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0D9488" />
      <stop offset="100%" stop-color="#115E59" />
    </linearGradient>
    <linearGradient id="otterFur" x1="0" y1="20" x2="0" y2="106" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#9A3412" />
      <stop offset="100%" stop-color="#78350F" />
    </linearGradient>
    <linearGradient id="otterBelly" x1="0" y1="50" x2="0" y2="104" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FDE68A" />
      <stop offset="100%" stop-color="#FCD34D" />
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="28" fill="url(#otterBg)" />
  <circle cx="22" cy="26" r="3" fill="url(#gWhite_${variant})" opacity="0.55" />
  <circle cx="98" cy="24" r="2.5" fill="url(#gWhite_${variant})" opacity="0.55" />
  <!-- Runde Otter-Ohren -->
  <circle cx="30" cy="34" r="10" fill="url(#otterFur)" />
  <circle cx="90" cy="34" r="10" fill="url(#otterFur)" />
  <circle cx="30" cy="34" r="5.5" fill="url(#otterBelly)" />
  <circle cx="90" cy="34" r="5.5" fill="url(#otterBelly)" />
  <!-- Otter-Körper & Kopf -->
  <path d="M26 48C26 27 40 20 60 20C80 20 94 27 94 48V86C94 100 80 106 60 106C40 106 26 100 26 86V48Z" fill="url(#otterFur)" />
  <!-- Heller Bauch -->
  <path d="M36 66C36 56 46 52 60 52C74 52 84 56 84 66V90C84 100 74 104 60 104C46 104 36 100 36 90V66Z" fill="url(#otterBelly)" />
  <!-- Schnauze / Bäckchen -->
  <circle cx="51" cy="54" r="11" fill="url(#gCream_${variant})" />
  <circle cx="69" cy="54" r="11" fill="url(#gCream_${variant})" />
  <!-- Schnurrhaare -->
  <line x1="28" y1="52" x2="41" y2="53" stroke="url(#gCream_${variant})" stroke-width="2" stroke-linecap="round" />
  <line x1="29" y1="57" x2="41" y2="56" stroke="url(#gCream_${variant})" stroke-width="2" stroke-linecap="round" />
  <line x1="92" y1="52" x2="79" y2="53" stroke="url(#gCream_${variant})" stroke-width="2" stroke-linecap="round" />
  <line x1="91" y1="57" x2="79" y2="56" stroke="url(#gCream_${variant})" stroke-width="2" stroke-linecap="round" />
  <!-- Augen -->
  <circle cx="44" cy="40" r="5.8" fill="url(#gDark_${variant})" />
  <circle cx="76" cy="40" r="5.8" fill="url(#gDark_${variant})" />
  <circle cx="46" cy="38" r="2" fill="url(#gWhite_${variant})" />
  <circle cx="78" cy="38" r="2" fill="url(#gWhite_${variant})" />
  <!-- Otter-Nase & Mund -->
  <path d="M53 46C56 44 64 44 67 46L60 53Z" fill="url(#gDark_${variant})" />
  <path d="M60 53V58M60 58C56 61 52 60 50 58M60 58C64 61 68 60 70 58" stroke="url(#gDark_${variant})" stroke-width="2.2" stroke-linecap="round" />
  <!-- 1x1 Schild auf dem Bauch + Pfoten -->
  <rect x="33" y="69" width="54" height="27" rx="13.5" fill="url(#gWhite_${variant})" stroke="#F59E0B" stroke-width="3" />
  <circle cx="34" cy="82" r="6" fill="url(#otterFur)" />
  <circle cx="86" cy="82" r="6" fill="url(#otterFur)" />
  <text x="60" y="88" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="18" fill="url(#gDark_${variant})">1×1</text>
</svg>`;

    case 'owl':
      return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="color-scheme: only light; forced-color-adjust: none;">
  <defs>
    ${sharedDefs}
    <linearGradient id="owlBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="100%" stop-color="#312E81" />
    </linearGradient>
    <linearGradient id="owlBody" x1="0" y1="28" x2="0" y2="106" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#818CF8" />
      <stop offset="100%" stop-color="#6366F1" />
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="28" fill="url(#owlBg)" />
  <path d="M38 28L46 14L60 24L74 14L82 28H38Z" fill="url(#gGold_${variant})" stroke="#F59E0B" stroke-width="2" stroke-linejoin="round" />
  <path d="M26 36C26 28 36 26 42 32C48 29 72 29 78 32C84 26 94 28 94 36V76C94 94 79 106 60 106C41 106 26 94 26 76V36Z" fill="url(#owlBody)" />
  <path d="M26 56C19 62 19 80 28 86V56Z" fill="url(#owlBg)" />
  <path d="M94 56C101 62 101 80 92 86V56Z" fill="url(#owlBg)" />
  <rect x="35" y="68" width="50" height="30" rx="15" fill="url(#gWhite_${variant})" />
  <text x="60" y="89" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="url(#gDark_${variant})">1×1</text>
  <circle cx="45" cy="50" r="14" fill="url(#gWhite_${variant})" />
  <circle cx="75" cy="50" r="14" fill="url(#gWhite_${variant})" />
  <circle cx="47" cy="50" r="7" fill="url(#gDark_${variant})" />
  <circle cx="73" cy="50" r="7" fill="url(#gDark_${variant})" />
  <circle cx="49" cy="47" r="2.5" fill="url(#gWhite_${variant})" />
  <circle cx="75" cy="47" r="2.5" fill="url(#gWhite_${variant})" />
  <path d="M54 55L66 55L60 65Z" fill="url(#gGold_${variant})" />
</svg>`;

    case 'rocket':
      return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="color-scheme: only light; forced-color-adjust: none;">
  <defs>
    ${sharedDefs}
    <linearGradient id="spaceBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1E1B4B" />
      <stop offset="100%" stop-color="#4338CA" />
    </linearGradient>
    <linearGradient id="portholeBg" x1="40" y1="40" x2="80" y2="80" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="100%" stop-color="#312E81" />
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="28" fill="url(#spaceBg)" />
  <circle cx="24" cy="28" r="3" fill="url(#gGold_${variant})" />
  <circle cx="96" cy="24" r="2.5" fill="url(#gGold_${variant})" />
  <circle cx="98" cy="84" r="3" fill="url(#gWhite_${variant})" opacity="0.8" />
  <circle cx="22" cy="64" r="2" fill="url(#gWhite_${variant})" opacity="0.7" />
  <path d="M46 88C46 98 54 108 60 112C66 108 74 98 74 88H46Z" fill="url(#gOrange_${variant})" />
  <path d="M51 88C51 95 56 102 60 105C64 102 69 95 69 88H51Z" fill="url(#gGold_${variant})" />
  <path d="M38 66L24 84L42 86Z" fill="url(#gRed_${variant})" />
  <path d="M82 66L96 84L78 86Z" fill="url(#gRed_${variant})" />
  <path d="M60 12C42 28 38 54 40 88H80C82 54 78 28 60 12Z" fill="url(#gWhite_${variant})" />
  <path d="M60 12C51 20 46 30 44 38H76C74 30 69 20 60 12Z" fill="url(#gRed_${variant})" />
  <circle cx="60" cy="60" r="19" fill="url(#portholeBg)" stroke="#CBD5E1" stroke-width="4" />
  <text x="60" y="66" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="url(#gWhite_${variant})">1×1</text>
</svg>`;

    case 'fox':
      return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="color-scheme: only light; forced-color-adjust: none;">
  <defs>
    ${sharedDefs}
    <linearGradient id="foxBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#312E81" />
      <stop offset="100%" stop-color="#1E1B4B" />
    </linearGradient>
    <linearGradient id="foxGreen" x1="28" y1="84" x2="92" y2="108" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="28" fill="url(#foxBg)" />
  <path d="M24 16L48 36L22 52Z" fill="url(#gOrange_${variant})" />
  <path d="M96 16L72 36L98 52Z" fill="url(#gOrange_${variant})" />
  <path d="M28 24L43 36L26 46Z" fill="url(#gCream_${variant})" />
  <path d="M92 24L77 36L94 46Z" fill="url(#gCream_${variant})" />
  <path d="M22 48C22 30 38 24 60 24C82 24 98 30 98 48C98 68 78 82 60 84C42 82 22 68 22 48Z" fill="url(#gOrange_${variant})" />
  <path d="M22 52C34 52 48 64 60 84C40 82 22 68 22 52Z" fill="url(#gCream_${variant})" />
  <path d="M98 52C86 52 72 64 60 84C80 82 98 68 98 52Z" fill="url(#gCream_${variant})" />
  <circle cx="43" cy="48" r="5.5" fill="url(#gDark_${variant})" />
  <circle cx="77" cy="48" r="5.5" fill="url(#gDark_${variant})" />
  <circle cx="45" cy="46" r="2" fill="url(#gWhite_${variant})" />
  <circle cx="79" cy="46" r="2" fill="url(#gWhite_${variant})" />
  <circle cx="60" cy="68" r="5" fill="url(#gDark_${variant})" />
  <rect x="28" y="84" width="64" height="24" rx="12" fill="url(#foxGreen)" />
  <text x="60" y="101" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="17" fill="url(#gWhite_${variant})">1×1</text>
</svg>`;
  }
}

const pngCache = new Map<LogoVariantId, string>();

/**
 * Erzeugt eine gecachte 256×256-PNG-Data-URL aus dem SVG.
 * Da ein 256×256-Rasterbild von Chromiums Auto-Dark-Mode (ForceDark) als Illustration
 * eingestuft wird, wird es auf Android niemals farblich invertiert.
 */
export function getLogoPngDataUrl(variant: LogoVariantId): Promise<string> {
  const cached = pngCache.get(variant);
  if (cached) return Promise.resolve(cached);

  if (typeof document === 'undefined') {
    return Promise.resolve('');
  }

  return new Promise((resolve) => {
    const svgMarkup = getLogoSvgMarkup(variant, 256);
    const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`;
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 256, 256);
        }
        const pngUrl = canvas.toDataURL('image/png');
        pngCache.set(variant, pngUrl);
        resolve(pngUrl);
      } catch {
        resolve(svgDataUrl);
      }
    };
    img.onerror = () => resolve(svgDataUrl);
    img.src = svgDataUrl;
  });
}

/**
 * Aktualisiert dynamisch das Browser-Favicon, das Apple-Touch-Icon (für iOS/iPadOS Home-Bildschirm)
 * sowie das Web-App-Manifest, damit beim "Zum Startbildschirm hinzufügen" das gewählte Logo genutzt wird.
 */
export function applyDynamicHomeScreenIcon(variant: LogoVariantId): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const svgMarkup = getLogoSvgMarkup(variant, 512);
  const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`;

  const iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (iconLink) {
    iconLink.href = svgDataUrl;
  }

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
      const png256 = renderPng(256);
      const png512 = renderPng(512);

      pngCache.set(variant, png256);

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
