<script lang="ts">
  import { formatEquationParts } from '../lib/generator';
  import { getCardMastery } from '../lib/sm2';
  import type { GameMode, TaskCard } from '../lib/types';

  export type HeatmapStatus =
    | 'new'
    | 'wrong'
    | 'learning'
    | 'mastered_basic'
    | 'mastered_all';

  interface Props {
    gameMode: GameMode;
    cards: TaskCard[];
    onPracticeFact: (cardsForFact: TaskCard[]) => void;
    onPracticeRow: (row: number) => void;
    onOpenFullscreen: () => void;
  }

  let {
    gameMode,
    cards,
    onPracticeFact,
    onPracticeRow,
    onOpenFullscreen,
  }: Props = $props();

  const factors = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  let selectedCell = $state<{ a: number; b: number } | null>(null);
  let activeFilter = $state<'none' | 'doubles' | 'bonds10' | 'squares'>('none');

  function getCardsForFact(a: number, b: number): TaskCard[] {
    return cards.filter((c) => c.fact[0] === a && c.fact[1] === b);
  }

  function getCellStatus(a: number, b: number): HeatmapStatus {
    const factCards = getCardsForFact(a, b);
    if (factCards.length === 0) return 'new';

    const attempted = factCards.filter((c) => c.totalAttempts > 0);
    if (attempted.length === 0) return 'new';

    // Fehler / Kürzlich falsch beantwortet (repetitions === 0 oder lastQuality === 0)
    const hasError = attempted.some(
      (c) => c.repetitions === 0 || c.lastQuality === 0
    );
    if (hasError) return 'wrong';

    // Alle Varianten gemeistert?
    const allMastered =
      factCards.length >= 3 &&
      factCards.every((c) => getCardMastery(c) === 'mastered');
    if (allMastered) return 'mastered_all';

    // Grundaufgabe gemeistert?
    const basicCard = factCards.find((c) => c.type === 'mult' || c.type === 'add');
    if (basicCard && getCardMastery(basicCard) === 'mastered') {
      return 'mastered_basic';
    }

    return 'learning';
  }

  function isHighlighted(a: number, b: number): boolean {
    if (activeFilter === 'none') return false;
    if (activeFilter === 'doubles') return a === b;
    if (activeFilter === 'squares') return a === b;
    if (activeFilter === 'bonds10') return a + b === 10;
    return false;
  }

  function toggleFilter(filter: 'doubles' | 'bonds10' | 'squares') {
    activeFilter = activeFilter === filter ? 'none' : filter;
  }

  let selectedFactCards = $derived(
    selectedCell ? getCardsForFact(selectedCell.a, selectedCell.b) : []
  );

  let selectedStatus = $derived(
    selectedCell ? getCellStatus(selectedCell.a, selectedCell.b) : 'new'
  );

  function getStatusLabel(st: HeatmapStatus): string {
    if (st === 'mastered_all') return 'Perfekt gemeistert ⭐';
    if (st === 'mastered_basic') return 'Grundaufgabe sitzt ✓';
    if (st === 'learning') return 'Im Training 🧠';
    if (st === 'wrong') return 'Wiederholungsbedarf ⚠️';
    return 'Noch unentdeckt';
  }

  function variantTypeName(card: TaskCard): string {
    if (card.type === 'mult') return 'Malnehmen';
    if (card.type === 'div') return 'Geteilt';
    if (card.type === 'add') return 'Plusrechnen';
    if (card.type === 'sub') return 'Minus';
    if (card.type === 'gap_add_b' || card.type === 'gap_mult_b') return 'Lücke rechts';
    if (card.type === 'gap_add_a' || card.type === 'gap_mult_a') return 'Lücke links';
    return 'Lücke';
  }
</script>

<section
  class="bg-white dark:bg-[#111827] rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs"
  aria-label="Wissens-Heatmap"
>
  <!-- Header -->
  <div class="flex items-center justify-between mb-2.5">
    <div>
      <h3 class="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 m-0">
        <span>🗺️</span>
        <span>{gameMode === 'mult' ? '1×1-Wissenskarte' : '1+1-Wissenskarte'}</span>
      </h3>
      <span class="text-[10px] text-slate-400">
        Tippe auf ein Feld für Lücken-Details
      </span>
    </div>

    <!-- Filter Buttons & Fullscreen -->
    <div class="flex items-center gap-1.5">
      {#if gameMode === 'mult'}
        <button
          type="button"
          onclick={() => toggleFilter('squares')}
          class="px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer transition {
            activeFilter === 'squares'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }"
        >
          💡 Quadrat
        </button>
      {:else}
        <button
          type="button"
          onclick={() => toggleFilter('bonds10')}
          class="px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer transition {
            activeFilter === 'bonds10'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }"
        >
          ❤️ = 10
        </button>
      {/if}

      <button
        type="button"
        onclick={onOpenFullscreen}
        class="text-[10px] font-bold text-slate-400 hover:text-indigo-500 bg-transparent border-none p-0 cursor-pointer ml-1"
        title="Vollbild-Tafel öffnen"
      >
        Tafel ↗
      </button>
    </div>
  </div>

  <!-- Die 10x10 Heatmap Grid -->
  <div class="w-full overflow-x-auto pb-1 custom-scroll">
    <div class="grid grid-cols-11 gap-1 min-w-[290px] select-none">
      <!-- Obere linke Ecke -->
      <div class="h-6 rounded-md bg-indigo-600 dark:bg-indigo-700 text-white flex items-center justify-center text-[10px] font-black">
        {gameMode === 'mult' ? '×' : '+'}
      </div>

      <!-- Spalten-Header (b = 1..10) -->
      {#each factors as col (col)}
        <div class="h-6 rounded-md bg-slate-100 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 flex items-center justify-center text-[9.5px] font-extrabold">
          {col}
        </div>
      {/each}

      <!-- Zeilen (a = 1..10) -->
      {#each factors as a (a)}
        <!-- Zeilen-Header (a) -->
        <div class="h-6 sm:h-7 rounded-md bg-slate-100 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 flex items-center justify-center text-[9.5px] font-extrabold">
          {a}
        </div>

        <!-- Datenzellen (a x b bzw. a + b) -->
        {#each factors as b (`${a}_${b}`)}
          {@const st = getCellStatus(a, b)}
          {@const res = gameMode === 'mult' ? a * b : a + b}
          {@const isHL = isHighlighted(a, b)}
          {@const isSelected = selectedCell?.a === a && selectedCell?.b === b}

          <button
            type="button"
            onclick={() => (selectedCell = { a, b })}
            class="h-6 sm:h-7 rounded-md flex items-center justify-center text-[9px] sm:text-[10px] font-extrabold cursor-pointer transition transform active:scale-90 p-0 border {
              isSelected
                ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 z-10 scale-105'
                : isHL
                ? 'ring-2 ring-amber-400 dark:ring-amber-300 z-10'
                : ''
            } {
              st === 'mastered_all'
                ? 'bg-emerald-500 dark:bg-emerald-600 text-white border-emerald-400/80 dark:border-emerald-500 shadow-2xs font-black'
                : st === 'mastered_basic'
                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : st === 'learning'
                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                : st === 'wrong'
                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-black'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200/70 dark:border-slate-800'
            }"
            title="{a} {gameMode === 'mult' ? '×' : '+'} {b} = {res} ({getStatusLabel(st)})"
          >
            {res}
          </button>
        {/each}
      {/each}
    </div>
  </div>

  <!-- Legende (Farbverlauf von Neutral nach Grün) -->
  <div class="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400 flex-wrap gap-1">
    <div class="flex items-center gap-1">
      <span class="w-2.5 h-2.5 rounded-sm bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700"></span>
      <span>Neu</span>
    </div>
    <div class="flex items-center gap-1">
      <span class="w-2.5 h-2.5 rounded-sm bg-rose-200 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-700"></span>
      <span>Üben ⚠️</span>
    </div>
    <div class="flex items-center gap-1">
      <span class="w-2.5 h-2.5 rounded-sm bg-amber-200 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700"></span>
      <span>Training</span>
    </div>
    <div class="flex items-center gap-1">
      <span class="w-2.5 h-2.5 rounded-sm bg-emerald-200 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700"></span>
      <span>Sicher ✓</span>
    </div>
    <div class="flex items-center gap-1">
      <span class="w-2.5 h-2.5 rounded-sm bg-emerald-500 dark:bg-emerald-600 border border-emerald-400"></span>
      <span>Perfekt ⭐</span>
    </div>
  </div>
</section>

<!-- Aufgaben-Detail Drawer beim Antippen einer Zelle -->
{#if selectedCell !== null}
  {@const a = selectedCell.a}
  {@const b = selectedCell.b}
  {@const res = gameMode === 'mult' ? a * b : a + b}

  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center p-2"
    onclick={(e) => {
      if (e.target === e.currentTarget) selectedCell = null;
    }}
    onkeydown={(e) => {
      if (e.key === 'Escape') selectedCell = null;
    }}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-label="Aufgaben-Details"
  >
    <div
      class="w-full max-w-md bg-white dark:bg-[#111827] border-t-2 border-x-2 border-slate-200 dark:border-slate-700 rounded-3xl p-4 shadow-2xl animate-slide-up text-slate-800 dark:text-slate-100"
    >
      <!-- Header -->
      <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
        <div class="flex items-center gap-2">
          <span class="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-base border border-indigo-200 dark:border-indigo-900">
            {res}
          </span>
          <div>
            <h4 class="text-sm font-extrabold text-slate-900 dark:text-white m-0">
              {a} {gameMode === 'mult' ? '×' : '+'} {b} = {res}
            </h4>
            <p class="text-[11px] text-slate-400 m-0">
              Status: <strong class="text-indigo-500 dark:text-indigo-400">{getStatusLabel(selectedStatus)}</strong>
            </p>
          </div>
        </div>
        <button
          type="button"
          onclick={() => (selectedCell = null)}
          class="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold border-none cursor-pointer flex items-center justify-center"
        >
          ✕
        </button>
      </div>

      <!-- Aufgaben-Varianten für dieses Feld -->
      <div class="space-y-1.5 mb-3.5 max-h-48 overflow-y-auto custom-scroll">
        {#each selectedFactCards as card (card.id)}
          {@const eq = formatEquationParts(card)}
          {@const mast = getCardMastery(card)}
          <div
            class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
          >
            <div>
              <span class="font-extrabold text-slate-900 dark:text-white">
                {eq.fullEquationWithSolution}
              </span>
              <span class="text-[10px] text-slate-400 block">
                {variantTypeName(card)}
              </span>
            </div>
            <span
              class="text-[10px] font-bold px-1.5 py-0.5 rounded-md {
                mast === 'mastered'
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                  : card.repetitions === 0 && card.totalAttempts > 0
                  ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                  : card.totalAttempts > 0
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                  : 'bg-slate-200/60 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }"
            >
              {mast === 'mastered'
                ? 'Gemeistert ✓'
                : card.repetitions === 0 && card.totalAttempts > 0
                ? 'Wiederholen ⚠️'
                : card.totalAttempts > 0
                ? `${card.repetitions}× sicher`
                : 'Noch neu'}
            </span>
          </div>
        {/each}
      </div>

      <!-- Buttons: Nur dieses Feld üben ODER ganze Reihe üben -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          onclick={() => {
            const fCards = selectedFactCards;
            selectedCell = null;
            if (fCards.length > 0) onPracticeFact(fCards);
          }}
          class="flex-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition btn-calm-primary cursor-pointer border-none"
        >
          <span>⚡</span>
          <span>Nur {a} {gameMode === 'mult' ? '×' : '+'} {b} üben</span>
        </button>

        <button
          type="button"
          onclick={() => {
            const rowToPractice = selectedCell?.b;
            selectedCell = null;
            if (rowToPractice !== undefined) onPracticeRow(rowToPractice);
          }}
          class="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold border-none cursor-pointer"
        >
          {gameMode === 'mult' ? `${selectedCell?.b}er-Reihe` : `+${selectedCell?.b}-Reihe`}
        </button>
      </div>
    </div>
  </div>
{/if}

