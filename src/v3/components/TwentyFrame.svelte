<script lang="ts">
  import type { FactFamily, TaskVariant } from '../lib/types';

  interface Props {
    fact: FactFamily;
    variant: TaskVariant;
  }

  let { fact, variant }: Props = $props();

  let a = $derived(fact.a);
  let b = $derived(fact.b);
  let c = $derived(fact.c);
  let isSub = $derived(
    variant === 'sub' || variant === 'gap_sub_b' || variant === 'gap_sub_c'
  );

  // 4 Fünferblöcke für das klassische 20er-Feld:
  // Zeile 1: Block 1 (1..5), Block 2 (6..10)
  // Zeile 2: Block 3 (11..15), Block 4 (16..20)
  const block1 = [1, 2, 3, 4, 5];
  const block2 = [6, 7, 8, 9, 10];
  const block3 = [11, 12, 13, 14, 15];
  const block4 = [16, 17, 18, 19, 20];

  function getDotState(idx: number): 'blue' | 'red' | 'subtracted' | 'empty' {
    if (!isSub) {
      // Addition
      if (idx <= a) return 'blue';
      if (idx <= c) return 'red';
      return 'empty';
    } else {
      // Subtraktion: c Gesamt, b abgezogen, a übrig
      if (idx <= a) return 'blue';
      if (idx <= c) return 'subtracted';
      return 'empty';
    }
  }

  // Didaktische Erklärung des Mengenschritts
  let explanation = $derived.by(() => {
    if (!isSub) {
      if (c === 10) {
        return `${a} blaue und ${b} rote Punkte füllen zusammen genau die Zehner-Reihe!`;
      }
      if (a < 10 && c > 10) {
        const toTen = 10 - a;
        const rest = b - toTen;
        return `Zehnerstopp: Erst ${toTen} rote Punkte zur 10 (${a} + ${toTen} = 10), dann noch ${rest} rote in Reihe 2 = ${c}.`;
      }
      return `${a} blaue Punkte + ${b} rote Punkte = ${c} Punkte gesamt.`;
    } else {
      if (c > 10 && a < 10) {
        const fromRow2 = c - 10;
        const fromRow1 = b - fromRow2;
        return `Rückwärts über die 10: Erst ${fromRow2} aus Reihe 2 weg, dann noch ${fromRow1} weg = ${a}.`;
      }
      return `Von ${c} Punkten werden ${b} weggenommen = ${a} bleiben übrig.`;
    }
  });
</script>

<div class="my-2.5 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 select-none">
  <div class="flex items-center justify-between text-[11px] font-black text-indigo-950 dark:text-indigo-200 mb-2.5">
    <span>🔵🔴 20er-Punktefeld:</span>
    <span class="text-[10px] text-slate-400 font-semibold">Kraft der 5 &amp; Zehnerstopp</span>
  </div>

  <!-- 20er Feld Container: 2 Zeilen à 2 Fünferblöcke -->
  <div class="space-y-2 max-w-xs mx-auto">
    <!-- Zeile 1: 1 bis 10 -->
    <div class="flex items-center justify-between p-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      <!-- Block 1: 1..5 -->
      <div class="grid grid-cols-5 gap-1.5 flex-1">
        {#each block1 as idx}
          {@const st = getDotState(idx)}
          <div
            class="aspect-square w-full rounded-full flex items-center justify-center transition-all box-border {
              st === 'blue'
                ? 'bg-blue-500 border-2 border-blue-600 shadow-xs'
                : st === 'red'
                ? 'bg-rose-500 border-2 border-rose-600 shadow-xs'
                : st === 'subtracted'
                ? 'bg-rose-100 dark:bg-rose-950/80 border-2 border-rose-300 dark:border-rose-700 text-rose-600 font-black text-[10px]'
                : 'border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
            }"
            title="Feld {idx}"
          >
            {#if st === 'subtracted'}
              ✕
            {/if}
          </div>
        {/each}
      </div>

      <!-- Fünfer-Trennlinie -->
      <div class="w-0.5 h-6 bg-slate-300 dark:bg-slate-700 mx-2 rounded-full shrink-0"></div>

      <!-- Block 2: 6..10 -->
      <div class="grid grid-cols-5 gap-1.5 flex-1">
        {#each block2 as idx}
          {@const st = getDotState(idx)}
          <div
            class="aspect-square w-full rounded-full flex items-center justify-center transition-all box-border {
              st === 'blue'
                ? 'bg-blue-500 border-2 border-blue-600 shadow-xs'
                : st === 'red'
                ? 'bg-rose-500 border-2 border-rose-600 shadow-xs'
                : st === 'subtracted'
                ? 'bg-rose-100 dark:bg-rose-950/80 border-2 border-rose-300 dark:border-rose-700 text-rose-600 font-black text-[10px]'
                : 'border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
            }"
            title="Feld {idx}"
          >
            {#if st === 'subtracted'}
              ✕
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Zeile 2: 11 bis 20 -->
    <div class="flex items-center justify-between p-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      <!-- Block 3: 11..15 -->
      <div class="grid grid-cols-5 gap-1.5 flex-1">
        {#each block3 as idx}
          {@const st = getDotState(idx)}
          <div
            class="aspect-square w-full rounded-full flex items-center justify-center transition-all box-border {
              st === 'blue'
                ? 'bg-blue-500 border-2 border-blue-600 shadow-xs'
                : st === 'red'
                ? 'bg-rose-500 border-2 border-rose-600 shadow-xs'
                : st === 'subtracted'
                ? 'bg-rose-100 dark:bg-rose-950/80 border-2 border-rose-300 dark:border-rose-700 text-rose-600 font-black text-[10px]'
                : 'border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
            }"
            title="Feld {idx}"
          >
            {#if st === 'subtracted'}
              ✕
            {/if}
          </div>
        {/each}
      </div>

      <!-- Fünfer-Trennlinie -->
      <div class="w-0.5 h-6 bg-slate-300 dark:bg-slate-700 mx-2 rounded-full shrink-0"></div>

      <!-- Block 4: 16..20 -->
      <div class="grid grid-cols-5 gap-1.5 flex-1">
        {#each block4 as idx}
          {@const st = getDotState(idx)}
          <div
            class="aspect-square w-full rounded-full flex items-center justify-center transition-all box-border {
              st === 'blue'
                ? 'bg-blue-500 border-2 border-blue-600 shadow-xs'
                : st === 'red'
                ? 'bg-rose-500 border-2 border-rose-600 shadow-xs'
                : st === 'subtracted'
                ? 'bg-rose-100 dark:bg-rose-950/80 border-2 border-rose-300 dark:border-rose-700 text-rose-600 font-black text-[10px]'
                : 'border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
            }"
            title="Feld {idx}"
          >
            {#if st === 'subtracted'}
              ✕
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Didaktischer Erklärtext unter dem Feld -->
  <p class="text-[11px] text-indigo-900 dark:text-indigo-200 font-medium text-center mt-2.5 m-0 leading-snug">
    {explanation}
  </p>
</div>
