<script lang="ts">
  import type { LogoVariantId } from '../lib/types';

  interface Props {
    variant?: LogoVariantId;
    size?: number;
  }

  let { variant = 'owl', size = 40 }: Props = $props();
</script>

{#if variant === 'owl'}
  <!-- Vorschlag 1: Schlaue Mathe-Eule mit Krone -->
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="owlBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#4F46E5" />
        <stop offset="100%" stop-color="#312E81" />
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="28" fill="url(#owlBg)" />
    <!-- Goldene Krone -->
    <path d="M38 28L46 14L60 24L74 14L82 28H38Z" fill="#FBBF24" stroke="#F59E0B" stroke-width="2" stroke-linejoin="round" />
    <!-- Eulen-Körper & Ohren -->
    <path d="M26 36C26 28 36 26 42 32C48 29 72 29 78 32C84 26 94 28 94 36V76C94 94 79 106 60 106C41 106 26 94 26 76V36Z" fill="#818CF8" />
    <!-- Flügel -->
    <path d="M26 56C19 62 19 80 28 86V56Z" fill="#6366F1" />
    <path d="M94 56C101 62 101 80 92 86V56Z" fill="#6366F1" />
    <!-- Bauch-Schild für 1x1 -->
    <rect x="35" y="68" width="50" height="30" rx="15" fill="#EEF2FF" />
    <text x="60" y="89" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="20" fill="#312E81">1×1</text>
    <!-- Große Eulen-Augen -->
    <circle cx="45" cy="50" r="14" fill="#FFFFFF" />
    <circle cx="75" cy="50" r="14" fill="#FFFFFF" />
    <circle cx="47" cy="50" r="7" fill="#1E1B4B" />
    <circle cx="73" cy="50" r="7" fill="#1E1B4B" />
    <circle cx="49" cy="47" r="2.5" fill="#FFFFFF" />
    <circle cx="75" cy="47" r="2.5" fill="#FFFFFF" />
    <!-- Schnabel -->
    <path d="M54 55L66 55L60 65Z" fill="#F59E0B" />
  </svg>
{:else if variant === 'blocks'}
  <!-- Vorschlag 2: Bunte 3D-Rechenwürfel / Bauklötze -->
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect width="120" height="120" rx="28" fill="#1E1B4B" />
    <!-- Linker Würfel "1" (Koralle/Rot) -->
    <rect x="12" y="42" width="38" height="44" rx="10" fill="#E11D48" />
    <rect x="12" y="38" width="38" height="42" rx="10" fill="#FB7185" />
    <text x="31" y="67" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="26" fill="#FFFFFF">1</text>
    <!-- Oberer mittlerer Würfel "×" (Sonnengelb) -->
    <rect x="41" y="20" width="38" height="44" rx="10" fill="#D97706" />
    <rect x="41" y="16" width="38" height="42" rx="10" fill="#FBBF24" />
    <text x="60" y="45" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#78350F">×</text>
    <!-- Rechter Würfel "1" (Smaragdgrün) -->
    <rect x="70" y="42" width="38" height="44" rx="10" fill="#059669" />
    <rect x="70" y="38" width="38" height="42" rx="10" fill="#34D399" />
    <text x="89" y="67" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="26" fill="#064E3B">1</text>
    <!-- Banner unten -->
    <rect x="24" y="88" width="72" height="20" rx="10" fill="#6366F1" />
    <text x="60" y="102" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="11" letter-spacing="1" fill="#FFFFFF">MEISTER</text>
  </svg>
{:else if variant === 'rocket'}
  <!-- Vorschlag 3: Mathe-Rakete ins All -->
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="spaceBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#1E1B4B" />
        <stop offset="100%" stop-color="#4338CA" />
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="28" fill="url(#spaceBg)" />
    <!-- Kleine Sterne im Hintergrund -->
    <circle cx="24" cy="28" r="3" fill="#FDE047" />
    <circle cx="96" cy="24" r="2.5" fill="#FDE047" />
    <circle cx="98" cy="84" r="3" fill="#38BDF8" />
    <circle cx="22" cy="64" r="2" fill="#A5B4FC" />
    <!-- Raketen-Flamme -->
    <path d="M46 88C46 98 54 108 60 112C66 108 74 98 74 88H46Z" fill="#F97316" />
    <path d="M51 88C51 95 56 102 60 105C64 102 69 95 69 88H51Z" fill="#FDE047" />
    <!-- Raketen-Flügel -->
    <path d="M38 66L24 84L42 86Z" fill="#EF4444" />
    <path d="M82 66L96 84L78 86Z" fill="#EF4444" />
    <!-- Raketen-Rumpf -->
    <path d="M60 12C42 28 38 54 40 88H80C82 54 78 28 60 12Z" fill="#FFFFFF" />
    <!-- Raketen-Spitze -->
    <path d="M60 12C51 20 46 30 44 38H76C74 30 69 20 60 12Z" fill="#EF4444" />
    <!-- Bullauge mit 1x1 -->
    <circle cx="60" cy="60" r="19" fill="#4F46E5" stroke="#CBD5E1" stroke-width="4" />
    <text x="60" y="66" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#FFFFFF">1×1</text>
  </svg>
{:else if variant === 'trophy'}
  <!-- Vorschlag 4: Goldener Meister-Pokal & Wappen -->
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="trophyBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#059669" />
        <stop offset="100%" stop-color="#064E3B" />
      </linearGradient>
      <linearGradient id="goldCup" x1="30" y1="20" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#FEF08A" />
        <stop offset="50%" stop-color="#FBBF24" />
        <stop offset="100%" stop-color="#D97706" />
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="28" fill="url(#trophyBg)" />
    <!-- Pokal-Henkel -->
    <path d="M34 32H22C22 48 30 56 40 56" stroke="#FBBF24" stroke-width="6" stroke-linecap="round" fill="none" />
    <path d="M86 32H98C98 48 90 56 80 56" stroke="#FBBF24" stroke-width="6" stroke-linecap="round" fill="none" />
    <!-- Pokal-Kelch -->
    <path d="M32 22H88V48C88 66 75 78 60 78C45 78 32 66 32 48V22Z" fill="url(#goldCup)" />
    <!-- Pokal-Fuß -->
    <rect x="53" y="76" width="14" height="14" fill="#F59E0B" />
    <rect x="38" y="90" width="44" height="12" rx="6" fill="#FBBF24" />
    <!-- 1x1 auf dem Pokal -->
    <text x="60" y="57" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#78350F">1×1</text>
  </svg>
{:else}
  <!-- Vorschlag 5: Schlauer Rechen-Fuchs -->
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect width="120" height="120" rx="28" fill="#312E81" />
    <!-- Fuchs-Ohren -->
    <path d="M24 16L48 36L22 52Z" fill="#EA580C" />
    <path d="M96 16L72 36L98 52Z" fill="#EA580C" />
    <path d="M28 24L43 36L26 46Z" fill="#FDE68A" />
    <path d="M92 24L77 36L94 46Z" fill="#FDE68A" />
    <!-- Fuchs-Kopf -->
    <path d="M22 48C22 30 38 24 60 24C82 24 98 30 98 48C98 68 78 82 60 84C42 82 22 68 22 48Z" fill="#F97316" />
    <!-- Weiße Wangen -->
    <path d="M22 52C34 52 48 64 60 84C40 82 22 68 22 52Z" fill="#FFFBEB" />
    <path d="M98 52C86 52 72 64 60 84C80 82 98 68 98 52Z" fill="#FFFBEB" />
    <!-- Augen & Nase -->
    <circle cx="43" cy="48" r="5.5" fill="#1E1B4B" />
    <circle cx="77" cy="48" r="5.5" fill="#1E1B4B" />
    <circle cx="45" cy="46" r="2" fill="#FFFFFF" />
    <circle cx="79" cy="46" r="2" fill="#FFFFFF" />
    <circle cx="60" cy="68" r="5" fill="#1E1B4B" />
    <!-- 1x1 Schild unten -->
    <rect x="28" y="84" width="64" height="24" rx="12" fill="#10B981" />
    <text x="60" y="101" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="17" fill="#FFFFFF">1×1</text>
  </svg>
{/if}
