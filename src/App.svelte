<script lang="ts">
  import { onMount } from 'svelte';
  import BrandLogo from './components/BrandLogo.svelte';
  import HomeView from './components/HomeView.svelte';
  import LegalView from './components/LegalView.svelte';
  import MatrixView from './components/MatrixView.svelte';
  import PracticeView from './components/PracticeView.svelte';
  import UserModal from './components/UserModal.svelte';
  import { playKeyTap } from './lib/audio';
  import { applyDynamicHomeScreenIcon } from './lib/logos';
  import {
    buildSessionQueue,
    createNewProfile,
    loadLogoVariant,
    loadProfilesAndActiveId,
    registerDailyPractice,
    resetProfileData,
    saveLogoVariant,
    saveProfilesAndActiveId,
    setManualStreak,
  } from './lib/storage';
  import type {
    LogoVariantId,
    TaskCard,
    UserProfile,
    UserStats,
  } from './lib/types';

  type ActiveScreen = 'home' | 'practice' | 'matrix' | 'users' | 'legal';

  const initialData = loadProfilesAndActiveId();

  let profiles = $state<UserProfile[]>(initialData.profiles);
  let activeProfileId = $state<string>(initialData.activeProfileId);
  let logoVariant = $state<LogoVariantId>(loadLogoVariant());
  let currentScreen = $state<ActiveScreen>('home');
  let activeSessionQueue = $state<TaskCard[]>([]);

  let activeProfile = $derived(
    profiles.find((p) => p.id === activeProfileId) ?? profiles[0]
  );
  let cards = $derived(activeProfile.cards);
  let stats = $derived(activeProfile.stats);

  function persistAll(nextProfiles: UserProfile[], nextActiveId = activeProfileId) {
    profiles = nextProfiles;
    activeProfileId = nextActiveId;
    saveProfilesAndActiveId(nextProfiles, nextActiveId);
  }

  function updateActiveProfile(updater: (prof: UserProfile) => UserProfile) {
    const next = profiles.map((p) => (p.id === activeProfile.id ? updater(p) : p));
    persistAll(next, activeProfile.id);
  }

  function updateSettings(partial: Partial<UserStats>) {
    updateActiveProfile((prof) => ({
      ...prof,
      stats: { ...prof.stats, ...partial },
    }));
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
    updateActiveProfile((prof) => {
      const nextCards = prof.cards.map((c) =>
        c.id === updatedCard.id ? updatedCard : c
      );
      const withStreak = registerDailyPractice(prof.stats);
      const nextStats: UserStats = {
        ...withStreak,
        stars: withStreak.stars + starsEarned,
        totalSolved: isCorrect
          ? withStreak.totalSolved + 1
          : withStreak.totalSolved,
        fastSolved: isFast ? withStreak.fastSolved + 1 : withStreak.fastSolved,
      };
      return {
        ...prof,
        cards: nextCards,
        stats: nextStats,
      };
    });
  }

  function avatarToLogo(avatar: string): LogoVariantId | null {
    if (avatar === '🐧') return 'penguin';
    if (avatar === '🦦') return 'otter';
    if (avatar === '🦉') return 'owl';
    if (avatar === '🚀') return 'rocket';
    if (avatar === '🦊') return 'fox';
    return null;
  }

  onMount(() => {
    applyDynamicHomeScreenIcon(logoVariant);
  });

  function handleSelectProfile(id: string) {
    const target = profiles.find((p) => p.id === id);
    if (target) {
      persistAll(profiles, id);
      const preferred = target.logoVariant ?? avatarToLogo(target.avatar);
      if (preferred && preferred !== logoVariant) {
        logoVariant = preferred;
        saveLogoVariant(preferred);
        applyDynamicHomeScreenIcon(preferred);
      }
    }
  }

  function handleCreateProfile(name: string, avatar: string) {
    const created = createNewProfile(name, avatar);
    const matchedLogo = avatarToLogo(avatar);
    if (matchedLogo) {
      created.logoVariant = matchedLogo;
      logoVariant = matchedLogo;
      saveLogoVariant(matchedLogo);
      applyDynamicHomeScreenIcon(matchedLogo);
    }
    const next = [...profiles, created];
    persistAll(next, created.id);
  }

  function handleDeleteProfile(id: string) {
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

  function handleResetProfile(id: string) {
    const next = profiles.map((p) => (p.id === id ? resetProfileData(p) : p));
    persistAll(next, activeProfileId);
  }

  function handleSetManualStreak(id: string, streakDays: number) {
    const next = profiles.map((p) =>
      p.id === id
        ? { ...p, stats: setManualStreak(p.stats, streakDays) }
        : p
    );
    persistAll(next, activeProfileId);
  }

  function handleSelectLogo(variant: LogoVariantId) {
    logoVariant = variant;
    saveLogoVariant(variant);
    updateActiveProfile((prof) => ({ ...prof, logoVariant: variant }));
    applyDynamicHomeScreenIcon(variant);
  }
</script>

<div class="app-shell">
  <!-- App-Header mit neuem Logo, Benutzer-Umschalter, Tages-Streak, Sternchen, Matrix & Ton -->
  <header class="app-header">
    <button
      type="button"
      class="brand-btn"
      onclick={() => (currentScreen = 'home')}
      title="Zur Startseite"
    >
      <BrandLogo variant={logoVariant} size={40} />
      <div class="brand-text-col">
        <span class="brand-name">1×1 Meister</span>
        <span class="brand-user-sub">{activeProfile.avatar} {activeProfile.name}</span>
      </div>
    </button>

    <div class="header-badges">
      <button
        type="button"
        class="user-pill-btn"
        class:active={currentScreen === 'users'}
        onclick={() =>
          (currentScreen = currentScreen === 'users' ? 'home' : 'users')}
        title="Benutzer wechseln oder verwalten ({activeProfile.name})"
      >
        <span class="u-avatar">{activeProfile.avatar}</span>
        <span class="u-name">{activeProfile.name}</span>
      </button>

      <button
        type="button"
        class="reward-pill streak-pill"
        onclick={() => (currentScreen = 'users')}
        title="Tages-Streak: {stats.streakDays} {stats.streakDays === 1 ? 'Tag' : 'Tage'} (Antippen zum Bearbeiten)"
      >
        <span aria-hidden="true">🔥</span>
        <span>{stats.streakDays}</span>
      </button>

      <div
        class="reward-pill stars-pill"
        title="Gesammelte Sterne von {activeProfile.name}: {stats.stars}"
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
        onResetProgress={() => handleResetProfile(activeProfile.id)}
      />
    {:else if currentScreen === 'users'}
      <UserModal
        {profiles}
        activeProfileId={activeProfile.id}
        {logoVariant}
        onSelectProfile={handleSelectProfile}
        onCreateProfile={handleCreateProfile}
        onDeleteProfile={handleDeleteProfile}
        onResetProfile={handleResetProfile}
        onSetManualStreak={handleSetManualStreak}
        onSelectLogo={handleSelectLogo}
        onClose={() => (currentScreen = 'home')}
      />
    {:else if currentScreen === 'legal'}
      <LegalView onBack={() => (currentScreen = 'home')} />
    {/if}
  </main>

  <!-- Footer mit Impressum & Datenschutz sowie Schnellzugriff auf Benutzerverwaltung -->
  <footer class="app-footer">
    <button
      type="button"
      class="footer-link"
      onclick={() => (currentScreen = 'users')}
    >
      👥 Benutzer &amp; Streak ({activeProfile.name})
    </button>
    <span class="footer-sep">·</span>
    <button
      type="button"
      class="footer-link"
      onclick={() => (currentScreen = 'legal')}
    >
      Impressum &amp; Datenschutz
    </button>
  </footer>
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
    padding: 9px 11px;
    margin-bottom: 14px;
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.08);
    flex-wrap: wrap;
  }

  .brand-btn {
    display: flex;
    align-items: center;
    gap: 9px;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
  }

  .brand-text-col {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
  }

  .brand-name {
    font-size: 1.05rem;
    font-weight: 900;
    color: #1e1b4b;
  }

  .brand-user-sub {
    font-size: 0.72rem;
    font-weight: 700;
    color: #6366f1;
  }

  .header-badges {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
  }

  .user-pill-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border-radius: 999px;
    border: 1.5px solid #c7d2fe;
    background: #eef2ff;
    color: #312e81;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 800;
    cursor: pointer;
    max-width: 125px;
  }

  .user-pill-btn.active,
  .user-pill-btn:hover {
    background: #e0e7ff;
    border-color: #6366f1;
  }

  .u-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .reward-pill {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 5px 9px;
    border-radius: 999px;
    font-size: 0.84rem;
    font-weight: 900;
    border: none;
    font-family: inherit;
  }

  .streak-pill {
    background: #ffedd5;
    color: #c2410c;
    cursor: pointer;
  }

  .streak-pill:hover {
    background: #fed7aa;
  }

  .stars-pill {
    background: #fef3c7;
    color: #b45309;
  }

  .icon-nav-btn {
    width: 36px;
    height: 36px;
    border-radius: 11px;
    border: 2px solid #e0e7ff;
    background: #f8fafc;
    font-size: 1rem;
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

  .app-footer {
    margin-top: auto;
    padding: 12px 6px 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 0.78rem;
    color: #64748b;
  }

  .footer-link {
    background: transparent;
    border: none;
    color: #64748b;
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 700;
    text-decoration: underline;
    cursor: pointer;
    padding: 2px 4px;
  }

  .footer-link:hover {
    color: #4f46e5;
  }

  .footer-sep {
    color: #cbd5e1;
  }
</style>
