<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import {
    playCelebrationSound,
    playErrorSound,
    playKeyTap,
    playSuccessSound,
  } from '../../lib/audio';
  import { formatEquationParts } from '../../lib/generator';
  import { applySM2, FAST_THRESHOLD_MS, GOOD_THRESHOLD_MS } from '../../lib/sm2';
  import type { TaskCard } from '../../lib/types';
  import KeypadV2 from './KeypadV2.svelte';

  interface Props {
    initialQueue: TaskCard[];
    soundEnabled: boolean;
    onCardEvaluated: (
      updatedCard: TaskCard,
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
    onCardEvaluated,
    onFinishSession,
    onRestartSession,
  }: Props = $props();

  let queue = $state<TaskCard[]>([]);
  let currentIndex = $state(0);
  let inputDigits = $state('');

  let taskStartMs = $state(0);
  let elapsedLiveMs = $state(0);
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let autoNextTimeout: ReturnType<typeof setTimeout> | null = null;

  let feedbackState = $state<'idle' | 'correct' | 'wrong'>('idle');
  let feedbackTitle = $state('');
  let feedbackSubtitle = $state('');
  let lastQuality = $state<0 | 2 | 3 | 4>(0);
  let sessionFinished = $state(false);

  let sessionStars = $state(0);
  let sessionCorrectFirstTry = $state(0);
  let sessionFastCount = $state(0);
  let sessionMistakes = $state(0);
  let seenCardIds = new Set<string>();
  let retryCardIds = new Set<string>();

  let currentCard = $derived(queue[currentIndex]);
  let equationParts = $derived(
    currentCard ? formatEquationParts(currentCard) : null
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
    if (timerInterval) clearInterval(timerInterval);
    if (autoNextTimeout) clearTimeout(autoNextTimeout);
  }

  function startTaskTimer() {
    clearTimers();
    taskStartMs = Date.now();
    elapsedLiveMs = 0;
    timerInterval = setInterval(() => {
      elapsedLiveMs = Date.now() - taskStartMs;
    }, 100);
  }

  function handleDigit(digit: string) {
    if (feedbackState !== 'idle' || inputDigits.length >= 4) return;
    inputDigits += digit;
    playKeyTap(soundEnabled);
  }

  function handleDelete() {
    if (feedbackState !== 'idle' || inputDigits.length === 0) return;
    inputDigits = inputDigits.slice(0, -1);
    playKeyTap(soundEnabled);
  }

  function handleSubmit() {
    if (!canSubmit || !currentCard) return;
    clearTimers();

    const responseMs = Math.max(100, Date.now() - taskStartMs);
    const userAnswer = Number.parseInt(inputDigits, 10);
    const isCorrect = userAnswer === currentCard.solution;
    const isFirstTryForThisCard = !seenCardIds.has(currentCard.id);
    seenCardIds.add(currentCard.id);

    let cardToSave: TaskCard;
    let starsToAward = 0;

    if (!isFirstTryForThisCard && retryCardIds.has(currentCard.id)) {
      // In-Session Wiederholung einer zuvor falsch gelösten Karte
      if (isCorrect) {
        feedbackTitle = 'Klasse korrigiert! 👏';
        feedbackSubtitle = 'Denkfehler verstanden! Morgen noch einmal zur Festigung.';
        feedbackState = 'correct';
        playSuccessSound(soundEnabled, false);

        // Didaktisch entscheidend: Die Karte wurde heute zuerst verfehlt.
        // Das sofortige Lösen schließt die Runde positiv ab, löscht aber NICHT den Fehler.
        // Die Karte bleibt auf repetitions = 0 und lastQuality = 0 (damit sie rot bleibt und morgen wiederholt wird!)
        cardToSave = {
          ...currentCard,
          repetitions: 0,
          interval: 1,
          dueDate: Date.now() + 86400000,
          lastQuality: 0,
          totalAttempts: currentCard.totalAttempts + 1,
          correctAttempts: currentCard.correctAttempts + 1,
        };
        starsToAward = 1; // 1 Belohnungsstern für das Nachbessern
      } else {
        sessionMistakes++;
        feedbackState = 'wrong';
        feedbackTitle = 'Nochmal anschauen:';
        feedbackSubtitle = 'Schau dir das Ergebnis genau an.';
        playErrorSound(soundEnabled);

        cardToSave = {
          ...currentCard,
          repetitions: 0,
          interval: 0,
          dueDate: Date.now(),
          lastQuality: 0,
          totalAttempts: currentCard.totalAttempts + 1,
        };
        queue = [...queue, { ...cardToSave }];
        starsToAward = 0;
      }
    } else {
      // Regulärer Erstversuch in dieser Session
      const result = applySM2(currentCard, isCorrect, responseMs);
      cardToSave = result.updatedCard;
      lastQuality = result.quality;
      feedbackTitle = result.feedbackTitle;
      feedbackSubtitle = result.feedbackSubtitle;

      if (isCorrect) {
        if (result.quality === 4) {
          sessionFastCount++;
        }
        sessionCorrectFirstTry++;
        feedbackState = 'correct';
        playSuccessSound(soundEnabled, result.quality === 4);
        starsToAward = result.starsEarned;
      } else {
        sessionMistakes++;
        feedbackState = 'wrong';
        playErrorSound(soundEnabled);
        retryCardIds.add(currentCard.id);

        // Fehlerkarte ans Ende anhängen
        queue = [...queue, { ...cardToSave }];
        starsToAward = 0;
      }
    }

    sessionStars += starsToAward;
    onCardEvaluated(
      cardToSave,
      starsToAward,
      isCorrect,
      isFirstTryForThisCard && lastQuality === 4
    );

    const delay = isCorrect ? (lastQuality === 4 ? 800 : 1200) : 2200;
    autoNextTimeout = setTimeout(() => {
      advanceNext();
    }, delay);
  }

  function advanceNext() {
    clearTimers();
    feedbackState = 'idle';
    inputDigits = '';

    if (currentIndex + 1 < queue.length) {
      currentIndex++;
      startTaskTimer();
    } else {
      sessionFinished = true;
      playCelebrationSound(soundEnabled);
    }
  }
</script>

<div class="w-full max-w-md mx-auto space-y-4 pb-8">
  {#if !sessionFinished && currentCard && equationParts}
    <!-- Top Nav: Abbruch, Fortschritt & Zeit -->
    <div class="flex items-center justify-between gap-3 text-xs">
      <button
        type="button"
        onclick={onFinishSession}
        class="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 cursor-pointer"
      >
        ✕ Beenden
      </button>

      <div class="flex-1 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          class="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-200"
          style="width: {Math.round(((currentIndex) / queue.length) * 100)}%"
        ></div>
      </div>

      <div class="text-slate-500 dark:text-slate-400 font-extrabold tabular-nums">
        {currentIndex + 1} / {queue.length}
      </div>
    </div>

    <!-- Große Aufgabenkarte -->
    <div
      class="bg-white dark:bg-[#111827] rounded-3xl p-6 border-2 shadow-sm text-center relative transition-all duration-200 {
        feedbackState === 'correct'
          ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
          : feedbackState === 'wrong'
          ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
          : 'border-slate-200 dark:border-slate-800'
      }"
    >
      <div class="flex items-center justify-center gap-2 mb-3">
        <span class="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          {equationParts.typeBadge}
        </span>
        {#if currentCard && retryCardIds.has(currentCard.id) && currentIndex >= initialQueue.length}
          <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            🔁 Wiederholung
          </span>
        {/if}
      </div>

      <!-- Gleichung mit Eingabefeld -->
      <div class="flex items-center justify-center gap-2 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white my-4 select-none">
        {#if equationParts.left}
          <span>{equationParts.left}</span>
        {/if}

        <div
          class="min-w-16 px-3 py-1 rounded-2xl border-2 text-center transition-all {
            feedbackState === 'correct'
              ? 'border-emerald-500 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
              : feedbackState === 'wrong'
              ? 'border-rose-500 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
              : 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 text-slate-900 dark:text-white'
          }"
        >
          {inputDigits || '?'}
        </div>

        {#if equationParts.right}
          <span>{equationParts.right}</span>
        {/if}
      </div>

      <!-- Feedback Meldung -->
      {#if feedbackState !== 'idle'}
        <div class="mt-3 animate-fade-in">
          <div
            class="text-sm font-black"
            class:text-emerald-600={feedbackState === 'correct'}
            class:dark:text-emerald-400={feedbackState === 'correct'}
            class:text-rose-600={feedbackState === 'wrong'}
            class:dark:text-rose-400={feedbackState === 'wrong'}
          >
            {feedbackTitle}
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {feedbackSubtitle}
          </div>
        </div>
      {:else}
        <div class="text-xs text-slate-400 mt-2">
          Gib das Ergebnis ein und tippe auf Prüfen
        </div>
      {/if}
    </div>

    <!-- Ziffernblock V2 -->
    <KeypadV2
      disabled={feedbackState !== 'idle'}
      {canSubmit}
      {canDelete}
      onDigit={handleDigit}
      onDelete={handleDelete}
      onSubmit={handleSubmit}
    />
  {:else if sessionFinished}
    <!-- RUNDEN-ABSCHLUSS MODAL -->
    <div class="bg-white dark:bg-[#111827] rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-800 text-center shadow-lg space-y-4">
      <div class="text-5xl">🏆</div>
      <h2 class="text-xl font-black text-slate-900 dark:text-white m-0">
        Runde geschafft!
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400 m-0">
        Klasse! Dein Lernfortschritt wurde gespeichert.
      </p>

      <div class="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700">
        <div>
          <span class="text-[10px] text-slate-400 block font-bold uppercase">Sterne</span>
          <span class="text-lg font-black text-amber-500">+{sessionStars} ⭐</span>
        </div>
        <div>
          <span class="text-[10px] text-slate-400 block font-bold uppercase">Direkt richtig</span>
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
