<script lang="ts">
  import { AVAILABLE_AVATARS } from '../../lib/storage';
  import type { GameMode, TypeFilter, UserProfile } from '../../lib/types';
  import { themeManager, type ThemeMode } from '../lib/theme.svelte';

  export interface ProfileBackup {
    profileId: string;
    profile: UserProfile;
    modeReset: GameMode | 'both';
    timestamp: number;
  }

  interface Props {
    profiles: UserProfile[];
    activeProfileId: string;
    gameMode: GameMode;
    typeFilter: TypeFilter;
    lastBackup?: ProfileBackup | null;
    onSelectProfile: (id: string) => void;
    onCreateProfile: (name: string, avatar: string) => void;
    onUpdateProfile: (id: string, name: string, avatar: string) => void;
    onDeleteProfile: (id: string) => void;
    onResetProfile: (id: string, targetMode: GameMode | 'both') => void;
    onRestoreBackup?: (id: string) => void;
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
    lastBackup = null,
    onSelectProfile,
    onCreateProfile,
    onUpdateProfile,
    onDeleteProfile,
    onResetProfile,
    onRestoreBackup,
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

  let confirmResetId = $state<string | null>(null);
  let confirmDeleteId = $state<string | null>(null);

  function handleAddProfile(event: SubmitEvent) {
    event.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreateProfile(trimmed, selectedAvatar);
    newName = '';
    const nextIdx = (profiles.length + 1) % AVAILABLE_AVATARS.length;
    selectedAvatar = AVAILABLE_AVATARS[nextIdx];
  }

  function openNameEditor(profile: UserProfile) {
    editingNameProfileId = profile.id;
    editNameInput = profile.name;
    editAvatarInput = profile.avatar;
    editingStreakProfileId = null;
    confirmResetId = null;
    confirmDeleteId = null;
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
    confirmResetId = null;
    confirmDeleteId = null;
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
  aria-label="Optionen & Nutzer"
>
  <div class="w-full max-w-md bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl max-h-[90dvh] overflow-y-auto custom-scroll text-slate-800 dark:text-slate-100">
    <!-- Header -->
    <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
      <div>
        <h3 class="text-base font-black m-0 text-slate-900 dark:text-white">Optionen &amp; Nutzer</h3>
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
      <div class="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-300/50 dark:border-slate-800 text-xs">
        <button
          type="button"
          onclick={() => themeManager.setMode('system')}
          class="py-1.5 px-2 rounded-lg font-bold text-center border-none cursor-pointer transition flex items-center justify-center gap-1.5"
          class:bg-white={themeManager.mode === 'system'}
          class:dark:bg-slate-800={themeManager.mode === 'system'}
          class:text-slate-900={themeManager.mode === 'system'}
          class:dark:text-white={themeManager.mode === 'system'}
          class:shadow-xs={themeManager.mode === 'system'}
          class:text-slate-500={themeManager.mode !== 'system'}
          class:dark:text-slate-400={themeManager.mode !== 'system'}
        >
          <span>💻</span> <span>System</span>
        </button>
        <button
          type="button"
          onclick={() => themeManager.setMode('light')}
          class="py-1.5 px-2 rounded-lg font-bold text-center border-none cursor-pointer transition flex items-center justify-center gap-1.5"
          class:bg-white={themeManager.mode === 'light'}
          class:dark:bg-slate-800={themeManager.mode === 'light'}
          class:text-slate-900={themeManager.mode === 'light'}
          class:dark:text-white={themeManager.mode === 'light'}
          class:shadow-xs={themeManager.mode === 'light'}
          class:text-slate-500={themeManager.mode !== 'light'}
          class:dark:text-slate-400={themeManager.mode !== 'light'}
        >
          <span>☀️</span> <span>Hell</span>
        </button>
        <button
          type="button"
          onclick={() => themeManager.setMode('dark')}
          class="py-1.5 px-2 rounded-lg font-bold text-center border-none cursor-pointer transition flex items-center justify-center gap-1.5"
          class:bg-white={themeManager.mode === 'dark'}
          class:dark:bg-slate-800={themeManager.mode === 'dark'}
          class:text-slate-900={themeManager.mode === 'dark'}
          class:dark:text-white={themeManager.mode === 'dark'}
          class:shadow-xs={themeManager.mode === 'dark'}
          class:text-slate-500={themeManager.mode !== 'dark'}
          class:dark:text-slate-400={themeManager.mode !== 'dark'}
        >
          <span>🌙</span> <span>Dunkel</span>
        </button>
      </div>
      <p class="text-[10px] text-slate-400 mt-2 m-0">
        Orientiert sich automatisch am Dark/Light Mode deines Smartphones oder Computers.
      </p>
    </section>

    <!-- 2. DIDAKTIK-STUFE: RECHENDETAILS -->
    <section class="mb-4 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
      <span class="text-xs font-black text-slate-700 dark:text-slate-200 block mb-1">
        ⭐ Aufgabenumfang für Trainings &amp; Missionen:
      </span>
      <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
        Legt fest, ob in Trainingsrunden nur die Grundrechenart oder auch Umkehrungen erscheinen:
      </p>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <button
          type="button"
          onclick={() => onSetTypeFilter('mult_only')}
          class="p-2.5 rounded-xl border text-left cursor-pointer transition {
            typeFilter === 'mult_only'
              ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40'
          }"
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
          class="p-2.5 rounded-xl border text-left cursor-pointer transition {
            typeFilter === 'all_types'
              ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40'
          }"
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

    <!-- 3. NUTZERVERWALTUNG -->
    <section class="space-y-3 mb-4">
      <span class="text-xs font-black text-slate-700 dark:text-slate-200 block">
        👥 Nutzerprofile ({profiles.length}):
      </span>

      {#each profiles as prof (prof.id)}
        {@const isActive = prof.id === activeProfileId}
        {@const profMode = prof.activeGameMode ?? 'mult'}
        {@const profStats = profMode === 'plusminus' ? prof.plusMinusStats : prof.stats}
        <div
          class="p-3 rounded-2xl border transition {
            isActive
              ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
          }"
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

          <!-- Aktionsleiste: Name, Rechenmodus-Dropdown, Streak, Reset, Delete -->
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

            {#if lastBackup && lastBackup.profileId === prof.id}
              <button
                type="button"
                onclick={() => {
                  onRestoreBackup?.(prof.id);
                  confirmResetId = null;
                }}
                class="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] border-none cursor-pointer ml-auto flex items-center gap-1 transition shadow-xs"
                title="Zuletzt zurückgesetzten Stand wiederherstellen"
              >
                <span>🔄</span> <span>Wiederherstellen</span>
              </button>
            {:else}
              <button
                type="button"
                onclick={() => (confirmResetId = confirmResetId === prof.id ? null : prof.id)}
                class="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-400 cursor-pointer ml-auto transition"
                title="Lernstand zurücksetzen"
              >
                ↺ Zurücksetzen
              </button>
            {/if}
            {#if profiles.length > 1}
              <button
                type="button"
                onclick={() => (confirmDeleteId = confirmDeleteId === prof.id ? null : prof.id)}
                class="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900 text-[11px] font-bold text-rose-600 dark:text-rose-400 cursor-pointer transition"
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
                    class="p-1 rounded-lg text-lg border cursor-pointer {
                      editAvatarInput === av
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60'
                        : 'border-transparent bg-slate-100 dark:bg-slate-800'
                    }"
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
              <label class="block text-[11px] text-slate-500 dark:text-slate-400" for="streak-val-{prof.id}">
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
                  class="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs border-none cursor-pointer"
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

          <!-- Bestätigung: Lernstand zurücksetzen mit Modus-Auswahl & Wiederherstellen -->
          {#if confirmResetId === prof.id}
            <div class="mt-2.5 p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs space-y-2">
              <span class="block font-bold text-amber-950 dark:text-amber-200">
                Welchen Lernstand von <strong>{prof.name}</strong> möchtest du zurücksetzen?
              </span>
              <div class="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  class="py-2 px-2 rounded-lg bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-extrabold text-[11px] border-none cursor-pointer text-center transition"
                  onclick={() => {
                    onResetProfile(prof.id, 'mult');
                    confirmResetId = null;
                  }}
                >
                  Nur ✖️ 1×1 Meister
                </button>
                <button
                  type="button"
                  class="py-2 px-2 rounded-lg bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-extrabold text-[11px] border-none cursor-pointer text-center transition"
                  onclick={() => {
                    onResetProfile(prof.id, 'plusminus');
                    confirmResetId = null;
                  }}
                >
                  Nur ➕ Zahlenheld
                </button>
                <button
                  type="button"
                  class="col-span-2 py-2 px-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-black text-[11px] border-none cursor-pointer text-center transition"
                  onclick={() => {
                    onResetProfile(prof.id, 'both');
                    confirmResetId = null;
                  }}
                >
                  ⚠️ Beide Modi komplett zurücksetzen
                </button>
              </div>

              {#if lastBackup && lastBackup.profileId === prof.id && onRestoreBackup}
                <div class="pt-1.5 border-t border-amber-200 dark:border-amber-900/60">
                  <button
                    type="button"
                    class="w-full py-2 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] border-none cursor-pointer flex items-center justify-center gap-1.5 transition"
                    onclick={() => {
                      onRestoreBackup(prof.id);
                      confirmResetId = null;
                    }}
                  >
                    <span>🔄</span> <span>Letzten Stand wiederherstellen</span>
                  </button>
                </div>
              {/if}

              <div class="pt-1 text-right">
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border-none cursor-pointer"
                  onclick={() => (confirmResetId = null)}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          {/if}

          <!-- Bestätigung: Profil löschen -->
          {#if confirmDeleteId === prof.id}
            <div class="mt-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-xs space-y-2">
              <span class="block font-bold text-rose-950 dark:text-rose-200">
                Nutzerprofil <strong>{prof.name}</strong> wirklich komplett löschen?
              </span>
              <div class="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  class="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs border-none cursor-pointer"
                  onclick={() => {
                    onDeleteProfile(prof.id);
                    confirmDeleteId = null;
                  }}
                >
                  Ja, Profil löschen
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border-none cursor-pointer"
                  onclick={() => (confirmDeleteId = null)}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/each}

      <!-- Neuen Spieler hinzufügen mit direkter Icon-Auswahl -->
      <form
        onsubmit={handleAddProfile}
        class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-xs space-y-2.5"
      >
        <span class="font-extrabold text-slate-700 dark:text-slate-200 block text-xs">
          ➕ Weiteren Nutzer anlegen:
        </span>

        <!-- Direkte Avatar-Auswahl -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Tier-Icon auswählen:
            </span>
            <span class="text-xl">{selectedAvatar}</span>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            {#each AVAILABLE_AVATARS as av (av)}
              <button
                type="button"
                onclick={() => (selectedAvatar = av)}
                class="w-8 h-8 rounded-lg text-lg border cursor-pointer flex items-center justify-center transition {
                  selectedAvatar === av
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/70 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80'
                }"
              >
                {av}
              </button>
            {/each}
          </div>
        </div>

        <div class="flex items-center gap-2 pt-1">
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
            class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-extrabold border-none cursor-pointer transition shadow-xs"
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
