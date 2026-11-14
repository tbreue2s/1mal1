<script lang="ts">
  import { importProfilesFromV2 } from '../lib/migration';
  import {
    AVAILABLE_AVATARS,
    createNewProfileV3,
  } from '../lib/storage';
  import type { UserProfileV3 } from '../lib/types';

  interface Props {
    profiles: UserProfileV3[];
    activeProfileId: string;
    onSelectProfile: (id: string) => void;
    onCreateProfile: (name: string, avatar: string) => void;
    onUpdateProfile: (id: string, name: string, avatar: string) => void;
    onDeleteProfile: (id: string) => void;
    onImportSuccess: (imported: UserProfileV3[]) => void;
    onClose: () => void;
  }

  let {
    profiles,
    activeProfileId,
    onSelectProfile,
    onCreateProfile,
    onUpdateProfile,
    onDeleteProfile,
    onImportSuccess,
    onClose,
  }: Props = $props();

  let newName = $state('');
  let selectedAvatar = $state(AVAILABLE_AVATARS[0]);

  let editingProfileId = $state<string | null>(null);
  let editNameInput = $state('');
  let editAvatarInput = $state(AVAILABLE_AVATARS[0]);

  let importMessage = $state<string | null>(null);
  let importSuccess = $state(false);

  function handleCreate() {
    if (!newName.trim()) return;
    onCreateProfile(newName.trim(), selectedAvatar);
    newName = '';
  }

  function startEdit(prof: UserProfileV3) {
    editingProfileId = prof.id;
    editNameInput = prof.name;
    editAvatarInput = prof.avatar;
  }

  function saveEdit() {
    if (editingProfileId && editNameInput.trim()) {
      onUpdateProfile(editingProfileId, editNameInput.trim(), editAvatarInput);
      editingProfileId = null;
    }
  }

  function handleImportV2() {
    const res = importProfilesFromV2();
    importMessage = res.message;
    importSuccess = res.success;
    if (res.success && res.profiles.length > 0) {
      onImportSuccess(res.profiles);
    }
  }
</script>

<div
  class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in"
  onclick={(e) => {
    if (e.target === e.currentTarget) onClose();
  }}
  onkeydown={(e) => {
    if (e.key === 'Escape') onClose();
  }}
  tabindex="-1"
  role="dialog"
  aria-modal="true"
  aria-label="Optionen und Benutzerverwaltung"
>
  <div class="w-full max-w-md bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
      <div>
        <h3 class="text-base font-extrabold text-slate-900 dark:text-white m-0">
          Optionen &amp; Spieler
        </h3>
        <p class="text-xs text-slate-400 m-0">
          Profile verwalten &amp; Daten synchronisieren
        </p>
      </div>
      <button
        type="button"
        onclick={onClose}
        class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 text-xs font-bold border-none cursor-pointer flex items-center justify-center"
      >
        ✕
      </button>
    </div>

    <!-- 1. SPIELER-LISTE -->
    <div class="space-y-2">
      <span class="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
        Aktive Spieler
      </span>

      {#each profiles as prof (prof.id)}
        {@const isCurrent = prof.id === activeProfileId}
        <div class="flex items-center justify-between p-3 rounded-2xl border transition {
          isCurrent
            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800'
            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
        }">
          <button
            type="button"
            onclick={() => onSelectProfile(prof.id)}
            class="flex items-center gap-3 text-left bg-transparent border-none cursor-pointer flex-1 min-w-0"
          >
            <span class="text-2xl shrink-0">{prof.avatar}</span>
            <div class="truncate">
              <div class="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                <span>{prof.name}</span>
                {#if isCurrent}
                  <span class="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-1.5 rounded">
                    Aktiv
                  </span>
                {/if}
              </div>
              <div class="text-[10px] text-slate-400 font-semibold">
                ⭐ {prof.multStats.stars + prof.plusMinusStats.stars} Sterne · 🔥 {prof.activeGameMode === 'mult' ? prof.multStats.streakDays : prof.plusMinusStats.streakDays} Tage
              </div>
            </div>
          </button>

          <div class="flex items-center gap-1">
            <button
              type="button"
              onclick={() => startEdit(prof)}
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs"
              title="Profil bearbeiten"
            >
              ✏️
            </button>
            {#if profiles.length > 1}
              <button
                type="button"
                onclick={() => onDeleteProfile(prof.id)}
                class="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 text-xs"
                title="Profil löschen"
              >
                🗑️
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- 2. EDITING MODAL / FORM -->
    {#if editingProfileId}
      <div class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
        <span class="text-xs font-bold text-slate-800 dark:text-slate-200 block">Profil bearbeiten</span>
        <input
          type="text"
          bind:value={editNameInput}
          class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
          placeholder="Name"
        />
        <div class="flex gap-1.5 overflow-x-auto py-1">
          {#each AVAILABLE_AVATARS as av}
            <button
              type="button"
              onclick={() => (editAvatarInput = av)}
              class="p-1.5 text-lg rounded-xl border {editAvatarInput === av ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950' : 'border-transparent'}"
            >
              {av}
            </button>
          {/each}
        </div>
        <div class="flex gap-2 pt-1">
          <button
            type="button"
            onclick={() => (editingProfileId = null)}
            class="flex-1 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onclick={saveEdit}
            class="flex-1 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            Speichern
          </button>
        </div>
      </div>
    {/if}

    <!-- 3. NEUEN SPIELER ANLEGEN -->
    <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
      <span class="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">Neuen Spieler anlegen</span>
      <div class="flex gap-2">
        <input
          type="text"
          bind:value={newName}
          placeholder="Name des Kindes"
          class="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold"
        />
        <button
          type="button"
          onclick={handleCreate}
          disabled={!newName.trim()}
          class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-extrabold border-none cursor-pointer"
        >
          Anlegen
        </button>
      </div>
    </div>

    <!-- 4. V2-DATEN IMPORTIEREN (NON-DESTRUCTIVE) -->
    <div class="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40 space-y-2">
      <div class="flex items-center gap-2">
        <span class="text-lg">🔄</span>
        <div>
          <span class="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 block">
            Daten aus Version 2 importieren
          </span>
          <span class="text-[10px] text-slate-500 dark:text-slate-400">
            Überträgt Sterne, Streaks &amp; Lernstände verlustfrei nach v3. Version 2 bleibt zu 100% unverändert.
          </span>
        </div>
      </div>

      {#if importMessage}
        <div class="p-2 rounded-xl text-xs font-bold {importSuccess ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800'}">
          {importMessage}
        </div>
      {/if}

      <button
        type="button"
        onclick={handleImportV2}
        class="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold border-none cursor-pointer transition shadow-xs"
      >
        Stand aus Version 2 jetzt importieren
      </button>
    </div>
  </div>
</div>
