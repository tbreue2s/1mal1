<script lang="ts">
  import {
    AVAILABLE_AVATARS,
    downloadProfileBackup,
    parseAndValidateProfileJson,
  } from '../lib/storage';
  import type { GameMode, TypeFilter, UserProfile } from '../lib/types';
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
    isDevelop?: boolean;
    onSelectProfile: (id: string) => void;
    onCreateProfile: (name: string, avatar: string) => void;
    onUpdateProfile: (id: string, name: string, avatar: string) => void;
    onDeleteProfile: (id: string) => void;
    onResetProfile: (id: string, targetMode: GameMode | 'both') => void;
    onRestoreBackup?: (id: string) => void;
    onImportProfile?: (profile: UserProfile, overwriteId?: string) => void;
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
    isDevelop = false,
    onSelectProfile,
    onCreateProfile,
    onUpdateProfile,
    onDeleteProfile,
    onResetProfile,
    onRestoreBackup,
    onImportProfile,
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

  // Export / Import State
  let fileInputEl = $state<HTMLInputElement | null>(null);
  let importStatusMessage = $state<string | null>(null);
  let importStatusType = $state<'success' | 'error'>('success');
  let pendingImportProfile = $state<UserProfile | null>(null);

  let existingMatchProfile = $derived(
    pendingImportProfile
      ? profiles.find(
          (p) =>
            p.name.trim().toLowerCase() ===
            pendingImportProfile!.name.trim().toLowerCase()
        )
      : null
  );

  async function handleFileSelected(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = parseAndValidateProfileJson(text);
      if (!res.success || !res.profile) {
        importStatusType = 'error';
        importStatusMessage = res.error ?? 'Fehler beim Lesen der Datei.';
        pendingImportProfile = null;
      } else {
        pendingImportProfile = res.profile;
        importStatusMessage = null;
      }
    } catch {
      importStatusType = 'error';
      importStatusMessage = 'Datei konnte nicht gelesen werden.';
      pendingImportProfile = null;
    } finally {
      target.value = '';
    }
  }

  function confirmImportAsNew() {
    if (!pendingImportProfile) return;
    onImportProfile?.(pendingImportProfile);
    importStatusType = 'success';
    importStatusMessage = `Profil "${pendingImportProfile.name}" erfolgreich importiert!`;
    pendingImportProfile = null;
  }

  function confirmImportOverwrite() {
    if (!pendingImportProfile || !existingMatchProfile) return;
    onImportProfile?.(pendingImportProfile, existingMatchProfile.id);
    importStatusType = 'success';
    importStatusMessage = `Profil "${existingMatchProfile.name}" erfolgreich aktualisiert!`;
    pendingImportProfile = null;
  }

  function cancelPendingImport() {
    pendingImportProfile = null;
  }

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
  class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4"
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
  <div class="w-full max-w-md my-auto bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col text-slate-800 dark:text-slate-100 max-h-[92vh] max-h-[92dvh] overflow-hidden">
    <!-- Pinned Header (immer erreichbar, auch bei geöffneter Bildschirmtastatur) -->
    <div class="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#111827] shrink-0">
      <div>
        <h3 class="text-base font-black m-0 text-slate-900 dark:text-white">Optionen &amp; Nutzer</h3>
        <p class="text-[11px] text-slate-400 m-0">Darstellung, Didaktik &amp; Profile</p>
      </div>
      <button
        type="button"
        onclick={onClose}
        class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 text-sm font-black border-none cursor-pointer flex items-center justify-center transition shadow-2xs"
        title="Schließen & zum Hauptscreen zurückkehren"
        aria-label="Schließen"
      >
        ✕
      </button>
    </div>

    <!-- Scrollable Body -->
    <div class="p-5 overflow-y-auto space-y-4 custom-scroll flex-1">
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

            <!-- EXPORT-BUTTON FÜR DIESEN NUTZER (PRODUKTIV FÜR ALLE) -->
            <button
              type="button"
              onclick={() => downloadProfileBackup(prof)}
              class="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 cursor-pointer flex items-center gap-1 transition shadow-2xs"
              title="Profil '{prof.name}' als Datei exportieren (Backup)"
            >
              <span>💾</span> <span>Export</span>
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

          <!-- Inline Name-Editor (Optimiert für Tablets: Buttons immer sichtbar, Enter-Taste speichert) -->
          {#if editingNameProfileId === prof.id}
            <form
              onsubmit={(e) => {
                e.preventDefault();
                saveProfileEdit(prof.id);
              }}
              class="mt-2.5 p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border-2 border-indigo-500 text-xs space-y-2.5 animate-slide-up"
            >
              <div class="flex items-center justify-between">
                <span class="font-black text-indigo-950 dark:text-indigo-200 text-xs">
                  ✏️ Name &amp; Tier-Icon anpassen:
                </span>
                <span class="text-2xl">{editAvatarInput}</span>
              </div>

              <!-- Eingabezeile mit direkt sichtbaren Buttons -->
              <div class="flex items-center gap-1.5">
                <input
                  type="text"
                  maxlength="20"
                  bind:value={editNameInput}
                  class="flex-1 p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs"
                  placeholder="Name des Kindes"
                />
                <button
                  type="submit"
                  disabled={!editNameInput.trim()}
                  class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black text-xs border-none cursor-pointer transition shadow-xs whitespace-nowrap"
                >
                  ✓ Speichern
                </button>
                <button
                  type="button"
                  onclick={() => (editingNameProfileId = null)}
                  class="px-2.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs border-none cursor-pointer transition"
                  title="Abbrechen"
                >
                  ✕
                </button>
              </div>

              <!-- Tier-Icon Auswahl direkt darunter -->
              <div class="space-y-1 pt-1.5 border-t border-indigo-200/50 dark:border-indigo-900/50">
                <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                  Anderes Tier-Icon wählen:
                </span>
                <div class="flex items-center gap-1.5 flex-wrap">
                  {#each AVAILABLE_AVATARS as av (av)}
                    <button
                      type="button"
                      onclick={() => (editAvatarInput = av)}
                      class="w-7 h-7 rounded-lg text-base border cursor-pointer flex items-center justify-center transition {
                        editAvatarInput === av
                          ? 'border-indigo-500 bg-indigo-100 dark:bg-indigo-900/80 shadow-2xs scale-105'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }"
                    >
                      {av}
                    </button>
                  {/each}
                </div>
              </div>
            </form>
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

      <!-- EXPORT & IMPORT BEREICH (PRODUKTIV FÜR ALLE) -->
      <div class="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/50 text-xs space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="font-extrabold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5 text-xs">
            <span>💾</span> <span>Profil sichern &amp; übertragen</span>
          </span>
          <span class="text-[9px] font-black bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-1.5 py-0.5 rounded-full uppercase">
            Backup
          </span>
        </div>
        <p class="text-[11px] text-slate-600 dark:text-slate-400 m-0">
          Exportiere ein Profil (per Klick auf 💾 Export beim Profil) als Datei oder spiele ein gesichertes Profil auf einem neuen Gerät ein.
        </p>

        <div class="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onclick={() => fileInputEl?.click()}
            class="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
          >
            <span>📥</span> <span>Profil-Datei importieren (.json / .txt)…</span>
          </button>
          <input
            type="file"
            accept=".json,.txt,application/json,text/plain"
            bind:this={fileInputEl}
            onchange={handleFileSelected}
            class="hidden"
          />
        </div>

        {#if importStatusMessage}
          <div
            class="p-2.5 rounded-xl text-xs font-bold transition flex items-start justify-between gap-2 {
              importStatusType === 'success'
                ? 'bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                : 'bg-rose-100/80 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
            }"
          >
            <span>{importStatusMessage}</span>
            <button
              type="button"
              onclick={() => (importStatusMessage = null)}
              class="text-xs bg-transparent border-none cursor-pointer opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        {/if}

        {#if pendingImportProfile}
          <div class="p-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-indigo-500 space-y-2 animate-slide-up">
            <div class="flex items-center gap-2">
              <span class="text-2xl">{pendingImportProfile.avatar}</span>
              <div>
                <div class="font-black text-slate-900 dark:text-white">
                  {pendingImportProfile.name}
                </div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400">
                  ⭐ {pendingImportProfile.stats.stars + pendingImportProfile.plusMinusStats.stars} Sterne · 🔥 {Math.max(pendingImportProfile.stats.streakDays, pendingImportProfile.plusMinusStats.streakDays)} Tage Streak
                </div>
              </div>
            </div>

            <p class="text-[11px] text-slate-600 dark:text-slate-300 m-0">
              Gültiges Profil gefunden. Wie möchtest du es einbinden?
            </p>

            <div class="flex items-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onclick={confirmImportAsNew}
                class="flex-1 py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs border-none cursor-pointer transition shadow-2xs"
              >
                ➕ Als neues Profil
              </button>

              {#if existingMatchProfile}
                <button
                  type="button"
                  onclick={confirmImportOverwrite}
                  class="py-1.5 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs border-none cursor-pointer transition shadow-2xs"
                  title="Bestehendes Profil mit identischem Namen überschreiben"
                >
                  ⚠️ '{existingMatchProfile.name}' ersetzen
                </button>
              {/if}

              <button
                type="button"
                onclick={cancelPendingImport}
                class="py-1.5 px-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border-none cursor-pointer"
              >
                Abbrechen
              </button>
            </div>
          </div>
        {/if}
      </div>

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
  </div>

  <!-- Pinned Footer (immer erreichbar) -->
  <div class="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] shrink-0 space-y-1.5">
    <button
      type="button"
      onclick={onClose}
      class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs border-none cursor-pointer transition shadow-sm"
    >
      Fertig &amp; Schließen
    </button>

    <div class="text-center pt-0.5 space-y-0.5">
      {#if isDevelop}
        <div>
          <a
            href="../"
            class="text-[11px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium hover:underline inline-block"
          >
            ‹ Zurück zur Produktiv-Version
          </a>
        </div>
      {/if}
      <div>
        <a
          href={isDevelop ? "../v1/" : "./v1/"}
          class="text-[11px] text-slate-400 hover:text-slate-500 dark:text-slate-500 font-medium hover:underline inline-block"
        >
          Zur klassischen Version (v1) wechseln ›
        </a>
      </div>
    </div>
  </div>
</div>
</div>
