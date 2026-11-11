<script lang="ts">
  import { onMount } from 'svelte';
  import { countDueCards } from '../lib/storage';
  import type { GameMode, TaskCard, UserProfile, UserStats } from '../lib/types';
  import { getWorldChapters, type WorldChapter } from '../lib/chapters';
  import Heatmap from './Heatmap.svelte';

  interface Props {
    gameMode: GameMode;
    cards: TaskCard[];
    stats: UserStats;
    activeProfile: UserProfile;
    profiles: UserProfile[];
    soundEnabled: boolean;
    isDevelop?: boolean;
    onSelectProfile: (id: string) => void;
    onToggleSound: () => void;
    onStartSession: () => void;
    onStartRowSession: (row: number) => void;
    onStartCustomSession: (cards: TaskCard[]) => void;
    onStartChapterSession: (chapter: WorldChapter) => void;
    onOpenMatrix: () => void;
    onOpenUsers: () => void;
    onOpenLegal: () => void;
  }

  let {
    gameMode,
    cards,
    stats,
    activeProfile,
    profiles,
    soundEnabled,
    isDevelop = false,
    onSelectProfile,
    onToggleSound,
    onStartSession,
    onStartRowSession,
    onStartCustomSession,
    onStartChapterSession,
    onOpenMatrix,
    onOpenUsers,
    onOpenLegal,
  }: Props = $props();

  let chapters = $derived(getWorldChapters(cards, gameMode));
  let dueCount = $derived(countDueCards(cards, stats.typeFilter, gameMode));

  let selectedChapter = $state<WorldChapter | null>(null);
  let showUserDropdown = $state(false);
  let dropdownWrapEl = $state<HTMLDivElement | null>(null);

  onMount(() => {
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
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<div class="w-full max-w-lg mx-auto space-y-3.5 pb-8">
  <!-- 1. HEADER MIT STREAK, STERNE, QUICK SOUND & PROFIL -->
  <header class="flex items-center justify-between bg-white dark:bg-[#111827] rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-xs relative">
    <!-- Profil-Button mit Dropdown für schnellen Benutzerwechsel -->
    <div class="relative" bind:this={dropdownWrapEl}>
      <button
        type="button"
        class="flex items-center gap-2.5 text-left bg-transparent border-none p-0 cursor-pointer"
        onclick={() => (showUserDropdown = !showUserDropdown)}
        aria-haspopup="true"
        aria-expanded={showUserDropdown}
        title="Spieler wechseln ({activeProfile.name})"
      >
        <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-xl shadow-2xs">
          {activeProfile.avatar}
        </div>
        <div>
          <div class="flex items-center gap-1.5">
            <span class="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
              {activeProfile.name}
            </span>
            <span class="text-[9px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800/40 px-1.5 py-0.2 rounded-md">
              {gameMode === 'mult' ? '1×1' : '+ / −'}
            </span>
            <span class="text-[10px] text-slate-400 dark:text-slate-500 font-black">▾</span>
          </div>
          <span class="text-[11px] font-medium text-slate-400 dark:text-slate-400">
            {gameMode === 'mult' ? '1×1 Meister' : 'Zahlen-Held'} · Wechseln
          </span>
        </div>
      </button>

      {#if showUserDropdown}
        <div
          class="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-slide-up"
          role="menu"
          aria-label="Spieler auswählen"
        >
          <div class="px-2.5 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Nutzer wechseln
          </div>

          {#each profiles as prof (prof.id)}
            {@const isCurrent = prof.id === activeProfile.id}
            {@const profMode = prof.activeGameMode ?? 'mult'}
            {@const profStats = profMode === 'plusminus' ? prof.plusMinusStats : prof.stats}
            <button
              type="button"
              role="menuitem"
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
                    <span class="text-indigo-600 dark:text-indigo-400 text-xs font-black">✓</span>
                  {/if}
                </div>
                <div class="text-[10px] text-slate-400 font-semibold truncate">
                  {profMode === 'plusminus' ? '➕ Zahlen-Held' : '✖️ 1×1'} · 🔥 {profStats.streakDays} · ⭐ {profStats.stars}
                </div>
              </div>
            </button>
          {/each}

          <div class="border-t border-slate-100 dark:border-slate-800 my-1"></div>

          <!-- Unterste Option: In die Einstellungen / Optionen & Nutzer gehen -->
          <button
            type="button"
            role="menuitem"
            onclick={() => {
              showUserDropdown = false;
              onOpenUsers();
            }}
            class="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs font-black text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border-none cursor-pointer transition"
          >
            <span>⚙️</span>
            <span>Optionen &amp; Nutzer verwalten</span>
          </button>
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-1.5 text-xs font-bold">
      <!-- Streak mit Tagesstatus -->
      <div
        class="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-xl border border-amber-200/60 dark:border-amber-800/30"
        title="Streak: {stats.streakDays} Tage"
      >
        <span>🔥 {stats.streakDays}</span>
        {#if dueCount > 0}
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" title="Heute noch Training fällig"></span>
        {:else}
          <span class="text-[10px] text-emerald-500 font-black" title="Heute bereits erledigt">✓</span>
        {/if}
      </div>

      <!-- Sterne-Counter -->
      <div class="flex items-center gap-1 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 px-2 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/40">
        <span class="text-xs text-amber-500">⭐</span>
        <span>{stats.stars}</span>
      </div>

      <!-- Quick Sound Toggle -->
      <button
        type="button"
        onclick={onToggleSound}
        class="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs border border-transparent"
        title={soundEnabled ? 'Ton stummschalten' : 'Ton aktivieren'}
        aria-label="Ton an oder aus"
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>

      <!-- Optionen & Benutzerverwaltung -->
      <button
        type="button"
        onclick={onOpenUsers}
        class="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        title="Einstellungen & Benutzer"
        aria-label="Einstellungen öffnen"
      >
        ⚙️
      </button>
    </div>
  </header>

  <!-- 2. HERO: TAGES-MISSION (SPACED REPETITION / SM-2) -->
  <section class="bg-gradient-to-br from-indigo-950/90 via-[#0f172a] to-[#0f172a] rounded-3xl p-4 text-white border border-indigo-500/20 dark:border-slate-800 shadow-sm relative overflow-hidden" aria-label="Tages-Mission">
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
        ? `${stats.sessionSize} Auffrisch-Karten (Puffer)`
        : `${stats.sessionSize} gemischte Trainings-Karten`}
    </h2>
    <p class="text-xs text-slate-300 mt-0.5">
      {#if dueCount >= stats.sessionSize}
        Auffrisch-Modus aktiv: Baut fällige Karten ab, bevor neue hinzukommen.
      {:else}
        {gameMode === 'mult'
          ? 'Festigt 1×1-Aufgaben im Langzeitgedächtnis vor dem Vergessen.'
          : 'Schult Verliebte Zahlen & Zehnerübergänge spielerisch im Kopf.'}
      {/if}
    </p>

    <!-- Fortschrittsbalken -->
    <div class="mt-3 flex items-center gap-2.5">
      <div class="flex-1 bg-slate-800/90 rounded-full h-2 p-0.5 overflow-hidden">
        <div
          class="bg-indigo-400 h-full rounded-full transition-all duration-300"
          style="width: {Math.min(100, Math.max(15, (stats.totalSolved % stats.sessionSize) * (100 / stats.sessionSize)))}%"
        ></div>
      </div>
      <span class="text-xs font-bold text-slate-400 tabular-nums">
        {stats.totalSolved % stats.sessionSize}/{stats.sessionSize}
      </span>
    </div>

    <button
      type="button"
      onclick={onStartSession}
      class="mt-3.5 w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition btn-calm-primary cursor-pointer border-none"
    >
      <span>▶</span>
      <span>Tages-Mission starten</span>
    </button>
  </section>

  <!-- 3. RECHENWELTEN: 3 KAPITEL MIT 3-STERNE-PROGRESSION -->
  <section class="bg-white dark:bg-[#111827] rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs" aria-label="Rechenwelten">
    <div class="flex items-center justify-between mb-2">
      <div>
        <h3 class="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 m-0">
          <span>🗺️</span> <span>Rechenwelten</span>
        </h3>
        <span class="text-[10px] text-slate-400">
          Tippe auf eine Welt für Details &amp; Training
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
          onclick={() => (selectedChapter = ch)}
        >
          <div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-base">{ch.icon}</span>
              <span
                class="text-[9px] font-black px-1 rounded {
                  ch.percent >= 90
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                    : ch.percent > 40
                    ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50'
                    : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50'
                }"
              >
                {ch.percent}%
              </span>
            </div>

            <div class="font-extrabold text-[11px] text-slate-900 dark:text-slate-100 mt-1.5 leading-snug break-words hyphens-auto">
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
                ⭐⭐<span class="text-slate-300 dark:text-slate-600">⚪</span>
              {:else if ch.stars === 1}
                ⭐<span class="text-slate-300 dark:text-slate-600">⚪⚪</span>
              {:else}
                <span class="text-slate-300 dark:text-slate-600">⚪⚪⚪</span>
              {/if}
            </span>
            <span class="text-[9px] text-indigo-500 font-bold">Info ›</span>
          </div>
        </button>
      {/each}
    </div>
  </section>

  <!-- 4. 10x10 WISSENSKARTE (HEATMAP DIREKT AUF DEM STARTBILDSCHIRM) -->
  <Heatmap
    {gameMode}
    {cards}
    onPracticeFact={onStartCustomSession}
    onPracticeRow={onStartRowSession}
    onOpenFullscreen={onOpenMatrix}
  />

  <!-- 5. FOOTER LINKS -->
  <footer class="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-1 px-1 font-medium gap-2">
    <button
      type="button"
      onclick={onOpenUsers}
      class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 bg-transparent border-none p-0 cursor-pointer text-xs"
    >
      <span>⚙️</span> <span>Optionen &amp; Nutzer</span>
    </button>

    <button
      type="button"
      onclick={onOpenLegal}
      class="hover:text-slate-700 dark:hover:text-slate-300 bg-transparent border-none p-0 cursor-pointer text-[11px]"
    >
      Impressum &amp; Datenschutz
    </button>

    <div class="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
      <span>App 2.0</span>
      {#if isDevelop}
        <span class="px-1.5 py-0.2 rounded-full bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 text-[9px] font-black uppercase">
          develop
        </span>
      {/if}
      <button
        type="button"
        onclick={() => window.location.reload()}
        class="hover:text-slate-700 dark:hover:text-slate-300 bg-transparent border-none p-0 cursor-pointer text-[11px] leading-none transition"
        title="App neu laden"
        aria-label="App neu laden"
      >
        🔄
      </button>
    </div>
  </footer>
</div>

<!-- 6. KAPITEL-DRAWER (TRANSPARENTE STERNE-ÜBERSICHT) -->
{#if selectedChapter !== null}
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-3"
    onclick={(e) => {
      if (e.target === e.currentTarget) selectedChapter = null;
    }}
    onkeydown={(e) => {
      if (e.key === 'Escape') selectedChapter = null;
    }}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-label="Kapitel-Details"
  >
    <div
      class="w-full max-w-md bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl animate-slide-up text-slate-800 dark:text-slate-100"
    >
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
        <div class="flex items-center gap-2.5">
          <span class="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl border border-indigo-200 dark:border-indigo-800">
            {selectedChapter.icon}
          </span>
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
          onclick={() => (selectedChapter = null)}
          class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-bold border-none cursor-pointer flex items-center justify-center"
        >
          ✕
        </button>
      </div>

      <!-- Sterne-Erklärungsliste -->
      <div class="space-y-2 mb-4">
        <span class="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
          So erreichst du die 3 Sterne:
        </span>

        <!-- Stern 1 -->
        <div
          class="p-2.5 rounded-xl border flex items-start gap-2.5 {
            selectedChapter.star1Progress.isAchieved
              ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
          }"
        >
          <span class="text-base leading-none">⭐</span>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-extrabold {selectedChapter.star1Progress.isAchieved ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}">
                Stern 1: Basis-Aufgaben
              </span>
              {#if selectedChapter.star1Progress.isAchieved}
                <span class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded-md">
                  Erreicht ✓
                </span>
              {:else}
                <span class="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-1.5 py-0.2 rounded-md">
                  {selectedChapter.star1Progress.current} / {selectedChapter.star1Progress.total} gelernt ({selectedChapter.star1Progress.percent}%)
                  {#if selectedChapter.star1Progress.consolidated > 0}
                    · {selectedChapter.star1Progress.consolidated} gefestigt
                  {/if}
                </span>
              {/if}
            </div>

            <!-- Mini Fortschrittsbalken -->
            <div class="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-300 {selectedChapter.star1Progress.isAchieved ? 'bg-emerald-500' : 'bg-indigo-500'}"
                style="width: {selectedChapter.star1Progress.percent}%"
              ></div>
            </div>

            <p class="text-[11px] text-slate-500 dark:text-slate-400 m-0 mt-1">
              {selectedChapter.star1Desc}
            </p>
          </div>
        </div>

        <!-- Stern 2 -->
        <div
          class="p-2.5 rounded-xl border flex items-start gap-2.5 {
            selectedChapter.star2Progress.isAchieved
              ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60'
              : !selectedChapter.star2Progress.isUnlocked
              ? 'opacity-60 bg-slate-50/40 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-800'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
          }"
        >
          <span class="text-base leading-none">⭐⭐</span>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-extrabold {selectedChapter.star2Progress.isAchieved ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}">
                Stern 2: Umkehraufgaben
              </span>
              {#if selectedChapter.star2Progress.isAchieved}
                <span class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded-md">
                  Erreicht ✓
                </span>
              {:else if selectedChapter.star2Progress.isUnlocked}
                <span class="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-1.5 py-0.2 rounded-md">
                  {selectedChapter.star2Progress.current} / {selectedChapter.star2Progress.total} gelernt ({selectedChapter.star2Progress.percent}%)
                  {#if selectedChapter.star2Progress.consolidated > 0}
                    · {selectedChapter.star2Progress.consolidated} gefestigt
                  {/if}
                </span>
              {:else}
                <span class="text-[10px] font-bold text-slate-400">Gesperrt 🔒 (erst Stern 1)</span>
              {/if}
            </div>

            {#if selectedChapter.star2Progress.isUnlocked}
              <div class="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-300 {selectedChapter.star2Progress.isAchieved ? 'bg-emerald-500' : 'bg-indigo-500'}"
                  style="width: {selectedChapter.star2Progress.percent}%"
                ></div>
              </div>
            {/if}

            <p class="text-[11px] text-slate-500 dark:text-slate-400 m-0 mt-1">
              {selectedChapter.star2Desc}
            </p>
          </div>
        </div>

        <!-- Stern 3 -->
        <div
          class="p-2.5 rounded-xl border flex items-start gap-2.5 {
            selectedChapter.star3Progress.isAchieved
              ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60'
              : !selectedChapter.star3Progress.isUnlocked
              ? 'opacity-60 bg-slate-50/40 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-800'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
          }"
        >
          <span class="text-base leading-none">⭐⭐⭐</span>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-extrabold {selectedChapter.star3Progress.isAchieved ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}">
                Stern 3: Lücken &amp; Meisterschaft
              </span>
              {#if selectedChapter.star3Progress.isAchieved}
                <span class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded-md">
                  Erreicht ✓
                </span>
              {:else if selectedChapter.star3Progress.isUnlocked}
                <span class="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-1.5 py-0.2 rounded-md">
                  {selectedChapter.star3Progress.current} / {selectedChapter.star3Progress.total} gelernt ({selectedChapter.star3Progress.percent}%)
                  {#if selectedChapter.star3Progress.consolidated > 0}
                    · {selectedChapter.star3Progress.consolidated} gefestigt
                  {/if}
                </span>
              {:else}
                <span class="text-[10px] font-bold text-slate-400">Gesperrt 🔒 (erst Stern 2)</span>
              {/if}
            </div>

            {#if selectedChapter.star3Progress.isUnlocked}
              <div class="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-300 {selectedChapter.star3Progress.isAchieved ? 'bg-emerald-500' : 'bg-indigo-500'}"
                  style="width: {selectedChapter.star3Progress.percent}%"
                ></div>
              </div>
            {/if}

            <p class="text-[11px] text-slate-500 dark:text-slate-400 m-0 mt-1">
              {selectedChapter.star3Desc}
            </p>
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <button
        type="button"
        onclick={() => {
          const ch = selectedChapter;
          selectedChapter = null;
          if (ch) onStartChapterSession(ch);
        }}
        class="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition btn-calm-primary cursor-pointer border-none"
      >
        <span>🚀</span>
        <span>Diese Rechenwelt jetzt üben</span>
      </button>
    </div>
  </div>
{/if}
