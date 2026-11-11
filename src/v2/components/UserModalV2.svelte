<script lang="ts">
  import { AVAILABLE_AVATARS } from '../../lib/storage';
  import type { GameMode, TypeFilter, UserProfile } from '../../lib/types';
  import { themeManager, type ThemeMode } from '../lib/theme.svelte';

  interface Props {
    profiles: UserProfile[];
    activeProfileId: string;
    gameMode: GameMode;
    typeFilter: TypeFilter;
    onSelectProfile: (id: string) => void;
    onCreateProfile: (name: string, avatar: string) => void;
    onUpdateProfile: (id: string, name: string, avatar: string) => void;
    onDeleteProfile: (id: string) => void;
    onResetProfile: (id: string, targetMode: GameMode | 'both') => void;
    onSetManualStreak: (id: string, streakDays: number, targetMode: GameMode) => void;
    onSetGameMode: (id: string, mode: GameMode) => void;
    onSetTypeFilter: (filter: TypeFilter) => void;
    onClose: () => void;
  }

  let {
    profiles,
    activeProfileId,
    gameMode,
    typeFilter,
    onSelectProfile,
    onCreateProfile,
    onUpdateProfile,
    onDeleteProfile,
    onResetProfile,
    onSetManualStreak,
    onSetGameMode,
    onSetTypeFilter,
    onClose,
  }: Props = $props();

  let newName = $state('');
  let selectedAvatar = $state(AVAILABLE_AVATARS[0]);

  let editingNameProfileId = $state<string | null>(null);
  let editNameInput = $state('');
  let editAvatarInput = $state(AVAILABLE_AVATARS[0]);

  let editingStreakProfileId = $state<string | null>(null);
  let manualStreakInput = $state('0');

  function handleAddProfile(event: SubmitEvent) {
    event.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreateProfile(trimmed, selectedAvatar);
    newName = '';
  }

  function openNameEditor(profile: UserProfile) {
    editingNameProfileId = profile.id;
    editNameInput = profile.name;
    editAvatarInput = profile.avatar;
    editingStreakProfileId = null;
  }

  function saveProfileEdit(profileId: string) {
    const trimmed = editNameInput.trim();
    if (!trimmed) return;
    onUpdateProfile(profileId, trimmed, editAvatarInput);
    editingNameProfileId = null;
  }

  function openStreakEditor(profile: UserProfile) {
    editingStreakProfileId = profile.id;
    const mode = profile.activeGameMode ?? 'mult';
    const targetStats = mode === 'plusminus' ? profile.plusMinusStats : profile.stats;
    manualStreakInput = String(targetStats.streakDays);
    editingNameProfileId = null;
  }

  function saveStreak(profileId: string) {
    const parsed = Number.parseInt(manualStreakInput, 10);
    const safeVal = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    const targetProf = profiles.find((p) => p.id === profileId);
    const mode = targetProf?.activeGameMode ?? 'mult';
    onSetManualStreak(profileId, safeVal, mode);
    editingStreakProfileId = null;
  }
</script>

<div
  class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-3"
  onclick={(e) => {
    if (e.target === e.currentTarget) onClose();
  }}
  onkeydown={(e) => {
    if (e.key === 'Escape') onClose();
  }}
  role="dialog"
  tabindex="-1"
  aria-modal="true"
  aria-label="Optionen & Benutzer"
>
  <div class="w-full max-w-md bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl max-h-[90dvh] overflow-y-auto custom-scroll text-slate-800 dark:text-slate-100">
    <!-- Header -->
    <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
      <div>
        <h3 class="text-base font-black m-0 text-slate-900 dark:text-white">Optionen &amp; Spieler</h3>
        <p class="text-[11px] text-slate-400 m-0">Darstellung, Didaktik &amp; Profile</p>
      </div>
      <button
        type="button"
        onclick={onClose}
        class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-bold border-none cursor-pointer flex items-center justify-center"
      >
        ✕
      </button>
    </div>

    <!-- 1. THEME SWITCHER (SYSTEM / HELL / DUNKEL) -->
    <section class="mb-4 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
      <span class="text-xs font-black text-slate-700 dark:text-slate-200 block mb-2">
        🎨 App-Erscheinungsbild:
      </span>
      <div class="grid grid-cols-3 gap-1.5 bg-slate-200/70 dark:bg-slate-950 p-1 rounded-xl">
        <button
          type="button"
          onclick={() => themeManager.setMode('system')}
          class="py-2 px-1 text-xs font-bold rounded-lg border-none cursor-pointer transition flex flex-col items-center gap-0.5"
          class:bg-white={themeManager.mode === 'system'}
          class:dark:bg-slate-800={themeManager.mode === 'system'}
          class:text-slate-900={themeManager.mode === 'system'}
          class:dark:text-white={themeManager.mode === 'system'}
          class:shadow-xs={themeManager.mode === 'system'}
          class:text-slate-500={themeManager.mode !== 'system'}
          class:dark:text-slate-400={themeManager.mode !== 'system'}
        >
          <span class="text-sm">💻</span>
          <span>System</span>
        </button>
        <button
          type="button"
          onclick={() => themeManager.setMode('light')}
          class="py-2 px-1 text-xs font-bold rounded-lg border-none cursor-pointer transition flex flex-col items-center gap-0.5"
          class:bg-white={themeManager.mode === 'light'}
          class:dark:bg-slate-800={themeManager.mode === 'light'}
          class:text-slate-900={themeManager.mode === 'light'}
          class:dark:text-white={themeManager.mode === 'light'}
          class:shadow-xs={themeManager.mode === 'light'}
          class:text-slate-500={themeManager.mode !== 'light'}
          class:dark:text-slate-400={themeManager.mode !== 'light'}
        >
          <span class="text-sm">☀️</span>
          <span>Hell</span>
        </button>
        <button
          type="button"
          onclick={() => themeManager.setMode('dark')}
          class="py-2 px-1 text-xs font-bold rounded-lg border-none cursor-pointer transition flex flex-col items-center gap-0.5"
          class:bg-white={themeManager.mode === 'dark'}
          class:dark:bg-slate-800={themeManager.mode === 'dark'}
          class:text-slate-900={themeManager.mode === 'dark'}
          class:dark:text-white={themeManager.mode === 'dark'}
          class:shadow-xs={themeManager.mode === 'dark'}
          class:text-slate-500={themeManager.mode !== 'dark'}
          class:dark:text-slate-400={themeManager.mode !== 'dark'}
        >
          <span class="text-sm">🌙</span>
          <span>Dunkel</span>
        </button>
      </div>
      <p class="text-[10px] text-slate-400 mt-2 m-0">
        „System“ folgt automatisch dem hellen/dunklen Modus deines Geräts.
      </p>
    </section>

    <!-- 2. DIDAKTISCHER OVERRIDE (AUFGABENTYPEN) -->
    <section class="mb-4 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
      <span class="text-xs font-black text-slate-700 dark:text-slate-200 block mb-1">
        🧩 Aufgabentypen (Manuell vorgeben):
      </span>
      <p class="text-[10px] text-slate-400 mb-2 m-0">
        Legt fest, ob in Trainingsrunden nur die Grundrechenart oder auch Umkehrungen erscheinen:
      </p>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <button
          type="button"
          onclick={() => onSetTypeFilter('mult_only')}
          class="p-2.5 rounded-xl border text-left cursor-pointer transition"
          class:border-indigo-500={typeFilter === 'mult_only'}
          class:bg-indigo-50_60={typeFilter === 'mult_only'}
          class:dark:bg-indigo-950_50={typeFilter === 'mult_only'}
          class:border-slate-200={typeFilter !== 'mult_only'}
          class:dark:border-slate-700={typeFilter !== 'mult_only'}
        >
          <span class="block font-black text-slate-900 dark:text-white">
            ⭐ {gameMode === 'mult' ? 'Nur Malnehmen' : 'Nur Plus'}
          </span>
          <span class="text-[10px] text-slate-400">
            {gameMode === 'mult' ? '3 × 4 = ?' : '7 + 5 = ?'}
          </span>
        </button>
        <button
          type="button"
          onclick={() => onSetTypeFilter('all_types')}
          class="p-2.5 rounded-xl border text-left cursor-pointer transition"
          class:border-indigo-500={typeFilter === 'all_types'}
          class:bg-indigo-50_60={typeFilter === 'all_types'}
          class:dark:bg-indigo-950_50={typeFilter === 'all_types'}
          class:border-slate-200={typeFilter !== 'all_types'}
          class:dark:border-slate-700={typeFilter !== 'all_types'}
        >
          <span class="block font-black text-slate-900 dark:text-white">
            ⭐⭐⭐ {gameMode === 'mult' ? 'Inkl. Geteilt & Lücken' : 'Inkl. Minus & Lücken'}
          </span>
          <span class="text-[10px] text-slate-400">
            {gameMode === 'mult' ? '12 : 4 = ? · 3 × ? = 12' : '12 − 5 = ? · 7 + ? = 12'}
          </span>
        </button>
      </div>
    </section>

    <!-- 3. SPIELERVERWALTUNG -->
    <section class="space-y-3 mb-4">
      <span class="text-xs font-black text-slate-700 dark:text-slate-200 block">
        👥 Spielerprofile ({profiles.length}):
      </span>

      {#each profiles as prof (prof.id)}
        {@const isActive = prof.id === activeProfileId}
        {@const profMode = prof.activeGameMode ?? 'mult'}
        {@const profStats = profMode === 'plusminus' ? prof.plusMinusStats : prof.stats}
        <div
          class="p-3 rounded-2xl border transition"
          class:border-indigo-500={isActive}
          class:bg-indigo-50_20={isActive}
          class:dark:bg-indigo-950_20={isActive}
          class:border-slate-200={!isActive}
          class:dark:border-slate-800={!isActive}
          class:bg-slate-50={!isActive}
          class:dark:bg-slate-800_40={!isActive}
        >
          <div class="flex items-center justify-between mb-2">
            <button
              type="button"
              onclick={() => onSelectProfile(prof.id)}
              class="flex items-center gap-2 bg-transparent border-none p-0 cursor-pointer text-left"
            >
              <span class="text-2xl">{prof.avatar}</span>
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="font-black text-sm text-slate-900 dark:text-white">
                    {prof.name}
                  </span>
                  {#if isActive}
                    <span class="text-[9px] font-black bg-indigo-600 text-white px-1.5 py-0.2 rounded-full uppercase">
                      Aktiv
                    </span>
                  {/if}
                </div>
                <div class="text-[10px] text-slate-400 font-semibold">
                  🔥 {profStats.streakDays} Tage · ⭐ {profStats.stars} Sterne
                </div>
              </div>
            </button>
          </div>

          <!-- Aktionsleiste: Name, Rechenmodus-Dropdown, Streak -->
          <div class="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onclick={() => openNameEditor(prof)}
              class="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              ✏️ Name
            </button>

            <!-- DROPDOWN FÜR RECHENMODUS -->
            <select
              value={prof.activeGameMode ?? 'mult'}
              onchange={(e) => onSetGameMode(prof.id, e.currentTarget.value as GameMode)}
              class="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-[11px] font-black text-indigo-700 dark:text-indigo-300 cursor-pointer"
              title="Rechenmodus festlegen"
            >
              <option value="mult">✖️ 1×1 Meister</option>
              <option value="plusminus">➕ Zahlenheld</option>
            </select>

            <button
              type="button"
              onclick={() => openStreakEditor(prof)}
              class="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] font-extrabold text-amber-800 dark:text-amber-300 cursor-pointer"
            >
              🔥 Streak
            </button>

            <button
              type="button"
              onclick={() => onResetProfile(prof.id, 'both')}
              class="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-500 cursor-pointer ml-auto"
              title="Lernstand zurücksetzen"
            >
              🔄
            </button>
            {#if profiles.length > 1}
              <button
                type="button"
                onclick={() => onDeleteProfile(prof.id)}
                class="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-[11px] font-bold text-rose-600 cursor-pointer"
                title="Profil löschen"
              >
                🗑️
              </button>
            {/if}
          </div>

          <!-- Inline Name-Editor -->
          {#if editingNameProfileId === prof.id}
            <div class="mt-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <input
                type="text"
                maxlength="20"
                bind:value={editNameInput}
                class="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                placeholder="Name"
              />
              <div class="flex items-center gap-1.5 flex-wrap">
                {#each AVAILABLE_AVATARS as av (av)}
                  <button
                    type="button"
                    onclick={() => (editAvatarInput = av)}
                    class="p-1 rounded-lg text-lg border cursor-pointer"
                    class:border-indigo-500={editAvatarInput === av}
                    class:bg-indigo-50={editAvatarInput === av}
                    class:border-transparent={editAvatarInput !== av}
                  >
                    {av}
                  </button>
                {/each}
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  onclick={() => saveProfileEdit(prof.id)}
                  class="flex-1 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs border-none cursor-pointer"
                >
                  Speichern
                </button>
                <button
                  type="button"
                  onclick={() => (editingNameProfileId = null)}
                  class="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border-none cursor-pointer"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          {/if}

          <!-- Inline Streak-Editor -->
          {#if editingStreakProfileId === prof.id}
            <div class="mt-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <label class="block text-[11px] text-slate-500" for="streak-val-{prof.id}">
                🔥 Tages-Streak manuell setzen:
              </label>
              <div class="flex items-center gap-2">
                <input
                  id="streak-val-{prof.id}"
                  type="number"
                  min="0"
                  max="9999"
                  bind:value={manualStreakInput}
                  class="w-24 p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-center"
                />
                <button
                  type="button"
                  onclick={() => saveStreak(prof.id)}
                  class="flex-1 py-1.5 rounded-lg bg-amber-500 text-white font-bold text-xs border-none cursor-pointer"
                >
                  Streak anpassen
                </button>
                <button
                  type="button"
                  onclick={() => (editingStreakProfileId = null)}
                  class="px-2 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border-none cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/each}

      <!-- Neuen Spieler hinzufügen -->
      <form
        onsubmit={handleAddProfile}
        class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-xs space-y-2"
      >
        <span class="font-extrabold text-slate-700 dark:text-slate-300 block">
          ➕ Weiteren Spieler anlegen:
        </span>
        <div class="flex items-center gap-2">
          <input
            type="text"
            maxlength="20"
            bind:value={newName}
            placeholder="Name des Kindes"
            class="flex-1 p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-extrabold border-none cursor-pointer"
          >
            Hinzufügen
          </button>
        </div>
      </form>
    </section>

    <button
      type="button"
      onclick={onClose}
      class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs border-none cursor-pointer transition shadow-sm"
    >
      Fertig &amp; Schließen
    </button>
  </div>
</div>
