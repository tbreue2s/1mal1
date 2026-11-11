<script lang="ts">
  import { countDueCards } from '../../lib/storage';
  import type { GameMode, TaskCard, UserProfile, UserStats } from '../../lib/types';
  import { getWorldChapters, type WorldChapter } from '../lib/chapters';

  interface Props {
    gameMode: GameMode;
    cards: TaskCard[];
    stats: UserStats;
    activeProfile: UserProfile;
    soundEnabled: boolean;
    onToggleSound: () => void;
    onStartSession: () => void;
    onStartRowSession: (row: number) => void;
    onStartCustomSession: (cards: TaskCard[]) => void;
    onStartChapterSession: (chapter: WorldChapter) => void;
    onOpenMatrix: () => void;
    onOpenUsers: () => void;
  }

  let {
    gameMode,
    cards,
    stats,
    activeProfile,
    soundEnabled,
    onToggleSound,
    onStartSession,
    onStartRowSession,
    onStartCustomSession,
    onStartChapterSession,
    onOpenMatrix,
    onOpenUsers,
  }: Props = $props();

  const allRows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  let chapters = $derived(getWorldChapters(cards, gameMode));
  let dueCount = $derived(countDueCards(cards, stats.typeFilter, gameMode));

  // Lücken-Drawer Zustand
  let drawerRow = $state<number | null>(null);
  let highlightedPair = $state<'doubles' | null>(null);

  function getRowMasteredPercent(row: number): number {
    const rowCards = cards.filter((c) => c.row === row);
    if (rowCards.length === 0) return 0;
    const mastered = rowCards.filter(
      (c) =>
        (c.repetitions >= 2 && (c.lastQuality ?? 0) >= 3) ||
        (c.repetitions >= 1 && c.lastQuality === 4)
    ).length;
    return Math.round((mastered / rowCards.length) * 100);
  }

  // Findet die 3 schwächsten Karten einer Reihe für den Drawer
  let drawerCards = $derived.by(() => {
    if (drawerRow === null) return [];
    return cards
      .filter((c) => c.row === drawerRow)
      .sort((a, b) => {
        // Zuerst Karten mit Wiederholungsbedarf
        if (a.repetitions === 0 && b.repetitions > 0) return -1;
        if (b.repetitions === 0 && a.repetitions > 0) return 1;
        if ((a.lastQuality ?? 3) !== (b.lastQuality ?? 3)) {
          return (a.lastQuality ?? 3) - (b.lastQuality ?? 3);
        }
        return a.easeFactor - b.easeFactor;
      })
      .slice(0, 3);
  });

  function getHintForCard(card: TaskCard): string {
    const [a, b, c] = card.fact;
    if (gameMode === 'mult') {
      if (a === 6 && b === 7) return 'Tipp: 5 × 7 = 35, plus 7 = 42';
      if (a === 7 && b === 8) return 'Eselsbrücke: 5, 6, 7, 8 (56 = 7 × 8)';
      if (a === 8 && b === 9) return 'Zehner-Trick: 8 × 10 = 80, minus 8 = 72';
      if (a === b) return `Quadratzahl: ${a} × ${a} = ${c}`;
      return `Umkehraufgabe denken: ${c} : ${b} = ${a}`;
    }
    return `Zehner-Brücke nutzen: ${a} + ${b} = ${c}`;
  }

  function handleTriggerDoubles() {
    highlightedPair = highlightedPair === 'doubles' ? null : 'doubles';
  }

  function handleStartDrawerPractice() {
    if (drawerCards.length > 0) {
      onStartCustomSession(drawerCards);
      drawerRow = null;
    }
  }
</script>

<div class="w-full max-w-md mx-auto space-y-3.5 pb-8">
  <!-- 1. HEADER MIT STREAK, STERNE, QUICK SOUND & PROFIL -->
  <header class="flex items-center justify-between bg-white dark:bg-[#111827] rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-xs">
    <button
      type="button"
      class="flex items-center gap-2.5 text-left bg-transparent border-none p-0 cursor-pointer"
      onclick={onOpenUsers}
      title="Spieler wechseln oder verwalten"
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
        </div>
        <span class="text-[11px] font-medium text-slate-400 dark:text-slate-400">
          Zahlen-Held · Profil anpassen
        </span>
      </div>
    </button>

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
      {stats.sessionSize} gemischte Trainings-Karten
    </h2>
    <p class="text-xs text-slate-300 mt-0.5">
      {gameMode === 'mult'
        ? 'Festigt 1×1-Aufgaben im Langzeitgedächtnis vor dem Vergessen.'
        : 'Schult Verliebte Zahlen & Zehnerübergänge spielerisch im Kopf.'}
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
          ⭐ Mal · ⭐⭐ Geteilt · ⭐⭐⭐ Lücken
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
          class="card-press text-left p-2.5 rounded-xl border transition cursor-pointer"
          class:bg-indigo-50_50={ch.stars < 3 && ch.stars > 0}
          class:dark:bg-indigo-950_30={ch.stars < 3 && ch.stars > 0}
          class:border-indigo-400_80={ch.stars < 3 && ch.stars > 0}
          class:bg-slate-50={ch.stars === 3 || ch.stars === 0}
          class:dark:bg-slate-800_40={ch.stars === 3 || ch.stars === 0}
          class:border-slate-200={ch.stars === 3 || ch.stars === 0}
          class:dark:border-slate-700_60={ch.stars === 3 || ch.stars === 0}
          onclick={() => onStartChapterSession(ch)}
        >
          <div class="flex items-center justify-between text-xs">
            <span>{ch.icon}</span>
            <span
              class="text-[9px] font-black px-1 rounded"
              class:text-emerald-600={ch.percent >= 90}
              class:dark:text-emerald-400={ch.percent >= 90}
              class:text-indigo-600={ch.percent < 90 && ch.percent > 40}
              class:text-amber-600={ch.percent <= 40}
            >
              {ch.percent}%
            </span>
          </div>

          <div class="font-extrabold text-[11px] text-slate-900 dark:text-slate-100 mt-1 truncate">
            {ch.title}
          </div>
          <div class="text-[9px] text-slate-400 truncate">
            {ch.subtitle}
          </div>

          <div class="text-[10px] text-amber-500 mt-1">
            {#if ch.stars === 3}
              ⭐⭐⭐
            {:else if ch.stars === 2}
              ⭐⭐<span class="text-slate-300 dark:text-slate-600">⚪</span>
            {:else if ch.stars === 1}
              ⭐<span class="text-slate-300 dark:text-slate-600">⚪⚪</span>
            {:else}
              <span class="text-slate-300 dark:text-slate-600">⚪⚪⚪</span>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  </section>

  <!-- 4. REIHEN-STATUS MIT LÜCKENFINDER & DRAWER -->
  <section class="bg-white dark:bg-[#111827] rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs" aria-label="Reihen-Status">
    <div class="flex items-center justify-between mb-2">
      <div>
        <h3 class="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 m-0">
          <span>🎯</span> <span>Reihen-Status</span>
        </h3>
        <span class="text-[10px] text-slate-400">
          Tippe auf eine Reihe für Lücken-Details
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          onclick={handleTriggerDoubles}
          class="text-[10px] font-bold text-indigo-500 hover:underline bg-transparent border-none p-0 cursor-pointer"
          title="Verdopplungsreihen hervorheben"
        >
          💡 Verdoppeln (2⇄4⇄8)
        </button>
        <button
          type="button"
          onclick={onOpenMatrix}
          class="text-[10px] font-bold text-slate-400 hover:text-indigo-500 bg-transparent border-none p-0 cursor-pointer"
        >
          10×10 Tafel →
        </button>
      </div>
    </div>

    <div class="grid grid-cols-5 gap-1.5">
      {#each allRows as r (r)}
        {@const pct = getRowMasteredPercent(r)}
        {@const isDouble = [2, 4, 8].includes(r) && highlightedPair === 'doubles'}
        {@const isWeak = pct > 0 && pct < 60}
        <button
          type="button"
          class="card-press p-2 rounded-xl text-center border transition cursor-pointer"
          class:bg-rose-50_60={isWeak}
          class:dark:bg-rose-950_20={isWeak}
          class:border-rose-300={isWeak}
          class:dark:border-rose-800_60={isWeak}
          class:ring-1={isWeak || isDouble}
          class:ring-rose-400_40={isWeak}
          class:ring-indigo-400={isDouble}
          class:bg-slate-50={!isWeak}
          class:dark:bg-slate-800_40={!isWeak}
          class:border-slate-200={!isWeak}
          class:dark:border-slate-800={!isWeak}
          onclick={() => (drawerRow = r)}
        >
          <span
            class="text-xs font-bold"
            class:text-rose-700={isWeak}
            class:dark:text-rose-300={isWeak}
            class:text-slate-800={!isWeak}
            class:dark:text-slate-200={!isWeak}
          >
            {gameMode === 'mult' ? `${r}er` : `+${r}`}
          </span>
          <span
            class="block text-[9px] font-semibold"
            class:text-rose-600={isWeak}
            class:dark:text-rose-400={isWeak}
            class:text-emerald-500={pct >= 90}
            class:text-slate-400={pct < 90 && !isWeak}
          >
            {pct}% {isWeak ? '⚠️' : ''}
          </span>
        </button>
      {/each}
    </div>
  </section>

  <!-- 5. FOOTER LINKS -->
  <footer class="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-1 px-2 font-medium">
    <button
      type="button"
      onclick={onOpenUsers}
      class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 bg-transparent border-none p-0 cursor-pointer text-xs"
    >
      <span>⚙️</span> <span>Optionen &amp; Spieler</span>
    </button>
    <span class="text-[10px]">App v2.0 (Dezent &amp; Ruhig)</span>
  </footer>
</div>

<!-- 6. LÜCKEN-DRAWER (BOTTOM SHEET) -->
{#if drawerRow !== null}
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center p-2"
    onclick={(e) => {
      if (e.target === e.currentTarget) drawerRow = null;
    }}
    onkeydown={(e) => {
      if (e.key === 'Escape') drawerRow = null;
    }}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-label="Lücken in Reihe {drawerRow}"
  >
    <div class="w-full max-w-md bg-white dark:bg-[#111827] border-t-2 border-x-2 border-slate-200 dark:border-slate-700 rounded-3xl p-4 shadow-2xl animate-slide-up">
      <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm border border-indigo-200 dark:border-indigo-900">
            {drawerRow}
          </span>
          <div>
            <h4 class="text-sm font-extrabold text-slate-900 dark:text-white m-0">
              {gameMode === 'mult' ? `${drawerRow}er-Reihe Details` : `+${drawerRow} Aufgaben Details`}
            </h4>
            <p class="text-[11px] text-slate-400 m-0">
              Gemeistert: {getRowMasteredPercent(drawerRow)}% · Schwächste Karten
            </p>
          </div>
        </div>
        <button
          type="button"
          onclick={() => (drawerRow = null)}
          class="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold border-none cursor-pointer flex items-center justify-center"
        >
          ✕
        </button>
      </div>

      <div class="space-y-1.5 mb-3 text-xs">
        {#each drawerCards as card (card.id)}
          <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span class="font-extrabold text-slate-900 dark:text-white">
                {card.prompt}
              </span>
              <span class="text-[10px] text-slate-400 block">
                {getHintForCard(card)}
              </span>
            </div>
            <span
              class="text-[11px] font-bold"
              class:text-rose-500={card.repetitions === 0}
              class:text-amber-500={card.repetitions > 0 && card.repetitions < 2}
              class:text-emerald-500={card.repetitions >= 2}
            >
              {card.repetitions === 0
                ? 'Wiederholen'
                : card.repetitions < 2
                  ? 'Am Lernen'
                  : 'Sicher ✓'}
            </span>
          </div>
        {/each}
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          onclick={handleStartDrawerPractice}
          class="flex-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition btn-calm-primary cursor-pointer border-none"
        >
          <span>⚡</span>
          <span>Nur diese Lücken üben (3 Min.)</span>
        </button>
        <button
          type="button"
          onclick={() => {
            const r = drawerRow;
            drawerRow = null;
            if (r !== null) onStartRowSession(r);
          }}
          class="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold border-none cursor-pointer"
        >
          Ganze Reihe
        </button>
      </div>
    </div>
  </div>
{/if}
