<script lang="ts">
  import { onMount } from 'svelte';
  import LegalView from '../components/LegalView.svelte';
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
  import UserModalV2, { type ProfileBackup } from './components/UserModalV2.svelte';
  import { buildChapterSessionQueue, type WorldChapter } from './lib/chapters';
  import { themeManager } from './lib/theme.svelte';

  type Screen = 'home' | 'practice' | 'matrix' | 'users' | 'legal';

  const BACKUP_STORAGE_KEY = 'v2_last_profile_backup';

  function loadInitialBackup(): ProfileBackup | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(BACKUP_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  let currentScreen = $state<Screen>('home');
  let loaded = loadProfilesAndActiveId();
  let profiles = $state<UserProfile[]>(loaded.profiles);
  let activeProfileId = $state<string>(loaded.activeProfileId);

  let lastBackup = $state<ProfileBackup | null>(loadInitialBackup());

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
    activeSessionQueue = buildChapterSessionQueue(
      cards,
      chapter,
      stats.sessionSize
    );
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
    // Sobald neue Daten erfasst werden, erlischt die temporäre Wiederherstellungsmöglichkeit
    if (lastBackup && lastBackup.profileId === activeProfile.id) {
      lastBackup = null;
      try {
        window.localStorage.removeItem(BACKUP_STORAGE_KEY);
      } catch {}
    }

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
    const profToReset = profiles.find((p) => p.id === id);
    if (profToReset) {
      const backup: ProfileBackup = {
        profileId: id,
        profile: JSON.parse(JSON.stringify(profToReset)),
        modeReset: targetMode,
        timestamp: Date.now(),
      };
      lastBackup = backup;
      try {
        window.localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backup));
      } catch {}
    }

    const next = profiles.map((p) =>
      p.id === id ? resetProfileData(p, targetMode) : p
    );
    persistAll(next, activeProfileId);
  }

  function handleRestoreBackup(id: string) {
    if (!lastBackup || lastBackup.profileId !== id) return;
    const restoredProf = lastBackup.profile;
    const next = profiles.map((p) => (p.id === id ? restoredProf : p));
    persistAll(next, activeProfileId);
    lastBackup = null;
    try {
      window.localStorage.removeItem(BACKUP_STORAGE_KEY);
    } catch {}
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
      onOpenLegal={() => (currentScreen = 'legal')}
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
  {:else if currentScreen === 'legal'}
    <div class="w-full max-w-xl mx-auto">
      <LegalView onBack={() => (currentScreen = 'home')} />
    </div>
  {/if}

  {#if currentScreen === 'users'}
    <UserModalV2
      {profiles}
      activeProfileId={activeProfile.id}
      {gameMode}
      typeFilter={stats.typeFilter}
      {lastBackup}
      onSelectProfile={handleSelectProfile}
      onCreateProfile={handleCreateProfile}
      onUpdateProfile={handleUpdateProfile}
      onDeleteProfile={handleDeleteProfile}
      onResetProfile={handleResetProfile}
      onRestoreBackup={handleRestoreBackup}
      onSetManualStreak={handleSetManualStreak}
      onSetGameMode={handleSetProfileGameMode}
      onSetTypeFilter={handleSetTypeFilter}
      onClose={() => (currentScreen = 'home')}
    />
  {/if}
</main>
