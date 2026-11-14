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

  function getFactForCell(a: number, b: number): FactFamily | undefined {
    return facts.find((f) => f.a === a && f.b === b);
  }

  function getStatus(a: number, b: number): MasteryStatus {
    const f = getFactForCell(a, b);
    return f ? getFactMastery(f) : 'new';
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

  let selectedFact = $state<FactFamily | null>(null);
</script>

<section class="bg-white dark:bg-[#111827] rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs" aria-label="Wissenskarte">
  <div class="flex items-center justify-between mb-2">
    <div>
      <h3 class="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 m-0">
        <span>🗺️</span>
        <span>{gameMode === 'mult' ? '1×1 Wissenskarte' : 'Zahlen-Held Wissenskarte'}</span>
      </h3>
      <span class="text-[10px] text-slate-400">
        100 Fakten im Überblick · Tippe auf ein Feld
      </span>
    </div>

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

  <!-- 10x10 Matrix Grid -->
  <div class="aspect-square w-full max-w-sm mx-auto grid grid-cols-10 gap-0.5 sm:gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
    {#each numbers as b}
      {#each numbers as a}
        {@const st = getStatus(a, b)}
        {@const fact = getFactForCell(a, b)}
        <button
          type="button"
          onclick={() => {
            if (fact) {
              selectedFact = fact;
              if (onPracticeFact) onPracticeFact(fact);
            }
          }}
          class="aspect-square rounded-sm sm:rounded-md transition-transform hover:scale-115 hover:z-10 cursor-pointer border-none p-0 flex items-center justify-center text-[8px] sm:text-[9.5px] font-black {
            st === 'mastered'
              ? 'bg-emerald-500 text-white shadow-xs'
              : st === 'wrong'
              ? 'bg-rose-500 text-white animate-pulse'
              : st === 'learning'
              ? 'bg-amber-400 text-amber-950'
              : 'bg-white dark:bg-slate-800 text-slate-400 hover:bg-slate-200'
          }"
          title="{a} {gameMode === 'mult' ? '×' : '+'} {b} = {fact?.c} ({st})"
          aria-label="{a} {gameMode === 'mult' ? 'mal' : 'plus'} {b}"
        >
          {fact ? fact.c : ''}
        </button>
      {/each}
    {/each}
  </div>
</section>
