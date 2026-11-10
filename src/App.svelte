<script lang="ts">
  import HomeView from './components/HomeView.svelte';
  import MatrixView from './components/MatrixView.svelte';
  import PracticeView from './components/PracticeView.svelte';
  import { playKeyTap } from './lib/audio';
  import {
    buildSessionQueue,
    loadCardsFromStorage,
    loadStatsFromStorage,
    registerDailyPractice,
    resetAllProgress,
    saveCardsToStorage,
    saveStatsToStorage,
  } from './lib/storage';
  import type { TaskCard, UserStats } from './lib/types';

  type ActiveScreen = 'home' | 'practice' | 'matrix';

  let cards = $state<TaskCard[]>(loadCardsFromStorage());
  let stats = $state<UserStats>(loadStatsFromStorage());
  let currentScreen = $state<ActiveScreen>('home');
  let activeSessionQueue = $state<TaskCard[]>([]);

  function updateSettings(partial: Partial<UserStats>) {
    stats = { ...stats, ...partial };
    saveStatsToStorage(stats);
  }

  function toggleSound() {
    const nextSound = !stats.soundEnabled;
    updateSettings({ soundEnabled: nextSound });
    if (nextSound) {
      playKeyTap(true);
    }
  }

  function startSession() {
    activeSessionQueue = buildSessionQueue(
      cards,
      stats.learningMode,
      stats.selectedRows,
      stats.typeFilter,
      stats.sessionSize
    );
    currentScreen = 'practice';
  }

  function startSingleRowSession(row: number) {
    updateSettings({
      learningMode: 'rows',
      selectedRows: [row],
    });
    activeSessionQueue = buildSessionQueue(
      cards,
      'rows',
      [row],
      stats.typeFilter,
      stats.sessionSize
    );
    currentScreen = 'practice';
  }

  function handleCardEvaluated(
    updatedCard: TaskCard,
    starsEarned: number,
    isCorrect: boolean,
    isFast: boolean
  ) {
    // Aktualisiere Karte im globalen Pool & speichere in localStorage
    cards = cards.map((c) => (c.id === updatedCard.id ? updatedCard : c));
    saveCardsToStorage(cards);

    // Aktualisiere Tages-Streak & Sterne
    const withStreak = registerDailyPractice(stats);
    stats = {
      ...withStreak,
      stars: withStreak.stars + starsEarned,
      totalSolved: isCorrect ? withStreak.totalSolved + 1 : withStreak.totalSolved,
      fastSolved: isFast ? withStreak.fastSolved + 1 : withStreak.fastSolved,
    };
    saveStatsToStorage(stats);
  }

  function handleResetProgress() {
    const fresh = resetAllProgress();
    cards = fresh.cards;
    stats = fresh.stats;
  }
</script>

<div class="app-shell">
  <!-- App-Header mit Tages-Streak, Sternchen, Matrix-Button & Audio-Schalter -->
  <header class="app-header">
    <button
      type="button"
      class="brand-btn"
      onclick={() => (currentScreen = 'home')}
      title="Zur Startseite"
    >
      <span class="brand-logo">1×1</span>
      <span class="brand-name">Meister</span>
    </button>

    <div class="header-badges">
      <div
        class="reward-pill streak-pill"
        title="Tages-Streak: {stats.streakDays} {stats.streakDays === 1 ? 'Tag' : 'Tage'} in Folge geübt"
      >
        <span aria-hidden="true">🔥</span>
        <span>{stats.streakDays}</span>
      </div>

      <div
        class="reward-pill stars-pill"
        title="Gesammelte Sterne: {stats.stars}"
      >
        <span aria-hidden="true">⭐</span>
        <span>{stats.stars}</span>
      </div>

      <button
        type="button"
        class="icon-nav-btn"
        class:active={currentScreen === 'matrix'}
        onclick={() =>
          (currentScreen = currentScreen === 'matrix' ? 'home' : 'matrix')}
        aria-label="10 mal 10 Matrix anzeigen"
        title="1×1-Matrix (Fortschritt)"
      >
        📊
      </button>

      <button
        type="button"
        class="icon-nav-btn"
        onclick={toggleSound}
        aria-label={stats.soundEnabled ? 'Ton ausschalten' : 'Ton einschalten'}
        title={stats.soundEnabled ? 'Ton ist an' : 'Ton ist aus'}
      >
        {stats.soundEnabled ? '🔊' : '🔇'}
      </button>
    </div>
  </header>

  <!-- Hauptbereich -->
  <main class="app-main">
    {#if currentScreen === 'home'}
      <HomeView
        {cards}
        {stats}
        onUpdateSettings={updateSettings}
        onStartSession={startSession}
        onOpenMatrix={() => (currentScreen = 'matrix')}
      />
    {:else if currentScreen === 'practice'}
      <PracticeView
        initialQueue={activeSessionQueue}
        soundEnabled={stats.soundEnabled}
        onCardEvaluated={handleCardEvaluated}
        onFinishSession={() => (currentScreen = 'home')}
        onOpenMatrix={() => (currentScreen = 'matrix')}
        onRestartSession={() => {
          activeSessionQueue = buildSessionQueue(
            cards,
            stats.learningMode,
            stats.selectedRows,
            stats.typeFilter,
            stats.sessionSize
          );
        }}
      />
    {:else if currentScreen === 'matrix'}
      <MatrixView
        {cards}
        onPracticeRow={startSingleRowSession}
        onBack={() => (currentScreen = 'home')}
        onResetProgress={handleResetProgress}
      />
    {/if}
  </main>
</div>

<style>
  .app-shell {
    width: 100%;
    max-width: 520px;
    margin: 0 auto;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    padding: 12px 14px;
    box-sizing: border-box;
  }

  .app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    background: #ffffff;
    border: 2px solid #e0e7ff;
    border-radius: 20px;
    padding: 10px 12px;
    margin-bottom: 14px;
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.08);
  }

  .brand-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
  }

  .brand-logo {
    background: linear-gradient(135deg, #4f46e5, #4338ca);
    color: #ffffff;
    font-weight: 900;
    font-size: 1rem;
    padding: 6px 10px;
    border-radius: 12px;
    letter-spacing: -0.03em;
  }

  .brand-name {
    font-size: 1.12rem;
    font-weight: 900;
    color: #1e1b4b;
  }

  .header-badges {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .reward-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 0.88rem;
    font-weight: 900;
  }

  .streak-pill {
    background: #ffedd5;
    color: #c2410c;
  }

  .stars-pill {
    background: #fef3c7;
    color: #b45309;
  }

  .icon-nav-btn {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    border: 2px solid #e0e7ff;
    background: #f8fafc;
    font-size: 1.05rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: all 0.12s ease;
  }

  .icon-nav-btn:hover,
  .icon-nav-btn.active {
    background: #eef2ff;
    border-color: #6366f1;
  }

  .app-main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
</style>

