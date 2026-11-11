<script lang="ts">
  import { onMount } from 'svelte';
  import MatrixView from '../components/MatrixView.svelte';
  import { playKeyTap } from '../lib/audio';
  import {
    buildSessionQueue,
    createNewProfile,
    loadProfilesAndActiveId,
    removeProfileStorageKeys,
    resetProfileData,
    saveProfilesAndActiveId,
    setManualStreak,
  } from '../lib/storage';
  import type { GameMode, TaskCard, TypeFilter, UserProfile, UserStats } from '../lib/types';
  import HomeViewV2 from './components/HomeViewV2.svelte';
  import PracticeViewV2 from './components/PracticeViewV2.svelte';
  import UserModalV2 from './components/UserModalV2.svelte';
  import type { WorldChapter } from './lib/chapters';
  import { themeManager } from './lib/theme';

  type Screen = 'home' | 'practice' | 'matrix' | 'users';

  let currentScreen = $state<Screen>('home');
  let loaded = loadProfilesAndActiveId();
  let profiles = $state<UserProfile[]>(loaded.profiles);
  let activeProfileId = $state<string>(loaded.activeProfileId);

  let activeSessionQueue = $state<TaskCard[]>([]);

  let activeProfile = $derived(
    profiles.find((p) => p.id === activeProfileId) ?? profiles[0]
  );
  let gameMode = $derived<GameMode>(activeProfile.activeGameMode ?? 'mult');
  let cards = $derived(
    gameMode === 'plusminus' ? activeProfile.plusMinusCards : activeProfile.cards
  );
  let stats = $derived<UserStats>(
    gameMode === 'plusminus' ? activeProfile.plusMinusStats : activeProfile.stats
  );

  onMount(() => {
    themeManager.init();
  });

  function persistAll(nextProfiles: UserProfile[], nextActiveId: string) {
    profiles = nextProfiles;
    activeProfileId = nextActiveId;
    saveProfilesAndActiveId(nextProfiles, nextActiveId);
  }

  function updateActiveProfile(updater: (prof: UserProfile) => UserProfile) {
    const next = profiles.map((p) =>
      p.id === activeProfile.id ? updater(p) : p
    );
    persistAll(next, activeProfile.id);
  }

  function handleSetProfileGameMode(id: string, mode: GameMode) {
    const next = profiles.map((p) =>
      p.id === id ? { ...p, activeGameMode: mode } : p
    );
    persistAll(next, activeProfileId);
  }

  function handleToggleSound() {
    const nextSound = !stats.soundEnabled;
    updateActiveProfile((prof) => ({
      ...prof,
      stats: { ...prof.stats, soundEnabled: nextSound },
      plusMinusStats: { ...prof.plusMinusStats, soundEnabled: nextSound },
    }));
    if (nextSound) playKeyTap(true);
  }

  function handleSetTypeFilter(filter: TypeFilter) {
    updateActiveProfile((prof) => {
      const mode = prof.activeGameMode ?? 'mult';
      if (mode === 'plusminus') {
        return {
          ...prof,
          plusMinusStats: { ...prof.plusMinusStats, typeFilter: filter },
        };
      }
      return {
        ...prof,
        stats: { ...prof.stats, typeFilter: filter },
      };
    });
  }

  function startDailySession() {
    activeSessionQueue = buildSessionQueue(
      cards,
      'daily',
      stats.selectedRows,
      stats.typeFilter,
      stats.sessionSize,
      gameMode,
      stats.plusMinusFocus ?? 'up_to_10'
    );
    currentScreen = 'practice';
  }

  function startRowSession(row: number) {
    updateActiveProfile((prof) => {
      const mode = prof.activeGameMode ?? 'mult';
      if (mode === 'plusminus') {
        return {
          ...prof,
          plusMinusStats: {
            ...prof.plusMinusStats,
            selectedRows: [row],
            learningMode: 'rows',
          },
        };
      }
      return {
        ...prof,
        stats: {
          ...prof.stats,
          selectedRows: [row],
          learningMode: 'rows',
        },
      };
    });

    activeSessionQueue = buildSessionQueue(
      cards,
      'rows',
      [row],
      stats.typeFilter,
      stats.sessionSize,
      gameMode,
      'rows'
    );
    currentScreen = 'practice';
  }

  function startChapterSession(chapter: WorldChapter) {
    if (gameMode === 'mult' && chapter.rows) {
      activeSessionQueue = buildSessionQueue(
        cards,
        'rows',
        chapter.rows,
        stats.typeFilter,
        stats.sessionSize,
        'mult',
        'rows'
      );
    } else if (gameMode === 'plusminus' && chapter.pmFocus) {
      activeSessionQueue = buildSessionQueue(
        cards,
        'rows',
        [],
        stats.typeFilter,
        stats.sessionSize,
        'plusminus',
        chapter.pmFocus
      );
    } else {
      activeSessionQueue = buildSessionQueue(
        cards,
        'daily',
        [],
        stats.typeFilter,
        stats.sessionSize,
        gameMode
      );
    }
    currentScreen = 'practice';
  }

  function startCustomSession(customCards: TaskCard[]) {
    activeSessionQueue = [...customCards];
    currentScreen = 'practice';
  }

  function handleCardEvaluated(
    updatedCard: TaskCard,
    starsEarned: number,
    isCorrect: boolean,
    isFast: boolean
  ) {
    updateActiveProfile((prof) => {
      const mode = prof.activeGameMode ?? 'mult';
      if (mode === 'plusminus') {
        const nextPmCards = prof.plusMinusCards.map((c) =>
          c.id === updatedCard.id ? updatedCard : c
        );
        const curStats = prof.plusMinusStats;
        return {
          ...prof,
          plusMinusCards: nextPmCards,
          plusMinusStats: {
            ...curStats,
            stars: curStats.stars + starsEarned,
            totalSolved: curStats.totalSolved + 1,
            fastSolved: curStats.fastSolved + (isFast ? 1 : 0),
          },
        };
      }

      const nextCards = prof.cards.map((c) =>
        c.id === updatedCard.id ? updatedCard : c
      );
      const curStats = prof.stats;
      return {
        ...prof,
        cards: nextCards,
        stats: {
          ...curStats,
          stars: curStats.stars + starsEarned,
          totalSolved: curStats.totalSolved + 1,
          fastSolved: curStats.fastSolved + (isFast ? 1 : 0),
        },
      };
    });
  }

  function handleSelectProfile(id: string) {
    activeProfileId = id;
    saveProfilesAndActiveId(profiles, id);
  }

  function handleCreateProfile(name: string, avatar: string) {
    const fresh = createNewProfile(name, avatar);
    persistAll([...profiles, fresh], fresh.id);
  }

  function handleUpdateProfile(id: string, name: string, avatar: string) {
    const next = profiles.map((p) =>
      p.id === id ? { ...p, name: name.trim() || p.name, avatar } : p
    );
    persistAll(next, activeProfileId);
  }

  function handleDeleteProfile(id: string) {
    removeProfileStorageKeys(id);
    const remaining = profiles.filter((p) => p.id !== id);
    if (remaining.length === 0) {
      const fresh = createNewProfile('Spieler 1', '🐧');
      persistAll([fresh], fresh.id);
    } else {
      const nextActive =
        activeProfileId === id ? remaining[0].id : activeProfileId;
      persistAll(remaining, nextActive);
    }
  }

  function handleResetProfile(id: string, targetMode: GameMode | 'both') {
    const next = profiles.map((p) =>
      p.id === id ? resetProfileData(p, targetMode) : p
    );
    persistAll(next, activeProfileId);
  }

  function handleSetManualStreak(
    id: string,
    streakDays: number,
    targetMode: GameMode
  ) {
    const next = profiles.map((p) => {
      if (p.id !== id) return p;
      if (targetMode === 'plusminus') {
        return {
          ...p,
          plusMinusStats: setManualStreak(p.plusMinusStats, streakDays),
        };
      }
      return {
        ...p,
        stats: setManualStreak(p.stats, streakDays),
      };
    });
    persistAll(next, activeProfileId);
  }
</script>

<main class="w-full min-h-dvh p-3 sm:p-5 flex flex-col justify-between">
  {#if currentScreen === 'home'}
    <HomeViewV2
      {gameMode}
      {cards}
      {stats}
      {activeProfile}
      soundEnabled={stats.soundEnabled}
      onToggleSound={handleToggleSound}
      onStartSession={startDailySession}
      onStartRowSession={startRowSession}
      onStartCustomSession={startCustomSession}
      onStartChapterSession={startChapterSession}
      onOpenMatrix={() => (currentScreen = 'matrix')}
      onOpenUsers={() => (currentScreen = 'users')}
    />
  {:else if currentScreen === 'practice'}
    <PracticeViewV2
      initialQueue={activeSessionQueue}
      soundEnabled={stats.soundEnabled}
      onCardEvaluated={handleCardEvaluated}
      onFinishSession={() => (currentScreen = 'home')}
      onRestartSession={() => (currentScreen = 'home')}
    />
  {:else if currentScreen === 'matrix'}
    <div class="w-full max-w-xl mx-auto">
      <MatrixView
        {gameMode}
        {cards}
        onSwitchGameMode={(mode) => handleSetProfileGameMode(activeProfile.id, mode)}
        onPracticeRow={startRowSession}
        onBack={() => (currentScreen = 'home')}
        onResetProgress={() => handleResetProfile(activeProfile.id, gameMode)}
      />
    </div>
  {/if}

  {#if currentScreen === 'users'}
    <UserModalV2
      {profiles}
      activeProfileId={activeProfile.id}
      {gameMode}
      typeFilter={stats.typeFilter}
      onSelectProfile={handleSelectProfile}
      onCreateProfile={handleCreateProfile}
      onUpdateProfile={handleUpdateProfile}
      onDeleteProfile={handleDeleteProfile}
      onResetProfile={handleResetProfile}
      onSetManualStreak={handleSetManualStreak}
      onSetGameMode={handleSetProfileGameMode}
      onSetTypeFilter={handleSetTypeFilter}
      onClose={() => (currentScreen = 'home')}
    />
  {/if}
</main>
