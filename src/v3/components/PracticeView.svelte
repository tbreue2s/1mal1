<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import {
    playCelebrationSound,
    playErrorSound,
    playKeyTap,
    playSuccessSound,
  } from '../lib/audio';
  import type { QueuedTaskV3 } from '../lib/chapters';
  import { formatEquationPartsV3 } from '../lib/generator';
  import { applySM2ToFact, FAST_THRESHOLD_MS } from '../lib/sm2';
  import type { FactFamily } from '../lib/types';
  import Keypad from './Keypad.svelte';

  interface Props {
    initialQueue: QueuedTaskV3[];
    soundEnabled: boolean;
    onFactEvaluated: (
      updatedFact: FactFamily,
      starsEarned: number,
      isCorrect: boolean,
      isFast: boolean
    ) => void;
    onFinishSession: () => void;
    onRestartSession: () => void;
  }

  let {
    initialQueue,
    soundEnabled,
    onFactEvaluated,
    onFinishSession,
    onRestartSession,
  }: Props = $props();

  let queue = $state<QueuedTaskV3[]>([]);
  let currentIndex = $state(0);
  let inputDigits = $state('');

  let taskStartMs = $state(0);
  let autoNextTimeout: ReturnType<typeof setTimeout> | null = null;

  let feedbackState = $state<'idle' | 'correct' | 'wrong' | 'retry_correct'>('idle');
  let feedbackTitle = $state('');
  let feedbackSubtitle = $state('');
  let lastQuality = $state<0 | 2 | 3 | 4>(0);
  let lastUserAnswer = $state<number | null>(null);
  let sessionFinished = $state(false);

  let sessionStars = $state(0);
  let sessionCorrectFirstTry = $state(0);
  let sessionFastCount = $state(0);
  let sessionMistakes = $state(0);
  let seenFactIds = new Set<string>();
  let retryFactIds = new Set<string>();

  let currentTask = $derived(queue[currentIndex]);
  let equationParts = $derived(
    currentTask ? formatEquationPartsV3(currentTask.fact, currentTask.variant) : null
  );

  let canSubmit = $derived(
    feedbackState === 'idle' && inputDigits.trim().length > 0
  );
  let canDelete = $derived(
    feedbackState === 'idle' && inputDigits.length > 0
  );

  onMount(() => {
    queue = [...initialQueue];
    currentIndex = 0;
    startTaskTimer();
  });

  onDestroy(() => {
    clearTimers();
  });

  function clearTimers() {
    if (autoNextTimeout) clearTimeout(autoNextTimeout);
  }

  function startTaskTimer() {
    clearTimers();
    taskStartMs = Date.now();
  }

  function handleDigit(digit: string) {
    if (feedbackState !== 'idle' || inputDigits.length >= 3) return;
    inputDigits += digit;
    playKeyTap(soundEnabled);
  }

  function handleDelete() {
    if (feedbackState !== 'idle' || inputDigits.length === 0) return;
    inputDigits = inputDigits.slice(0, -1);
    playKeyTap(soundEnabled);
  }

  function handleSubmit() {
    if (!currentTask || !equationParts) return;

    // Wenn gerade der "LernPause"-Fehlerbildschirm sichtbar ist, dient Klick/Enter als "Verstanden"
    if (feedbackState === 'wrong') {
      advanceNext();
      return;
    }

    if (!canSubmit) return;
    clearTimers();

    const responseMs = Math.max(100, Date.now() - taskStartMs);
    const userAnswer = Number.parseInt(inputDigits, 10);
    const isCorrect = userAnswer === equationParts.solution;
    const isFirstTryForThisFact = !seenFactIds.has(currentTask.fact.id);
    seenFactIds.add(currentTask.fact.id);

    let factToSave: FactFamily;
    let starsToAward = 0;

    if (!isFirstTryForThisFact && retryFactIds.has(currentTask.fact.id)) {
      // In-Session Wiederholung einer zuvor falsch gelösten Aufgabe
      if (isCorrect) {
        feedbackTitle = 'Klasse korrigiert! 👏';
        feedbackSubtitle = 'Denkfehler verstanden! Morgen noch einmal zur Festigung.';
        feedbackState = 'retry_correct';
        playSuccessSound(soundEnabled, false);

        factToSave = {
          ...currentTask.fact,
          repetitions: 0,
          interval: 1,
          dueDate: Date.now() + 86400000,
          lastQuality: 0,
          totalAttempts: currentTask.fact.totalAttempts + 1,
          correctAttempts: currentTask.fact.correctAttempts + 1,
        };
        starsToAward = 1;
        sessionStars += 1;
        onFactEvaluated(factToSave, 1, true, false);

        autoNextTimeout = setTimeout(() => {
          advanceNext();
        }, 1200);
      } else {
        sessionMistakes++;
        feedbackState = 'wrong';
        lastUserAnswer = userAnswer;
        feedbackTitle = 'Schau dir die Lösung genau an:';
        feedbackSubtitle = 'Merke dir den Rechenweg für gleich.';
        playErrorSound(soundEnabled);

        factToSave = {
          ...currentTask.fact,
          repetitions: 0,
          interval: 0,
          dueDate: Date.now(),
          lastQuality: 0,
          totalAttempts: currentTask.fact.totalAttempts + 1,
        };
        queue = [...queue, { ...currentTask, fact: factToSave }];
        onFactEvaluated(factToSave, 0, false, false);
      }
    } else {
      // Regulärer Erstversuch
      if (isCorrect) {
        const result = applySM2ToFact(
          currentTask.fact,
          currentTask.variant,
          true,
          responseMs
        );
        factToSave = result.updatedFact;
        lastQuality = result.quality;
        feedbackTitle = result.feedbackTitle;
        feedbackSubtitle = result.feedbackSubtitle;

        if (result.quality === 4) {
          sessionFastCount++;
        }
        sessionCorrectFirstTry++;
        feedbackState = 'correct';
        playSuccessSound(soundEnabled, result.quality === 4);
        starsToAward = result.starsEarned;
        sessionStars += starsToAward;

        onFactEvaluated(
          factToSave,
          starsToAward,
          true,
          result.quality === 4
        );

        const delay = result.quality === 4 ? 900 : 1300;
        autoNextTimeout = setTimeout(() => {
          advanceNext();
        }, delay);
      } else {
        // Fehler im Erstversuch:
        // HIER GREIFT DER DIDAKTISCHE SCHUTZ: KEIN AUTO-SKIP!
        sessionMistakes++;
        feedbackState = 'wrong';
        lastUserAnswer = userAnswer;
        lastQuality = 0;
        playErrorSound(soundEnabled);
        retryFactIds.add(currentTask.fact.id);

        const result = applySM2ToFact(
          currentTask.fact,
          currentTask.variant,
          false,
          responseMs
        );
        factToSave = result.updatedFact;
        feedbackTitle = 'Fast geschafft! Schau dir die Lösung an:';
        feedbackSubtitle = 'Die Aufgabe kommt am Ende der Runde noch einmal.';

        // Karte zur Festigung ans Ende der Runde anhängen
        queue = [...queue, { ...currentTask, fact: factToSave }];

        onFactEvaluated(factToSave, 0, false, false);
      }
    }
  }

  function advanceNext() {
    clearTimers();
    feedbackState = 'idle';
    inputDigits = '';
    lastUserAnswer = null;

    if (currentIndex + 1 < queue.length) {
      currentIndex++;
      startTaskTimer();
    } else {
      sessionFinished = true;
      playCelebrationSound(soundEnabled);
    }
  }
</script>

<div class="w-full max-w-md landscape:max-w-3xl mx-auto space-y-3 sm:space-y-4 pb-6">
  {#if !sessionFinished && currentTask && equationParts}
    <!-- Top Nav: Abbruch, Fortschritt & Zähler -->
    <div class="flex items-center justify-between gap-3 text-xs">
      <button
        type="button"
        onclick={onFinishSession}
        class="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer"
      >
        ✕ Beenden
      </button>

      <div class="flex-1 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          class="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-200"
          style="width: {Math.round((currentIndex / queue.length) * 100)}%"
        ></div>
      </div>

      <div class="text-slate-500 dark:text-slate-400 font-extrabold tabular-nums">
        {currentIndex + 1} / {queue.length}
      </div>
    </div>

    <!-- Aufgabenbereich -->
    <div class="landscape:grid landscape:grid-cols-2 landscape:gap-4 landscape:items-center">
      <!-- Große Aufgabenkarte -->
      <div
        class="bg-white dark:bg-[#111827] rounded-3xl p-5 sm:p-6 border-2 shadow-sm text-center relative transition-all duration-200 {
          feedbackState === 'correct' || feedbackState === 'retry_correct'
            ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
            : feedbackState === 'wrong'
            ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/25'
            : 'border-slate-200 dark:border-slate-800'
        }"
      >
        <!-- Badge oben -->
        <div class="flex items-center justify-center gap-2 mb-2 sm:mb-3">
          <span class="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {equationParts.typeBadge}
          </span>
          {#if retryFactIds.has(currentTask.fact.id) && currentIndex >= initialQueue.length}
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              🔁 Wiederholung
            </span>
          {/if}
        </div>

        {#if feedbackState === 'wrong'}
          <!-- 1. FEHLER-ANSICHT: TRANSPARENTE KORREKTUR & STRATEGIE-HINWEIS -->
          <div class="py-1 animate-fade-in space-y-3">
            <!-- Deine falsche Antwort durchgestrichen -->
            <div class="text-xs font-bold text-rose-500 dark:text-rose-400">
              Deine Antwort war: <span class="line-through">{lastUserAnswer ?? '?'}</span> ✕
            </div>

            <!-- Die richtige, vollständige Gleichung -->
            <div class="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 select-none">
              {equationParts.fullEquationWithSolution}
            </div>

            <!-- Didaktischer Denkhinweis -->
            <div class="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-950 dark:text-indigo-200 font-semibold leading-relaxed">
              {equationParts.strategyHint}
            </div>

            <!-- Interaktiver Bestätigungs-Button -->
            <button
              type="button"
              onclick={advanceNext}
              class="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition btn-calm-primary cursor-pointer border-none"
            >
              <span>Verstanden – Weiter</span>
              <span>→</span>
            </button>
          </div>
        {:else}
          <!-- 2. REGULÄRE EINGABE & ERFOLGS-ANSICHT -->
          <div class="flex items-center justify-center gap-2 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white my-3 sm:my-4 select-none">
            {#if equationParts.left}
              <span>{equationParts.left}</span>
            {/if}

            <div
              class="min-w-16 px-3 py-1 rounded-2xl border-2 text-center transition-all {
                feedbackState === 'correct' || feedbackState === 'retry_correct'
                  ? 'border-emerald-500 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                  : 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 text-slate-900 dark:text-white'
              }"
            >
              {inputDigits || '?'}
            </div>

            {#if equationParts.right}
              <span>{equationParts.right}</span>
            {/if}
          </div>

          <!-- Feedback-Meldung bei Erfolg -->
          {#if feedbackState !== 'idle'}
            <div class="mt-2.5 sm:mt-3 animate-fade-in">
              <div class="text-sm font-black text-emerald-600 dark:text-emerald-400">
                {feedbackTitle}
              </div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {feedbackSubtitle}
              </div>
            </div>
          {:else}
            <div class="text-xs text-slate-400 mt-1.5 sm:mt-2">
              Tippe das Ergebnis ein und drücke auf Prüfen
            </div>
          {/if}
        {/if}
      </div>

      <!-- Ziffernblock -->
      <div class="mt-3 landscape:mt-0">
        <Keypad
          disabled={feedbackState !== 'idle'}
          {canSubmit}
          {canDelete}
          onDigit={handleDigit}
          onDelete={handleDelete}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  {:else if sessionFinished}
    <!-- RUNDEN-ABSCHLUSS -->
    <div class="bg-white dark:bg-[#111827] rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-800 text-center shadow-lg space-y-4 animate-slide-up">
      <div class="text-5xl">🏆</div>
      <h2 class="text-xl font-black text-slate-900 dark:text-white m-0">
        Runde geschafft!
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400 m-0">
        Klasse! Dein Lernfortschritt wurde im Langzeitgedächtnis gespeichert.
      </p>

      <div class="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700">
        <div>
          <span class="text-[10px] text-slate-400 block font-bold uppercase">Sterne</span>
          <span class="text-lg font-black text-amber-500">+{sessionStars} ⭐</span>
        </div>
        <div>
          <span class="text-[10px] text-slate-400 block font-bold uppercase">Sofort richtig</span>
          <span class="text-lg font-black text-emerald-500">{sessionCorrectFirstTry}</span>
        </div>
        <div>
          <span class="text-[10px] text-slate-400 block font-bold uppercase">Blitzschnell</span>
          <span class="text-lg font-black text-cyan-500">{sessionFastCount} ⚡</span>
        </div>
      </div>

      <div class="flex items-center gap-2 pt-2">
        <button
          type="button"
          onclick={onRestartSession}
          class="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs cursor-pointer border-none"
        >
          Nochmal üben
        </button>
        <button
          type="button"
          onclick={onFinishSession}
          class="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs cursor-pointer border-none btn-calm-primary"
        >
          Zur Übersicht
        </button>
      </div>
    </div>
  {/if}
</div>
