<script lang="ts">
  import { getFactMastery } from '../lib/sm2';
  import type { FactFamily, GameMode, MasteryStatus } from '../lib/types';

  interface Props {
    gameMode: GameMode;
    facts: FactFamily[];
    onPracticeFact?: (fact: FactFamily) => void;
    onOpenFullscreen?: () => void;
  }

  let {
    gameMode,
    facts,
    onPracticeFact,
    onOpenFullscreen,
  }: Props = $props();

  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  let selectedFact = $state<FactFamily | null>(null);
  let hoveredCell = $state<{ a: number; b: number } | null>(null);
  let activeFilter = $state<'none' | 'squares' | 'core' | 'bonds10' | 'doubles'>('none');

  function getFactForCell(a: number, b: number): FactFamily | undefined {
    return facts.find((f) => f.a === a && f.b === b);
  }

  function getStatus(a: number, b: number): MasteryStatus {
    const f = getFactForCell(a, b);
    return f ? getFactMastery(f) : 'new';
  }

  function getStatusLabel(st: MasteryStatus): string {
    switch (st) {
      case 'mastered':
        return 'Gemeistert ⭐';
      case 'learning':
        return 'Im Lernen 🧠';
      case 'wrong':
        return 'Wiederholen ⚠️';
      default:
        return 'Neu ⏳';
    }
  }

  function isHighlighted(a: number, b: number): boolean {
    if (activeFilter === 'none') return false;
    if (activeFilter === 'squares' || activeFilter === 'doubles') return a === b;
    if (activeFilter === 'bonds10') return a + b === 10;
    if (activeFilter === 'core') {
      return a === 1 || a === 2 || a === 5 || a === 10 || b === 1 || b === 2 || b === 5 || b === 10;
    }
    return false;
  }

  function toggleFilter(filter: 'squares' | 'core' | 'bonds10' | 'doubles') {
    activeFilter = activeFilter === filter ? 'none' : filter;
  }

  let counts = $derived.by(() => {
    let mastered = 0;
    let learning = 0;
    let wrong = 0;
    let fresh = 0;

    for (const f of facts) {
      const st = getFactMastery(f);
      if (st === 'mastered') mastered++;
      else if (st === 'wrong') wrong++;
      else if (st === 'learning') learning++;
      else fresh++;
    }
    return { mastered, learning, wrong, fresh };
  });

  let activeA = $derived(hoveredCell?.a ?? selectedFact?.a ?? null);
  let activeB = $derived(hoveredCell?.b ?? selectedFact?.b ?? null);
</script>

<section class="bg-white dark:bg-[#111827] rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs" aria-label="Wissenskarte">
  <div class="flex items-center justify-between mb-2">
    <div>
      <h3 class="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 m-0">
        <span>🗺️</span>
        <span>{gameMode === 'mult' ? '1×1 Wissenskarte' : 'Zahlen-Held Wissenskarte'}</span>
      </h3>
      <span class="text-[10px] text-slate-400">
        Zeile × Spalte · Tippe auf ein Feld für Details
      </span>
    </div>

    <div class="flex items-center gap-1.5">
      {#if gameMode === 'mult'}
        <button
          type="button"
          onclick={() => toggleFilter('squares')}
          class="text-[9.5px] font-bold px-2 py-0.5 rounded-lg border cursor-pointer transition {
            activeFilter === 'squares'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }"
        >
          💡 Quadrate
        </button>
      {:else}
        <button
          type="button"
          onclick={() => toggleFilter('bonds10')}
          class="text-[9.5px] font-bold px-2 py-0.5 rounded-lg border cursor-pointer transition {
            activeFilter === 'bonds10'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }"
        >
          ❤️ = 10
        </button>
      {/if}

      {#if onOpenFullscreen}
        <button
          type="button"
          onclick={onOpenFullscreen}
          class="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800/40 px-2 py-1 rounded-lg cursor-pointer"
        >
          Große Tafel ›
        </button>
      {/if}
    </div>
  </div>

  <!-- Status-Legende -->
  <div class="flex items-center justify-between text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl mb-2.5">
    <div class="flex items-center gap-1">
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
      <span>{counts.mastered} Gemeistert</span>
    </div>
    <div class="flex items-center gap-1">
      <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
      <span>{counts.learning} Im Lernen</span>
    </div>
    {#if counts.wrong > 0}
      <div class="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-extrabold">
        <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
        <span>{counts.wrong} Wiederholen</span>
      </div>
    {/if}
    <div class="flex items-center gap-1 text-slate-400">
      <span class="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700"></span>
      <span>{counts.fresh} Neu</span>
    </div>
  </div>

  <!-- 11x11 Matrix Grid (Zahlen oben und links für volle Übersicht) -->
  <div class="w-full overflow-x-auto pb-1">
    <div class="grid grid-cols-11 gap-0.5 sm:gap-1 min-w-[280px] max-w-sm mx-auto p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-900 rounded-2xl select-none">
      
      <!-- Obere linke Ecke (Operator) -->
      <div class="aspect-square rounded-md bg-indigo-600 dark:bg-indigo-700 text-white flex items-center justify-center text-[10px] sm:text-xs font-black shadow-xs">
        {gameMode === 'mult' ? '×' : '+'}
      </div>

      <!-- Spalten-Header oben (b = 1..10) -->
      {#each numbers as b}
        {@const isColActive = activeB === b}
        <div class="aspect-square rounded-md flex items-center justify-center text-[9px] sm:text-[10px] font-black transition-colors {
          isColActive
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
        }">
          {b}
        </div>
      {/each}

      <!-- Zeilen (a = 1..10) -->
      {#each numbers as a}
        <!-- Zeilen-Header links (a) -->
        {@const isRowActive = activeA === a}
        <div class="aspect-square rounded-md flex items-center justify-center text-[9px] sm:text-[10px] font-black transition-colors {
          isRowActive
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
        }">
          {a}
        </div>

        <!-- 10 Datenzellen für Zeile a -->
        {#each numbers as b}
          {@const st = getStatus(a, b)}
          {@const fact = getFactForCell(a, b)}
          {@const isSelected = selectedFact?.a === a && selectedFact?.b === b}
          {@const isHL = isHighlighted(a, b)}
          {@const isInCrosshair = activeA === a || activeB === b}

          <button
            type="button"
            onclick={() => {
              if (fact) {
                selectedFact = selectedFact?.id === fact.id ? null : fact;
              }
            }}
            onmouseenter={() => (hoveredCell = { a, b })}
            onmouseleave={() => (hoveredCell = null)}
            class="aspect-square rounded-md transition-transform hover:scale-120 hover:z-20 cursor-pointer border-none p-0 flex items-center justify-center text-[8px] sm:text-[9.5px] font-black {
              isSelected
                ? 'ring-2 ring-indigo-500 scale-110 z-10'
                : isHL
                ? 'ring-2 ring-amber-400 z-10'
                : ''
            } {
              st === 'mastered'
                ? 'bg-emerald-500 text-white shadow-xs'
                : st === 'wrong'
                ? 'bg-rose-500 text-white animate-pulse'
                : st === 'learning'
                ? 'bg-amber-400 text-amber-950'
                : isInCrosshair
                ? 'bg-indigo-100/70 dark:bg-slate-700 text-indigo-900 dark:text-indigo-200'
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }"
            title="{a} {gameMode === 'mult' ? '×' : '+'} {b} = {fact?.c} ({getStatusLabel(st)})"
            aria-label="{a} {gameMode === 'mult' ? 'mal' : 'plus'} {b} ist {fact?.c}"
          >
            {fact ? fact.c : ''}
          </button>
        {/each}
      {/each}
    </div>
  </div>

  <!-- Schnell-Inspektion bei ausgewählter Zelle -->
  {#if selectedFact}
    <div class="mt-2.5 p-2.5 sm:p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-2 animate-fade-in">
      <div class="truncate">
        <div class="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-100">
          {selectedFact.a} {selectedFact.mode === 'mult' ? '×' : '+'} {selectedFact.b} = {selectedFact.c}
        </div>
        <div class="text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold">
          Status: {getStatusLabel(getFactMastery(selectedFact))} · {selectedFact.correctAttempts} von {selectedFact.totalAttempts} gelöst
        </div>
      </div>
      {#if onPracticeFact}
        <button
          type="button"
          onclick={() => {
            const f = selectedFact;
            selectedFact = null;
            if (f) onPracticeFact(f);
          }}
          class="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black border-none cursor-pointer shadow-xs transition"
        >
          🎯 Gezielt üben →
        </button>
      {/if}
    </div>
  {/if}
</section>
