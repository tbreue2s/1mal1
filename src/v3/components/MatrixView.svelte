<script lang="ts">
  import { getFactMastery } from '../lib/sm2';
  import type { FactFamily, GameMode, MasteryStatus, TaskVariant } from '../lib/types';

  interface Props {
    gameMode: GameMode;
    facts: FactFamily[];
    onSwitchGameMode: (mode: GameMode) => void;
    onPracticeFact: (fact: FactFamily) => void;
    onBack: () => void;
  }

  let {
    gameMode,
    facts,
    onSwitchGameMode,
    onPracticeFact,
    onBack,
  }: Props = $props();

  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  let selectedFact = $state<FactFamily | null>(null);

  function getFact(a: number, b: number): FactFamily | undefined {
    return facts.find((f) => f.a === a && f.b === b);
  }

  function getStatus(a: number, b: number): MasteryStatus {
    const f = getFact(a, b);
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

  function getVariantName(v: TaskVariant): string {
    switch (v) {
      case 'mult':
        return 'Malnehmen (a × b = ?)';
      case 'div':
        return 'Geteilt / Umkehrung (c : b = ?)';
      case 'gap_mult_b':
        return 'Lückenaufgabe (a × ? = c)';
      case 'gap_mult_a':
        return 'Lückenaufgabe (? × b = c)';
      case 'gap_div_c':
        return 'Geteilt-Lücke (? : b = a)';
      case 'gap_div_a':
        return 'Geteilt-Lücke (c : ? = b)';
      case 'add':
        return 'Plusaufgabe (a + b = ?)';
      case 'sub':
        return 'Minusaufgabe (c − b = ?)';
      case 'gap_add_b':
        return 'Ergänzen (a + ? = c)';
      case 'gap_add_a':
        return 'Plus-Lücke (? + b = c)';
      case 'gap_sub_b':
        return 'Minus-Lücke (c − ? = a)';
      case 'gap_sub_c':
        return 'Minus-Lücke (? − b = a)';
    }
  }
</script>

<div class="w-full max-w-2xl mx-auto space-y-4 pb-8">
  <!-- Header -->
  <div class="flex items-center justify-between bg-white dark:bg-[#111827] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
    <div>
      <h2 class="text-base font-extrabold text-slate-900 dark:text-white m-0">
        {gameMode === 'mult' ? 'Große 1×1-Tafel' : 'Große Zahlen-Held-Tafel'}
      </h2>
      <p class="text-xs text-slate-400 m-0">
        Alle 100 Fakten im didaktischen Beherrschungs-Status
      </p>
    </div>

    <button
      type="button"
      onclick={onBack}
      class="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold border-none cursor-pointer"
    >
      ← Zurück
    </button>
  </div>

  <!-- Modus-Umschalter -->
  <div class="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
    <button
      type="button"
      onclick={() => onSwitchGameMode('plusminus')}
      class="py-2 rounded-xl text-xs font-extrabold border-none cursor-pointer transition {
        gameMode === 'plusminus'
          ? 'bg-white dark:bg-[#111827] text-indigo-600 dark:text-indigo-400 shadow-xs'
          : 'bg-transparent text-slate-600 dark:text-slate-400'
      }"
    >
      ➕ Zahlen-Held (+ / −)
    </button>
    <button
      type="button"
      onclick={() => onSwitchGameMode('mult')}
      class="py-2 rounded-xl text-xs font-extrabold border-none cursor-pointer transition {
        gameMode === 'mult'
          ? 'bg-white dark:bg-[#111827] text-indigo-600 dark:text-indigo-400 shadow-xs'
          : 'bg-transparent text-slate-600 dark:text-slate-400'
      }"
    >
      ✖️ 1×1 Meister (× / :)
    </button>
  </div>

  <!-- Status-Kacheln -->
  <div class="grid grid-cols-4 gap-2 text-center text-xs">
    <div class="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-2.5 rounded-2xl">
      <span class="text-lg font-black text-emerald-600 dark:text-emerald-400 block">{counts.mastered}</span>
      <span class="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase">Gemeistert</span>
    </div>
    <div class="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-2.5 rounded-2xl">
      <span class="text-lg font-black text-amber-600 dark:text-amber-400 block">{counts.learning}</span>
      <span class="text-[10px] text-amber-800 dark:text-amber-300 font-bold uppercase">Im Lernen</span>
    </div>
    <div class="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-2.5 rounded-2xl">
      <span class="text-lg font-black text-rose-600 dark:text-rose-400 block">{counts.wrong}</span>
      <span class="text-[10px] text-rose-800 dark:text-rose-300 font-bold uppercase">Wiederholen</span>
    </div>
    <div class="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-2.5 rounded-2xl">
      <span class="text-lg font-black text-slate-600 dark:text-slate-400 block">{counts.fresh}</span>
      <span class="text-[10px] text-slate-500 font-bold uppercase">Neu</span>
    </div>
  </div>

  <!-- Große 10x10 Matrix -->
  <div class="bg-white dark:bg-[#111827] rounded-3xl p-3 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-x-auto">
    <div class="min-w-[320px]">
      <!-- Spalten-Header -->
      <div class="grid grid-cols-11 gap-1 text-center font-black text-[10px] text-slate-400 mb-1">
        <div>{gameMode === 'mult' ? '×' : '+'}</div>
        {#each numbers as a}
          <div>{a}</div>
        {/each}
      </div>

      <!-- Zeilen -->
      {#each numbers as b}
        <div class="grid grid-cols-11 gap-1 text-center items-center my-0.5">
          <div class="font-black text-[10px] text-slate-400">{b}</div>
          {#each numbers as a}
            {@const st = getStatus(a, b)}
            {@const f = getFact(a, b)}
            <button
              type="button"
              onclick={() => {
                if (f) selectedFact = f;
              }}
              class="aspect-square rounded-lg flex items-center justify-center text-xs font-black transition-transform hover:scale-115 hover:z-10 cursor-pointer border-none {
                st === 'mastered'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : st === 'wrong'
                  ? 'bg-rose-500 text-white animate-pulse'
                  : st === 'learning'
                  ? 'bg-amber-400 text-amber-950'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }"
              title="{a} {gameMode === 'mult' ? '×' : '+'} {b} = {f?.c}"
            >
              {f ? f.c : ''}
            </button>
          {/each}
        </div>
      {/each}
    </div>
  </div>
</div>

<!-- FAKTEN-DETAIL MODAL -->
{#if selectedFact}
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
    onclick={(e) => {
      if (e.target === e.currentTarget) selectedFact = null;
    }}
    onkeydown={(e) => {
      if (e.key === 'Escape') selectedFact = null;
    }}
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    aria-label="Fakten-Details"
  >
    <div class="w-full max-w-sm bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span class="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
            Fakten-Familie
          </span>
          <h3 class="text-2xl font-black text-slate-900 dark:text-white m-0">
            {selectedFact.a} {selectedFact.mode === 'mult' ? '×' : '+'} {selectedFact.b} = {selectedFact.c}
          </h3>
        </div>
        <button
          type="button"
          onclick={() => (selectedFact = null)}
          class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 text-xs font-bold border-none cursor-pointer flex items-center justify-center"
        >
          ✕
        </button>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl">
        <div>
          <span class="text-[9px] text-slate-400 block font-bold uppercase">Status</span>
          <span class="font-extrabold text-slate-800 dark:text-slate-200">
            {getFactMastery(selectedFact)}
          </span>
        </div>
        <div>
          <span class="text-[9px] text-slate-400 block font-bold uppercase">Versuche</span>
          <span class="font-extrabold text-slate-800 dark:text-slate-200">
            {selectedFact.correctAttempts} / {selectedFact.totalAttempts}
          </span>
        </div>
        <div>
          <span class="text-[9px] text-slate-400 block font-bold uppercase">Intervall</span>
          <span class="font-extrabold text-indigo-600 dark:text-indigo-400">
            {selectedFact.interval} Tag(e)
          </span>
        </div>
      </div>

      <!-- Transferformen -->
      <div>
        <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
          Gemeisterte Abfrageformen ({selectedFact.masteredVariants.length}):
        </span>
        {#if selectedFact.masteredVariants.length === 0}
          <div class="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/30 p-2 rounded-xl">
            Noch keine Form sicher gemeistert.
          </div>
        {:else}
          <div class="space-y-1">
            {#each selectedFact.masteredVariants as mv}
              <div class="flex items-center justify-between text-xs font-semibold p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
                <span>{getVariantName(mv)}</span>
                <span class="font-black">✓</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Action Button -->
      <button
        type="button"
        onclick={() => {
          const f = selectedFact;
          selectedFact = null;
          if (f) onPracticeFact(f);
        }}
        class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition btn-calm-primary cursor-pointer border-none"
      >
        <span>🎯</span>
        <span>Diesen Fakt jetzt gezielt üben</span>
      </button>
    </div>
  </div>
{/if}
