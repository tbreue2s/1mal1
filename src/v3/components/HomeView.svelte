<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getWorldChaptersV3,
    type WorldChapterV3,
  } from '../lib/chapters';
  import {
    checkHasV2Data,
    getImportPromptStatus,
    importProfilesFromV2,
    setImportPromptStatus,
  } from '../lib/migration';
  import { countDueFactsV3 } from '../lib/storage';
  import type { FactFamily, GameMode, UserProfileV3, UserStatsV3 } from '../lib/types';
  import Heatmap from './Heatmap.svelte';

  interface Props {
    gameMode: GameMode;
    facts: FactFamily[];
    stats: UserStatsV3;
    activeProfile: UserProfileV3;
    profiles: UserProfileV3[];
    soundEnabled: boolean;
    onSwitchGameMode: (mode: GameMode) => void;
    onSelectProfile: (id: string) => void;
    onToggleSound: () => void;
    onStartDailySession: () => void;
    onStartChapterSession: (chapter: WorldChapterV3) => void;
    onPracticeFact: (fact: FactFamily) => void;
    onOpenMatrix: () => void;
    onOpenUsers: () => void;
    onImportSuccess: (profiles: UserProfileV3[]) => void;
  }

  let {
    gameMode,
    facts,
    stats,
    activeProfile,
    profiles,
    soundEnabled,
    onSwitchGameMode,
    onSelectProfile,
    onToggleSound,
    onStartDailySession,
    onStartChapterSession,
    onPracticeFact,
    onOpenMatrix,
    onOpenUsers,
    onImportSuccess,
  }: Props = $props();

  let chapters = $derived(getWorldChaptersV3(facts, gameMode));
  let dueCount = $derived(countDueFactsV3(facts));

  let selectedChapterId = $state<string | null>(null);
  let selectedChapter = $derived(
    selectedChapterId
      ? chapters.find((c) => c.id === selectedChapterId) ?? null
      : null
  );

  let showFirstRunImportModal = $state(false);
  let showUserDropdown = $state(false);

  onMount(() => {
    // Prüfe First-Run Import Onboarding
    const status = getImportPromptStatus();
    if (status === 'pending' && checkHasV2Data()) {
      showFirstRunImportModal = true;
    }
  });

  function handleFirstRunImportYes() {
    const res = importProfilesFromV2();
    if (res.success && res.profiles.length > 0) {
      onImportSuccess(res.profiles);
    }
    showFirstRunImportModal = false;
  }

  function handleFirstRunImportLater() {
    showFirstRunImportModal = false;
  }

  function handleFirstRunImportNever() {
    setImportPromptStatus('never');
    showFirstRunImportModal = false;
  }
</script>

<div class="w-full max-w-lg mx-auto space-y-3.5 pb-8">
  <!-- 1. KOPFZEILE MIT PROFIL, STREAK, STERNE & EINSTELLUNGEN -->
  <header class="flex items-center justify-between bg-white dark:bg-[#111827] rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-xs relative">
    <!-- Profil-Button -->
    <div class="relative">
      <button
        type="button"
        onclick={() => (showUserDropdown = !showUserDropdown)}
        class="flex items-center gap-2.5 text-left bg-transparent border-none p-0 cursor-pointer"
        aria-haspopup="true"
        aria-expanded={showUserDropdown}
      >
        <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-xl shadow-2xs">
          {activeProfile.avatar}
        </div>
        <div>
          <div class="flex items-center gap-1.5">
            <span class="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
              {activeProfile.name}
            </span>
            <span class="text-[10px] text-slate-400 font-black">▾</span>
          </div>
          <span class="text-[11px] font-medium text-slate-400 dark:text-slate-400">
            ZahlenBlitz v3.0
          </span>
        </div>
      </button>

      {#if showUserDropdown}
        <div class="absolute left-0 top-full mt-2 w-60 bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-slide-up">
          <div class="px-2.5 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Spieler wechseln
          </div>

          {#each profiles as prof (prof.id)}
            {@const isCurrent = prof.id === activeProfile.id}
            <button
              type="button"
              onclick={() => {
                showUserDropdown = false;
                onSelectProfile(prof.id);
              }}
              class="w-full flex items-center gap-2.5 p-2 rounded-xl text-left border-none cursor-pointer transition {
                isCurrent
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-950 dark:text-white font-bold'
                  : 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200'
              }"
            >
              <span class="text-xl shrink-0">{prof.avatar}</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-1">
                  <span class="font-black text-xs truncate">{prof.name}</span>
                  {#if isCurrent}
                    <span class="text-indigo-600 text-xs font-black">✓</span>
                  {/if}
                </div>
              </div>
            </button>
          {/each}

          <div class="border-t border-slate-100 dark:border-slate-800 my-1"></div>

          <button
            type="button"
            onclick={() => {
              showUserDropdown = false;
              onOpenUsers();
            }}
            class="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs font-black text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border-none cursor-pointer"
          >
            <span>⚙️</span>
            <span>Optionen &amp; Spieler verwalten</span>
          </button>
        </div>
      {/if}
    </div>

    <!-- Stats & Quick Actions -->
    <div class="flex items-center gap-1.5 text-xs font-bold">
      <!-- Streak -->
      <div
        class="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-xl border border-amber-200/60 dark:border-amber-800/30"
        title="Streak: {stats.streakDays} Tage"
      >
        <span>🔥 {stats.streakDays}</span>
        {#if dueCount > 0}
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
        {:else}
          <span class="text-[10px] text-emerald-500 font-black">✓</span>
        {/if}
      </div>

      <!-- Sterne -->
      <div class="flex items-center gap-1 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 px-2 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/40">
        <span class="text-amber-500 text-xs">⭐</span>
        <span>{stats.stars}</span>
      </div>

      <!-- Sound Toggle -->
      <button
        type="button"
        onclick={onToggleSound}
        class="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs border border-transparent cursor-pointer"
        title={soundEnabled ? 'Ton stumm' : 'Ton an'}
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>

      <!-- Einstellungen -->
      <button
        type="button"
        onclick={onOpenUsers}
        class="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
        title="Einstellungen"
      >
        ⚙️
      </button>
    </div>
  </header>

  <!-- 2. PROMINENTER SPIELMODUS-UMSCHALTER (1 KLICK) -->
  <div class="grid grid-cols-2 gap-1.5 bg-slate-200/70 dark:bg-slate-800 p-1.5 rounded-2xl shadow-inner">
    <button
      type="button"
      onclick={() => onSwitchGameMode('plusminus')}
      class="py-2.5 px-3 rounded-xl text-xs font-black transition border-none cursor-pointer flex items-center justify-center gap-1.5 {
        gameMode === 'plusminus'
          ? 'bg-white dark:bg-[#111827] text-indigo-600 dark:text-indigo-400 shadow-sm'
          : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
      }"
    >
      <span>➕</span>
      <span>Zahlen-Held (+ / −)</span>
    </button>
    <button
      type="button"
      onclick={() => onSwitchGameMode('mult')}
      class="py-2.5 px-3 rounded-xl text-xs font-black transition border-none cursor-pointer flex items-center justify-center gap-1.5 {
        gameMode === 'mult'
          ? 'bg-white dark:bg-[#111827] text-indigo-600 dark:text-indigo-400 shadow-sm'
          : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
      }"
    >
      <span>✖️</span>
      <span>1×1 Meister (× / :)</span>
    </button>
  </div>

  <!-- 3. HERO: TAGES-MISSION -->
  <section class="bg-gradient-to-br from-indigo-950 via-[#0f172a] to-[#0f172a] rounded-3xl p-4 text-white border border-indigo-500/20 shadow-sm relative overflow-hidden" aria-label="Tages-Mission">
    <div class="flex items-center justify-between text-xs mb-1.5">
      <span class="text-[10px] uppercase tracking-wider font-extrabold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-400/20">
        Tages-Mission
      </span>
      <span class="text-[11px] text-slate-300 font-medium flex items-center gap-1">
        {#if dueCount > 0}
          <span class="text-amber-400">●</span> {dueCount} Wiederholungen fällig
        {:else}
          <span class="text-emerald-400">✓</span> Alles aufgefrischt!
        {/if}
      </span>
    </div>

    <h2 class="text-base font-extrabold text-white mt-1">
      {dueCount >= stats.sessionSize
        ? `${stats.sessionSize} Fakten: Auffrischen & Neues`
        : `${stats.sessionSize} gemischte Trainings-Fakten`}
    </h2>
    <p class="text-xs text-slate-300 mt-0.5">
      {gameMode === 'mult'
        ? 'Festigt das 1×1 im Langzeitgedächtnis und schaltet Umkehraufgaben frei.'
        : 'Festigt Zerlegungen und Zehnerstopp im Langzeitgedächtnis.'}
    </p>

    <button
      type="button"
      onclick={onStartDailySession}
      class="mt-3.5 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition btn-calm-primary cursor-pointer border-none shadow-sm"
    >
      <span>▶</span>
      <span>Tages-Mission starten</span>
    </button>
  </section>

  <!-- 4. RECHENWELTEN: 3 STRATEGIE-KAPITEL -->
  <section class="bg-white dark:bg-[#111827] rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs" aria-label="Rechenwelten">
    <div class="flex items-center justify-between mb-2">
      <div>
        <h3 class="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 m-0">
          <span>🗺️</span> <span>Rechenwelten</span>
        </h3>
        <span class="text-[10px] text-slate-400">
          Tippe auf eine Welt für Details &amp; Üben
        </span>
      </div>
      <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400">
        ⭐ {chapters.reduce((acc, c) => acc + c.stars, 0)} / 9
      </span>
    </div>

    <div class="grid grid-cols-3 gap-2">
      {#each chapters as ch (ch.id)}
        <button
          type="button"
          class="card-press text-left p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between {
            ch.stars < 3 && ch.stars > 0
              ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800/60'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
          }"
          onclick={() => (selectedChapterId = ch.id)}
        >
          <div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-base">{ch.icon}</span>
              <span
                class="text-[9px] font-black px-1 rounded {
                  ch.percent >= 80
                    ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50'
                    : 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/50'
                }"
              >
                {ch.percent}%
              </span>
            </div>

            <div class="font-extrabold text-[11px] text-slate-900 dark:text-slate-100 mt-1.5 leading-snug break-words">
              {ch.title}
            </div>
            <div class="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5 break-words">
              {ch.subtitle}
            </div>
          </div>

          <div class="text-[10px] text-amber-500 mt-2 flex items-center justify-between">
            <span>
              {#if ch.stars === 3}
                ⭐⭐⭐
              {:else if ch.stars === 2}
                ⭐⭐<span class="text-slate-300">⚪</span>
              {:else if ch.stars === 1}
                ⭐<span class="text-slate-300">⚪⚪</span>
              {:else}
                <span class="text-slate-300">⚪⚪⚪</span>
              {/if}
            </span>
            <span class="text-[9px] text-indigo-500 font-bold">Info ›</span>
          </div>
        </button>
      {/each}
    </div>
  </section>

  <!-- 5. 10x10 WISSENSKARTE (HEATMAP) -->
  <Heatmap
    {gameMode}
    {facts}
    onPracticeFact={onPracticeFact}
    onOpenFullscreen={onOpenMatrix}
  />
</div>

<!-- KAPITEL-DRAWER -->
{#if selectedChapter}
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-3"
    onclick={(e) => {
      if (e.target === e.currentTarget) selectedChapterId = null;
    }}
    onkeydown={(e) => {
      if (e.key === 'Escape') selectedChapterId = null;
    }}
    tabindex="-1"
    role="dialog"
    aria-modal="true"
  >
    <div class="w-full max-w-md bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 animate-slide-up">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-2.5">
          <span class="text-3xl">{selectedChapter.icon}</span>
          <div>
            <h4 class="text-sm font-extrabold text-slate-900 dark:text-white m-0">
              {selectedChapter.title}
            </h4>
            <p class="text-[11px] text-slate-400 m-0">
              {selectedChapter.subtitle} · {selectedChapter.statusText}
            </p>
          </div>
        </div>
        <button
          type="button"
          onclick={() => (selectedChapterId = null)}
          class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 text-xs font-bold border-none cursor-pointer flex items-center justify-center"
        >
          ✕
        </button>
      </div>

      <!-- Sterne Fortschritte -->
      <div class="space-y-2">
        <div class="p-2.5 rounded-xl border {selectedChapter.star1Progress.isAchieved ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200'}">
          <div class="flex items-center justify-between text-xs font-extrabold">
            <span>⭐ Stern 1: Grundaufgaben</span>
            <span class="text-[10px]">{selectedChapter.star1Progress.current}/{selectedChapter.star1Progress.total} ({selectedChapter.star1Progress.percent}%)</span>
          </div>
          <p class="text-[11px] text-slate-500 m-0 mt-0.5">{selectedChapter.star1Desc}</p>
        </div>

        <div class="p-2.5 rounded-xl border {selectedChapter.star2Progress.isAchieved ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200'}">
          <div class="flex items-center justify-between text-xs font-extrabold">
            <span>⭐⭐ Stern 2: Umkehraufgaben</span>
            <span class="text-[10px]">{selectedChapter.star2Progress.current}/{selectedChapter.star2Progress.total} ({selectedChapter.star2Progress.percent}%)</span>
          </div>
          <p class="text-[11px] text-slate-500 m-0 mt-0.5">{selectedChapter.star2Desc}</p>
        </div>

        <div class="p-2.5 rounded-xl border {selectedChapter.star3Progress.isAchieved ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200'}">
          <div class="flex items-center justify-between text-xs font-extrabold">
            <span>⭐⭐⭐ Stern 3: Lücken &amp; Meisterschaft</span>
            <span class="text-[10px]">{selectedChapter.star3Progress.current}/{selectedChapter.star3Progress.total} ({selectedChapter.star3Progress.percent}%)</span>
          </div>
          <p class="text-[11px] text-slate-500 m-0 mt-0.5">{selectedChapter.star3Desc}</p>
        </div>
      </div>

      <button
        type="button"
        onclick={() => {
          const ch = selectedChapter;
          selectedChapterId = null;
          if (ch) onStartChapterSession(ch);
        }}
        class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition btn-calm-primary cursor-pointer border-none"
      >
        <span>🚀</span>
        <span>Diese Rechenwelt jetzt üben</span>
      </button>
    </div>
  </div>
{/if}

<!-- 6. FIRST-RUN ONBOARDING MODAL FÜR V2-IMPORT -->
{#if showFirstRunImportModal}
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    aria-label="Spielstände übernehmen"
  >
    <div class="w-full max-w-md bg-white dark:bg-[#111827] border-2 border-indigo-400 dark:border-indigo-600 rounded-3xl p-6 shadow-2xl space-y-4 animate-slide-up">
      <div class="text-4xl text-center">🚀</div>
      <h3 class="text-lg font-black text-slate-900 dark:text-white text-center m-0">
        Willkommen bei ZahlenBlitz 3.0!
      </h3>
      <p class="text-xs text-slate-600 dark:text-slate-300 text-center leading-relaxed m-0">
        Wir haben bestehende Spielstände aus Version 2 gefunden. Möchtest du deine Spielerprofile, Sterne und bisherigen Lernfortschritte direkt in Version 3 mitnehmen?
      </p>

      <div class="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-900 dark:text-indigo-200 font-medium">
        🛡️ <strong>Hinweis:</strong> Deine bisherige Version 2 bleibt dabei zu 100% unverändert erhalten und kann jederzeit weitergenutzt werden.
      </div>

      <div class="space-y-2 pt-1">
        <button
          type="button"
          onclick={handleFirstRunImportYes}
          class="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition btn-calm-primary border-none cursor-pointer flex items-center justify-center gap-2"
        >
          <span>⭐</span>
          <span>Ja, Spielstände jetzt übernehmen</span>
        </button>

        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            onclick={handleFirstRunImportLater}
            class="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-extrabold text-xs border-none cursor-pointer"
          >
            ⏰ Später erinnern
          </button>
          <button
            type="button"
            onclick={handleFirstRunImportNever}
            class="py-2.5 px-3 rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 font-bold text-xs border-none cursor-pointer"
          >
            ✕ Nein, frisch starten
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
