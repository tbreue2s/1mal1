<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import {
    playCelebrationSound,
    playErrorSound,
    playKeyTap,
    playSuccessSound,
  } from '../lib/audio';
  import { formatEquationParts } from '../lib/generator';
  import { applySM2 } from '../lib/sm2';
  import type { TaskCard } from '../lib/types';
  import Keypad from './Keypad.svelte';

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
    onOpenMatrix: () => void;
    onRestartSession: () => void;
  }

  let {
    initialQueue,
    soundEnabled,
    onCardEvaluated,
    onFinishSession,
    onOpenMatrix,
    onRestartSession,
  }: Props = $props();

  // Lokale Session-Queue (Fehlerkarten wandern ans Ende der aktuellen Session)
  let queue = $state<TaskCard[]>([]);
  let currentIndex = $state(0);
  let inputDigits = $state('');

  // Millisekunden-Timer für die aktuelle Aufgabe
  let taskStartMs = $state(0);
  let elapsedLiveMs = $state(0);
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let autoNextTimeout: ReturnType<typeof setTimeout> | null = null;

  // Feedback-Zustand nach dem Prüfen
  let feedbackState = $state<'idle' | 'correct' | 'wrong'>('idle');
  let feedbackTitle = $state('');
  let feedbackSubtitle = $state('');
  let lastQuality = $state<0 | 2 | 3 | 4>(0);
  let sessionFinished = $state(false);

  // Runden-Statistik
  let sessionStars = $state(0);
  let sessionCorrectFirstTry = $state(0);
  let sessionFastCount = $state(0);
  let sessionMistakes = $state(0);
  let seenCardIds = new Set<string>();

  let currentCard = $derived(queue[currentIndex] ?? null);
  let equation = $derived(currentCard ? formatEquationParts(currentCard) : null);

  let progressPercent = $derived(
    queue.length > 0 ? Math.min(100, Math.round((currentIndex / queue.length) * 100)) : 0
  );

  function startTaskTimer() {
    taskStartMs = performance.now();
    elapsedLiveMs = 0;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (feedbackState === 'idle' && !sessionFinished) {
        elapsedLiveMs = Math.max(0, Math.round(performance.now() - taskStartMs));
      }
    }, 100);
  }

  function initSession() {
    queue = [...initialQueue];
    currentIndex = 0;
    inputDigits = '';
    feedbackState = 'idle';
    sessionFinished = false;
    sessionStars = 0;
    sessionCorrectFirstTry = 0;
    sessionFastCount = 0;
    sessionMistakes = 0;
    seenCardIds = new Set();
    startTaskTimer();
  }

  onMount(() => {
    initSession();
  });

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
    if (autoNextTimeout) clearTimeout(autoNextTimeout);
  });

  function handleDigit(digit: string) {
    if (feedbackState !== 'idle' || sessionFinished) return;
    if (inputDigits.length >= 3) return;
    // Verhindere führende Nullen wie "05"
    if (inputDigits === '0') {
      inputDigits = digit;
    } else {
      inputDigits += digit;
    }
    playKeyTap(soundEnabled);
  }

  function handleDelete() {
    if (feedbackState !== 'idle' || sessionFinished) return;
    if (inputDigits.length > 0) {
      inputDigits = inputDigits.slice(0, -1);
      playKeyTap(soundEnabled);
    }
  }

  function advanceToNextCard() {
    if (autoNextTimeout) {
      clearTimeout(autoNextTimeout);
      autoNextTimeout = null;
    }

    if (currentIndex + 1 < queue.length) {
      currentIndex += 1;
      inputDigits = '';
      feedbackState = 'idle';
      startTaskTimer();
    } else {
      if (timerInterval) clearInterval(timerInterval);
      sessionFinished = true;
      playCelebrationSound(soundEnabled);
    }
  }

  function handleSubmit() {
    if (sessionFinished || !currentCard) return;

    // Falls gerade die Fehler-Korrektur angezeigt wird, dient ✓ / Enter als "Weiter"
    if (feedbackState === 'wrong') {
      advanceToNextCard();
      return;
    }

    if (feedbackState === 'correct') {
      advanceToNextCard();
      return;
    }

    if (inputDigits.trim() === '') return;

    const responseTimeMs = Math.max(100, Math.round(performance.now() - taskStartMs));
    const userAnswer = Number.parseInt(inputDigits, 10);
    const isCorrect = userAnswer === currentCard.solution;
    const isFirstAttemptInSession = !seenCardIds.has(currentCard.id);
    seenCardIds.add(currentCard.id);

    const result = applySM2(currentCard, isCorrect, responseTimeMs);
    lastQuality = result.quality;
    feedbackTitle = result.feedbackTitle;
    feedbackSubtitle = result.feedbackSubtitle;

    // Aktualisiere die Karte im aktuellen Slot
    queue[currentIndex] = result.updatedCard;

    onCardEvaluated(
      result.updatedCard,
      result.starsEarned,
      isCorrect,
      result.quality === 4
    );

    if (isCorrect) {
      feedbackState = 'correct';
      sessionStars += result.starsEarned;
      if (isFirstAttemptInSession) {
        sessionCorrectFirstTry += 1;
      }
      if (result.quality === 4) {
        sessionFastCount += 1;
      }
      playSuccessSound(soundEnabled, result.quality === 4);

      autoNextTimeout = setTimeout(() => {
        advanceToNextCard();
      }, 950);
    } else {
      feedbackState = 'wrong';
      sessionMistakes += 1;
      playErrorSound(soundEnabled);

      // Falsche Antwort: repetitions = 0 (bereits in applySM2 gesetzt)
      // und Aufgabe wandert ans Ende der aktuellen Session!
      queue = [...queue, { ...result.updatedCard }];
    }
  }
</script>

<div class="practice-view">
  {#if !sessionFinished && currentCard && equation}
    <!-- Fortschrittsleiste oben -->
    <div class="session-topbar">
      <button
        type="button"
        class="quit-btn"
        onclick={onFinishSession}
        aria-label="Zurück zur Übersicht"
      >
        ✕ Beenden
      </button>

      <div class="progress-wrapper" aria-label="Aufgabe {currentIndex + 1} von {queue.length}">
        <div class="progress-track">
          <div class="progress-fill" style="width: {progressPercent}%"></div>
        </div>
        <span class="progress-text">
          {currentIndex + 1} / {queue.length}
        </span>
      </div>

      <div class="session-stars" title="Sterne in dieser Runde">
        ⭐ {sessionStars}
      </div>
    </div>

    <!-- Aufgaben-Karte -->
    <div
      class="task-card"
      class:state-correct={feedbackState === 'correct'}
      class:state-wrong={feedbackState === 'wrong'}
    >
      <div class="task-card-meta">
        <span class="type-pill">{equation.typeBadge}</span>

        <span
          class="speed-indicator"
          class:speed-fast={elapsedLiveMs < 2500}
          class:speed-good={elapsedLiveMs >= 2500 && elapsedLiveMs <= 6000}
          class:speed-slow={elapsedLiveMs > 6000}
        >
          {#if elapsedLiveMs < 2500}
            ⚡ Blitz-Tempo (&lt; 2,5s)
          {:else if elapsedLiveMs <= 6000}
            👍 Gutes Tempo
          {:else}
            🧠 In Ruhe rechnen
          {/if}
        </span>
      </div>

      <div class="equation-display" aria-live="polite">
        {#if equation.left}
          <span class="eq-part">{equation.left}</span>
        {/if}

        <span
          class="answer-slot"
          class:filled={inputDigits.length > 0}
          class:slot-correct={feedbackState === 'correct'}
          class:slot-wrong={feedbackState === 'wrong'}
        >
          {inputDigits.length > 0 ? inputDigits : '?'}
        </span>

        {#if equation.right}
          <span class="eq-part">{equation.right}</span>
        {/if}
      </div>

      <!-- Sofort-Feedback Bereich -->
      {#if feedbackState === 'correct'}
        <div class="feedback-banner banner-correct" role="status">
          <div class="fb-main">
            <span class="fb-icon">{lastQuality === 4 ? '⚡' : '🎉'}</span>
            <div>
              <div class="fb-title">{feedbackTitle}</div>
              <div class="fb-sub">{feedbackSubtitle}</div>
            </div>
          </div>
        </div>
      {:else if feedbackState === 'wrong'}
        <div class="feedback-banner banner-wrong" role="alert">
          <div class="fb-wrong-header">
            <span class="fb-icon">💡</span>
            <div>
              <div class="fb-title">{feedbackTitle}</div>
              <div class="correction-equation">{equation.fullEquationWithSolution}</div>
              <div class="correction-hint">{equation.hintText}</div>
            </div>
          </div>

          <button
            type="button"
            class="continue-after-wrong-btn"
            onclick={advanceToNextCard}
          >
            Verstanden – Weiter →
          </button>
        </div>
      {:else}
        <div class="feedback-placeholder">
          Tippe die Lösung über die großen Tasten ein
        </div>
      {/if}
    </div>

    <!-- Eigenes On-Screen-Keypad -->
    <Keypad
      disabled={feedbackState === 'correct'}
      canDelete={feedbackState === 'idle' && inputDigits.length > 0}
      canSubmit={
        (feedbackState === 'idle' && inputDigits.length > 0) ||
        feedbackState === 'wrong'
      }
      onDigit={handleDigit}
      onDelete={handleDelete}
      onSubmit={handleSubmit}
    />
  {:else if sessionFinished}
    <!-- Runden-Abschluss & Belohnung -->
    <div class="summary-card">
      <div class="trophy-badge">🏆</div>
      <h2 class="summary-title">Runde geschafft!</h2>
      <p class="summary-subtitle">
        Du hast alle Aufgaben dieser Trainingsrunde gelöst.
      </p>

      <div class="summary-stats-grid">
        <div class="sum-box sum-stars">
          <span class="sum-val">+{sessionStars} ⭐</span>
          <span class="sum-lbl">Sterne gesammelt</span>
        </div>
        <div class="sum-box sum-fast">
          <span class="sum-val">{sessionFastCount} ⚡</span>
          <span class="sum-lbl">Blitz-Antworten (&lt;2,5s)</span>
        </div>
        <div class="sum-box sum-acc">
          <span class="sum-val">
            {initialQueue.length > 0
              ? Math.round((sessionCorrectFirstTry / initialQueue.length) * 100)
              : 100}%
          </span>
          <span class="sum-lbl">Sofort gewusst</span>
        </div>
      </div>

      {#if sessionMistakes > 0}
        <p class="mistake-note">
          💪 Stark! Du hast {sessionMistakes === 1 ? '1 schwierige Aufgabe' : `${sessionMistakes} schwierige Aufgaben`} am Ende der Runde erfolgreich wiederholt.
        </p>
      {/if}

      <div class="summary-actions">
        <button
          type="button"
          class="primary-again-btn"
          onclick={() => {
            onRestartSession();
            initSession();
          }}
        >
          Noch eine Runde spielen 🚀
        </button>

        <div class="secondary-actions">
          <button type="button" class="sec-btn" onclick={onOpenMatrix}>
            10×10 Matrix ansehen
          </button>
          <button type="button" class="sec-btn" onclick={onFinishSession}>
            Zur Startseite
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .practice-view {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-bottom: 16px;
  }

  .session-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    background: #ffffff;
    padding: 10px 14px;
    border-radius: 16px;
    border: 2px solid #e0e7ff;
  }

  .quit-btn {
    background: #f1f5f9;
    color: #475569;
    border: none;
    border-radius: 10px;
    padding: 7px 11px;
    font-family: inherit;
    font-weight: 800;
    font-size: 0.82rem;
    cursor: pointer;
  }

  .quit-btn:hover {
    background: #e2e8f0;
    color: #1e293b;
  }

  .progress-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .progress-track {
    flex: 1;
    height: 11px;
    background: #e0e7ff;
    border-radius: 999px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4f46e5, #10b981);
    border-radius: 999px;
    transition: width 0.25s ease;
  }

  .progress-text {
    font-size: 0.8rem;
    font-weight: 800;
    color: #4338ca;
    white-space: nowrap;
  }

  .session-stars {
    background: #fef3c7;
    color: #b45309;
    padding: 5px 10px;
    border-radius: 999px;
    font-weight: 900;
    font-size: 0.86rem;
    white-space: nowrap;
  }

  .task-card {
    background: #ffffff;
    border-radius: 24px;
    padding: 18px 16px;
    border: 3px solid #c7d2fe;
    box-shadow: 0 8px 20px rgba(79, 70, 229, 0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    min-height: 215px;
    transition: border-color 0.2s ease, background-color 0.2s ease;
  }

  .task-card.state-correct {
    border-color: #10b981;
    background: #f0fdf4;
  }

  .task-card.state-wrong {
    border-color: #f59e0b;
    background: #fffbeb;
  }

  .task-card-meta {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .type-pill {
    background: #eef2ff;
    color: #4338ca;
    font-size: 0.76rem;
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 999px;
  }

  .speed-indicator {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 9px;
    border-radius: 999px;
    transition: all 0.2s ease;
  }

  .speed-fast {
    background: #ecfdf5;
    color: #047857;
  }

  .speed-good {
    background: #eff6ff;
    color: #1d4ed8;
  }

  .speed-slow {
    background: #f8fafc;
    color: #64748b;
  }

  .equation-display {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 12px;
    margin: 18px 0;
    font-size: clamp(2.1rem, 8vw, 3rem);
    font-weight: 900;
    color: #1e1b4b;
    letter-spacing: -0.02em;
  }

  .eq-part {
    line-height: 1.1;
  }

  .answer-slot {
    min-width: 78px;
    height: 64px;
    padding: 0 14px;
    border-radius: 16px;
    border: 3px dashed #6366f1;
    background: #eef2ff;
    color: #94a3b8;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(2rem, 7.5vw, 2.75rem);
    font-weight: 900;
    transition: all 0.15s ease;
  }

  .answer-slot.filled {
    border-style: solid;
    border-color: #4f46e5;
    background: #ffffff;
    color: #4f46e5;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
  }

  .answer-slot.slot-correct {
    border-style: solid;
    border-color: #059669;
    background: #d1fae5;
    color: #065f46;
  }

  .answer-slot.slot-wrong {
    border-style: solid;
    border-color: #dc2626;
    background: #fee2e2;
    color: #b91c1c;
    text-decoration: line-through;
  }

  .feedback-placeholder {
    font-size: 0.85rem;
    font-weight: 600;
    color: #64748b;
    text-align: center;
  }

  .feedback-banner {
    width: 100%;
    border-radius: 16px;
    padding: 12px 14px;
    animation: popIn 0.18s ease-out;
  }

  .banner-correct {
    background: #d1fae5;
    border: 2px solid #34d399;
    color: #065f46;
  }

  .banner-wrong {
    background: #fef3c7;
    border: 2px solid #f59e0b;
    color: #78350f;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .fb-main,
  .fb-wrong-header {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .fb-icon {
    font-size: 1.7rem;
    line-height: 1;
  }

  .fb-title {
    font-weight: 900;
    font-size: 0.98rem;
  }

  .fb-sub {
    font-size: 0.82rem;
    font-weight: 700;
    opacity: 0.9;
  }

  .correction-equation {
    font-size: 1.35rem;
    font-weight: 900;
    color: #065f46;
    background: #d1fae5;
    display: inline-block;
    padding: 3px 12px;
    border-radius: 10px;
    margin-top: 4px;
  }

  .correction-hint {
    font-size: 0.82rem;
    font-weight: 700;
    color: #92400e;
    margin-top: 4px;
  }

  .continue-after-wrong-btn {
    width: 100%;
    min-height: 48px;
    border: none;
    border-radius: 12px;
    background: #4f46e5;
    color: #ffffff;
    font-family: inherit;
    font-size: 0.98rem;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 3px 0 #312e81;
  }

  .continue-after-wrong-btn:hover {
    background: #4338ca;
  }

  .summary-card {
    background: #ffffff;
    border-radius: 24px;
    padding: 24px 18px;
    border: 3px solid #c7d2fe;
    box-shadow: 0 10px 25px rgba(79, 70, 229, 0.12);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }

  .trophy-badge {
    font-size: 3.4rem;
    line-height: 1;
  }

  .summary-title {
    margin: 0;
    font-size: 1.65rem;
    font-weight: 900;
    color: #1e1b4b;
  }

  .summary-subtitle {
    margin: -6px 0 0;
    font-size: 0.92rem;
    color: #64748b;
  }

  .summary-stats-grid {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 4px;
  }

  .sum-box {
    border-radius: 16px;
    padding: 12px 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
  }

  .sum-stars {
    background: #fef3c7;
    color: #92400e;
  }

  .sum-fast {
    background: #d1fae5;
    color: #065f46;
  }

  .sum-acc {
    background: #eef2ff;
    color: #3730a3;
  }

  .sum-val {
    font-size: 1.25rem;
    font-weight: 900;
  }

  .sum-lbl {
    font-size: 0.72rem;
    font-weight: 700;
  }

  .mistake-note {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 700;
    color: #047857;
    background: #ecfdf5;
    padding: 10px 14px;
    border-radius: 12px;
  }

  .summary-actions {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 6px;
  }

  .primary-again-btn {
    width: 100%;
    min-height: 58px;
    border: none;
    border-radius: 16px;
    background: linear-gradient(135deg, #4f46e5, #4338ca);
    color: #ffffff;
    font-family: inherit;
    font-size: 1.1rem;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 5px 0 #312e81;
  }

  .secondary-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .sec-btn {
    min-height: 48px;
    border: 2px solid #c7d2fe;
    border-radius: 14px;
    background: #eef2ff;
    color: #3730a3;
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 800;
    cursor: pointer;
  }

  .sec-btn:hover {
    background: #e0e7ff;
  }

  @keyframes popIn {
    from {
      opacity: 0;
      transform: translateY(4px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>

