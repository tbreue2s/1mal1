<script lang="ts">
  import { onMount } from 'svelte';
  import BrandLogo from './components/BrandLogo.svelte';
  import HomeView from './components/HomeView.svelte';
  import LegalView from '../components/LegalView.svelte';
  import MatrixView from '../components/MatrixView.svelte';
  import PracticeView from './components/PracticeView.svelte';
  import UserModal from './components/UserModal.svelte';
  import { playKeyTap } from '../lib/audio';
  import { applyDynamicHomeScreenIcon } from '../lib/logos';
  import { forcePWAUpdate, subscribePWAUpdate } from '../lib/pwa';
  import {
    buildSessionQueue,
    createNewProfile,
    loadLogoVariant,
    loadProfilesAndActiveId,
    registerDailyPractice,
    removeProfileStorageKeys,
    resetProfileData,
    saveLogoVariant,
    saveProfilesAndActiveId,
    setManualStreak,
  } from '../lib/storage';
  import type {
    GameMode,
    LogoVariantId,
    TaskCard,
    UserProfile,
    UserStats,
  } from '../lib/types';

  type ActiveScreen = 'home' | 'practice' | 'matrix' | 'users' | 'legal';

  const initialData = loadProfilesAndActiveId();

  let profiles = $state<UserProfile[]>(initialData.profiles);
  let activeProfileId = $state<string>(initialData.activeProfileId);
  let logoVariant = $state<LogoVariantId>(loadLogoVariant());
  let currentScreen = $state<ActiveScreen>('home');
  let activeSessionQueue = $state<TaskCard[]>([]);
  let showUserDropdown = $state(false);
  let dropdownWrapEl = $state<HTMLDivElement | null>(null);
  let pwaUpdateAvailable = $state(false);
  let isCheckingUpdate = $state(false);

  let activeProfile = $derived(
    profiles.find((p) => p.id === activeProfileId) ?? profiles[0]
  );

  // Aktiver Spielmodus des ausgewählten Nutzers ('mult' = 1×1 Meister, 'plusminus' = Zahlenheld)
  let gameMode = $derived<GameMode>(activeProfile.activeGameMode ?? 'mult');

  // Isolierte Karten & Statistiken je Nutzer UND je Modus
  let cards = $derived(
    gameMode === 'plusminus' ? activeProfile.plusMinusCards : activeProfile.cards
  );
  let stats = $derived(
    gameMode === 'plusminus' ? activeProfile.plusMinusStats : activeProfile.stats
  );

  function persistAll(nextProfiles: UserProfile[], nextActiveId = activeProfileId) {
    profiles = nextProfiles;
    activeProfileId = nextActiveId;
    saveProfilesAndActiveId(nextProfiles, nextActiveId);
  }

  function updateActiveProfile(updater: (prof: UserProfile) => UserProfile) {
    const next = profiles.map((p) => (p.id === activeProfile.id ? updater(p) : p));
    persistAll(next, activeProfile.id);
  }

  function handleSwitchGameMode(nextMode: GameMode) {
    showUserDropdown = false;
    updateActiveProfile((prof) => ({
      ...prof,
      activeGameMode: nextMode,
    }));
  }

  function handleSetProfileGameMode(id: string, mode: GameMode) {
    const next = profiles.map((p) =>
      p.id === id ? { ...p, activeGameMode: mode } : p
    );
    persistAll(next, activeProfileId);
  }

  function updateSettings(partial: Partial<UserStats>) {
    updateActiveProfile((prof) => {
      const mode = prof.activeGameMode ?? 'mult';
      if (mode === 'plusminus') {
        return {
          ...prof,
          plusMinusStats: { ...prof.plusMinusStats, ...partial },
        };
      }
      return {
        ...prof,
        stats: { ...prof.stats, ...partial },
      };
    });
  }

  function toggleSound() {
    const nextSound = !stats.soundEnabled;
    // Synchronisiere die Ton-Einstellung für beide Modi des Nutzers
    updateActiveProfile((prof) => ({
      ...prof,
      stats: { ...prof.stats, soundEnabled: nextSound },
      plusMinusStats: { ...prof.plusMinusStats, soundEnabled: nextSound },
    }));
    if (nextSound) {
      playKeyTap(true);
    }
  }

  function startSession() {
    showUserDropdown = false;
    activeSessionQueue = buildSessionQueue(
      cards,
      stats.learningMode,
      stats.selectedRows,
      stats.typeFilter,
      stats.sessionSize,
      gameMode,
      stats.plusMinusFocus ?? 'up_to_10'
    );
    currentScreen = 'practice';
  }

  function startSingleRowSession(row: number) {
    showUserDropdown = false;
    updateSettings({
      learningMode: 'rows',
      selectedRows: [row],
      plusMinusFocus: 'rows',
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
        const withStreak = registerDailyPractice(prof.plusMinusStats);
        const nextPmStats: UserStats = {
          ...withStreak,
          stars: withStreak.stars + starsEarned,
          totalSolved: isCorrect
            ? withStreak.totalSolved + 1
            : withStreak.totalSolved,
          fastSolved: isFast
            ? withStreak.fastSolved + 1
            : withStreak.fastSolved,
        };
        return {
          ...prof,
          plusMinusCards: nextPmCards,
          plusMinusStats: nextPmStats,
        };
      }

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
    const unsubPWA = subscribePWAUpdate((needRefresh) => {
      pwaUpdateAvailable = needRefresh;
    });

    function handleOutsideClick(event: MouseEvent) {
      if (
        showUserDropdown &&
        dropdownWrapEl &&
        event.target instanceof Node &&
        !dropdownWrapEl.contains(event.target)
      ) {
        showUserDropdown = false;
      }
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape' && showUserDropdown) {
        showUserDropdown = false;
      }
    }

    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('keydown', handleKeydown);
    return () => {
      unsubPWA();
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('keydown', handleKeydown);
    };
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
    showUserDropdown = false;
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

  function handleUpdateProfile(id: string, name: string, avatar: string) {
    const matchedLogo = avatarToLogo(avatar);
    const next = profiles.map((p) => {
      if (p.id !== id) return p;
      return {
        ...p,
        name: name.trim() || p.name,
        avatar,
        logoVariant: matchedLogo ?? p.logoVariant,
      };
    });
    persistAll(next, activeProfileId);

    if (id === activeProfileId && matchedLogo && matchedLogo !== logoVariant) {
      logoVariant = matchedLogo;
      saveLogoVariant(matchedLogo);
      applyDynamicHomeScreenIcon(matchedLogo);
    }
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

  function handleSelectLogo(variant: LogoVariantId) {
    logoVariant = variant;
    saveLogoVariant(variant);
    updateActiveProfile((prof) => ({ ...prof, logoVariant: variant }));
    applyDynamicHomeScreenIcon(variant);
  }

  async function handlePWAUpdateClick() {
    isCheckingUpdate = true;
    await forcePWAUpdate();
  }
</script>

<div class="app-shell">
  {#if pwaUpdateAvailable}
    <div class="pwa-update-banner" role="status">
      <span>✨ Eine neue Version der App ist verfügbar!</span>
      <button type="button" class="pwa-banner-btn" onclick={handlePWAUpdateClick}>
        Jetzt aktualisieren
      </button>
    </div>
  {/if}

  <!-- App-Header mit Logo, Spieler-Dropdown, Tages-Streak, Sternchen, Matrix & Ton -->
  <header class="app-header">
    <button
      type="button"
      class="brand-btn"
      onclick={() => {
        showUserDropdown = false;
        currentScreen = 'home';
      }}
      title="Zur Startseite"
    >
      <BrandLogo variant={logoVariant} size={40} />
      <div class="brand-text-col">
        <span class="brand-name">
          {gameMode === 'mult' ? '1×1 Meister' : 'Zahlenheld'}
        </span>
        <span class="brand-user-sub" class:sub-pm={gameMode === 'plusminus'}>
          {gameMode === 'mult' ? '✖️ Kleines 1×1' : '➕ Plus & Minus'}
        </span>
      </div>
    </button>

    <div class="header-badges">
      <!-- Spieler-Dropdown -->
      <div class="user-dropdown-wrap" bind:this={dropdownWrapEl}>
        <button
          type="button"
          class="user-pill-btn"
          class:active={showUserDropdown || currentScreen === 'users'}
          aria-haspopup="true"
          aria-expanded={showUserDropdown}
          onclick={() => (showUserDropdown = !showUserDropdown)}
          title="Spieler wechseln ({activeProfile.name})"
        >
          <span class="u-avatar">{activeProfile.avatar}</span>
          <span class="u-name">{activeProfile.name}</span>
          <span class="u-caret" aria-hidden="true">▾</span>
        </button>

        {#if showUserDropdown}
          <div class="user-dropdown-menu" role="menu" aria-label="Spieler auswählen">
            <div class="dropdown-section-label">Spieler wechseln</div>
            {#each profiles as prof (prof.id)}
              {@const isCurrent = prof.id === activeProfile.id}
              {@const profMode = prof.activeGameMode ?? 'mult'}
              {@const profStats =
                profMode === 'plusminus' ? prof.plusMinusStats : prof.stats}
              <button
                type="button"
                role="menuitem"
                class="dropdown-user-item"
                class:current={isCurrent}
                onclick={() => handleSelectProfile(prof.id)}
              >
                <span class="dd-avatar">{prof.avatar}</span>
                <span class="dd-info">
                  <span class="dd-name">{prof.name}</span>
                  <span class="dd-meta">
                    {profMode === 'plusminus' ? '➕' : '✖️'} 🔥 {profStats.streakDays} · ⭐ {profStats.stars}
                  </span>
                </span>
                {#if isCurrent}
                  <span class="dd-check" aria-hidden="true">✓</span>
                {/if}
              </button>
            {/each}

            <div class="dropdown-divider" role="separator"></div>

            <button
              type="button"
              role="menuitem"
              class="dropdown-manage-btn"
              onclick={() => {
                showUserDropdown = false;
                currentScreen = 'users';
              }}
            >
              <span>⚙️ Benutzerverwaltung</span>
            </button>
          </div>
        {/if}
      </div>

      <button
        type="button"
        class="reward-pill streak-pill"
        onclick={() => {
          showUserDropdown = false;
          currentScreen = 'users';
        }}
        title="Tages-Streak ({gameMode === 'mult' ? '1×1' : 'Zahlenheld'}): {stats.streakDays} {stats.streakDays === 1 ? 'Tag' : 'Tage'} (Antippen zum Bearbeiten)"
      >
        <span aria-hidden="true">🔥</span>
        <span>{stats.streakDays}</span>
      </button>

      <div
        class="reward-pill stars-pill"
        title="Gesammelte Sterne von {activeProfile.name} ({gameMode === 'mult' ? '1×1' : 'Zahlenheld'}): {stats.stars}"
      >
        <span aria-hidden="true">⭐</span>
        <span>{stats.stars}</span>
      </div>

      <button
        type="button"
        class="icon-nav-btn"
        class:active={currentScreen === 'matrix'}
        onclick={() => {
          showUserDropdown = false;
          currentScreen = currentScreen === 'matrix' ? 'home' : 'matrix';
        }}
        aria-label="Fortschritts-Tafel anzeigen"
        title="Fortschritts-Tafel"
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
        {gameMode}
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
            stats.sessionSize,
            gameMode,
            stats.plusMinusFocus ?? 'up_to_10'
          );
        }}
      />
    {:else if currentScreen === 'matrix'}
      <MatrixView
        {gameMode}
        {cards}
        onSwitchGameMode={handleSwitchGameMode}
        onPracticeRow={startSingleRowSession}
        onBack={() => (currentScreen = 'home')}
        onResetProgress={() => handleResetProfile(activeProfile.id, gameMode)}
      />
    {:else if currentScreen === 'users'}
      <UserModal
        {profiles}
        activeProfileId={activeProfile.id}
        {logoVariant}
        onSelectProfile={handleSelectProfile}
        onCreateProfile={handleCreateProfile}
        onUpdateProfile={handleUpdateProfile}
        onDeleteProfile={handleDeleteProfile}
        onResetProfile={handleResetProfile}
        onSetManualStreak={handleSetManualStreak}
        onSetGameMode={handleSetProfileGameMode}
        onSelectLogo={handleSelectLogo}
        onClose={() => (currentScreen = 'home')}
      />
    {:else if currentScreen === 'legal'}
      <LegalView onBack={() => (currentScreen = 'home')} />
    {/if}
  </main>

  <!-- Footer mit Benutzerverwaltung, PWA-Update-Button sowie Impressum & Datenschutz -->
  <footer class="app-footer">
    <button
      type="button"
      class="footer-link"
      onclick={() => {
        showUserDropdown = false;
        currentScreen = 'users';
      }}
    >
      👥 Benutzer &amp; Streak ({activeProfile.name})
    </button>
    <span class="footer-sep">·</span>
    <button
      type="button"
      class="footer-link update-link"
      disabled={isCheckingUpdate}
      onclick={handlePWAUpdateClick}
      title="Prüft auf eine neue App-Version und lädt sie ohne Datenverlust"
    >
      {isCheckingUpdate ? '⏳ Aktualisiere …' : '🔄 App-Update'}
    </button>
    <span class="footer-sep">·</span>
    <button
      type="button"
      class="footer-link"
      onclick={() => {
        showUserDropdown = false;
        currentScreen = 'legal';
      }}
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

  .pwa-update-banner {
    background: #ecfdf5;
    border: 2px solid #10b981;
    color: #065f46;
    border-radius: 16px;
    padding: 8px 12px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 0.82rem;
    font-weight: 800;
  }

  .pwa-banner-btn {
    background: #059669;
    color: #ffffff;
    border: none;
    border-radius: 10px;
    padding: 6px 10px;
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 800;
    cursor: pointer;
    white-space: nowrap;
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
    position: relative;
    z-index: 30;
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
    font-weight: 800;
    color: #4f46e5;
  }

  .brand-user-sub.sub-pm {
    color: #0d9488;
  }

  .header-badges {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
  }

  .user-dropdown-wrap {
    position: static;
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
    max-width: 138px;
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

  .u-caret {
    font-size: 0.7rem;
    color: #4f46e5;
    margin-left: 1px;
  }

  .user-dropdown-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 6px;
    right: 6px;
    background: #ffffff;
    border: 2px solid #c7d2fe;
    border-radius: 16px;
    box-shadow: 0 12px 30px rgba(30, 27, 75, 0.22);
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    z-index: 100;
  }

  .dropdown-section-label {
    font-size: 0.68rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748b;
    padding: 4px 8px 2px;
  }

  .dropdown-user-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 9px;
    border: none;
    border-radius: 11px;
    background: transparent;
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.12s ease;
  }

  .dropdown-user-item:hover {
    background: #f1f5f9;
  }

  .dropdown-user-item.current {
    background: #eef2ff;
  }

  .dd-avatar {
    font-size: 1.25rem;
    line-height: 1;
  }

  .dd-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .dd-name {
    font-size: 0.85rem;
    font-weight: 800;
    color: #1e1b4b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dd-meta {
    font-size: 0.72rem;
    font-weight: 700;
    color: #64748b;
  }

  .dd-check {
    font-size: 0.9rem;
    font-weight: 900;
    color: #4f46e5;
  }

  .dropdown-divider {
    height: 1px;
    background: #e2e8f0;
    margin: 4px 2px;
  }

  .dropdown-manage-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 8px 10px;
    border: none;
    border-radius: 11px;
    background: transparent;
    color: #4338ca;
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 800;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.12s ease;
  }

  .dropdown-manage-btn:hover {
    background: #eef2ff;
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

  .update-link {
    color: #0d9488;
  }

  .update-link:hover {
    color: #0f766e;
  }

  .footer-sep {
    color: #cbd5e1;
  }
</style>
