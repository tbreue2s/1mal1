<script lang="ts">
  import { onMount } from 'svelte';
  import HomeView from './components/HomeView.svelte';
  import LegalView from './components/LegalView.svelte';
  import MatrixView from './components/MatrixView.svelte';
  import PracticeView from './components/PracticeView.svelte';
  import UserModal, { type ProfileBackup } from './components/UserModal.svelte';
  import { playKeyTap } from './lib/audio';
  import { buildChapterSessionQueue, type WorldChapter } from './lib/chapters';
  import { forcePWAUpdate, subscribePWAUpdate } from './lib/pwa';
  import {
    buildSessionQueue,
    createNewProfile,
    loadProfilesAndActiveId,
    registerDailyPractice,
    removeProfileStorageKeys,
    resetProfileData,
    saveProfilesAndActiveId,
    setManualStreak,
  } from './lib/storage';
  import { themeManager } from './lib/theme.svelte';
  import type { GameMode, TaskCard, UserProfile, UserStats } from './lib/types';

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

  const isDevelop =
    typeof window !== 'undefined' &&
    (Boolean((window as any).__IS_DEVELOP__) ||
      window.location.pathname.includes('/develop') ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');

  let lastBackup = $state<ProfileBackup | null>(loadInitialBackup());
  let pwaUpdateAvailable = $state(false);

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
    const unsubPWA = subscribePWAUpdate((needRefresh) => {
      pwaUpdateAvailable = needRefresh;
    });
    return unsubPWA;
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

  function startDailySession() {
    activeSessionQueue = buildSessionQueue(
      cards,
      'daily',
      stats.selectedRows,
      'auto',
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
      'auto',
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
        const withStreak = registerDailyPractice(prof.plusMinusStats);
        return {
          ...prof,
          plusMinusCards: nextPmCards,
          plusMinusStats: {
            ...withStreak,
            stars: withStreak.stars + starsEarned,
            totalSolved: isCorrect
              ? withStreak.totalSolved + 1
              : withStreak.totalSolved,
            fastSolved: withStreak.fastSolved + (isFast ? 1 : 0),
          },
        };
      }

      const nextCards = prof.cards.map((c) =>
        c.id === updatedCard.id ? updatedCard : c
      );
      const withStreak = registerDailyPractice(prof.stats);
      return {
        ...prof,
        cards: nextCards,
        stats: {
          ...withStreak,
          stars: withStreak.stars + starsEarned,
          totalSolved: isCorrect
            ? withStreak.totalSolved + 1
            : withStreak.totalSolved,
          fastSolved: withStreak.fastSolved + (isFast ? 1 : 0),
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

  function handleImportProfile(importedProfile: UserProfile, overwriteId?: string) {
    if (overwriteId) {
      const next = profiles.map((p) =>
        p.id === overwriteId ? { ...importedProfile, id: overwriteId } : p
      );
      persistAll(next, overwriteId);
    } else {
      persistAll([...profiles, importedProfile], importedProfile.id);
    }
  }
</script>

<main class="w-full min-h-dvh p-3 sm:p-5 flex flex-col justify-between">
  {#if pwaUpdateAvailable}
    <div
      class="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-indigo-600 text-white text-xs px-3 py-2 rounded-xl shadow-lg font-bold"
      role="status"
    >
      <span>✨ Neue Version verfügbar!</span>
      <button
        type="button"
        onclick={() => forcePWAUpdate()}
        class="bg-white text-indigo-700 px-2 py-1 rounded-lg text-xs font-black cursor-pointer hover:bg-indigo-50 transition border-none"
      >
        Aktualisieren
      </button>
    </div>
  {/if}

  {#if currentScreen === 'home'}
    <HomeView
      {gameMode}
      {cards}
      {stats}
      {activeProfile}
      {profiles}
      {isDevelop}
      soundEnabled={stats.soundEnabled}
      onSelectProfile={handleSelectProfile}
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
    <PracticeView
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
    <UserModal
      {profiles}
      activeProfileId={activeProfile.id}
      {gameMode}
      {lastBackup}
      {isDevelop}
      onSelectProfile={handleSelectProfile}
      onCreateProfile={handleCreateProfile}
      onUpdateProfile={handleUpdateProfile}
      onDeleteProfile={handleDeleteProfile}
      onResetProfile={handleResetProfile}
      onRestoreBackup={handleRestoreBackup}
      onImportProfile={handleImportProfile}
      onSetManualStreak={handleSetManualStreak}
      onSetGameMode={handleSetProfileGameMode}
      onClose={() => (currentScreen = 'home')}
    />
  {/if}
</main>
