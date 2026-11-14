<script lang="ts">
  import { parseProfilesFromJson } from '../lib/migration';
  import {
    AVAILABLE_AVATARS,
    createNewProfileV3,
    downloadProfileBackupV3,
    saveV3ProfilesAndActiveId,
  } from '../lib/storage';
  import { themeManager } from '../../lib/theme.svelte';
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

  interface PendingConflict {
    incoming: UserProfileV3;
    existing: UserProfileV3;
    remainingQueue: UserProfileV3[];
    processedMerged: UserProfileV3[];
  }

  let pendingConflict = $state<PendingConflict | null>(null);
  let fileInputEl: HTMLInputElement | null = $state(null);

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

  async function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = parseProfilesFromJson(text);
      if (!res.success || res.profiles.length === 0) {
        importMessage = res.message;
        importSuccess = false;
        return;
      }

      importMessage = null;
      processImportQueue(res.profiles, [...profiles]);
    } catch (err) {
      importMessage = `Fehler beim Lesen der Datei: ${err instanceof Error ? err.message : String(err)}`;
      importSuccess = false;
    } finally {
      target.value = '';
    }
  }

  function processImportQueue(
    queue: UserProfileV3[],
    currentMerged: UserProfileV3[]
  ) {
    if (queue.length === 0) {
      finishImport(currentMerged);
      return;
    }

    const [current, ...remaining] = queue;
    // Prüfung auf Namens- oder ID-Überschneidung
    const match = currentMerged.find(
      (p) =>
        p.id === current.id ||
        p.name.trim().toLowerCase() === current.name.trim().toLowerCase()
    );

    if (match) {
      // Konflikt: Benutzer explizit um Entscheidung bitten
      pendingConflict = {
        incoming: current,
        existing: match,
        remainingQueue: remaining,
        processedMerged: currentMerged,
      };
    } else {
      // Kein Konflikt: Sicher hinzufügen, andere Spieler bleiben unangetastet
      processImportQueue(remaining, [...currentMerged, current]);
    }
  }

  function handleConflictChoice(action: 'overwrite' | 'keep_both' | 'cancel') {
    if (!pendingConflict) return;
    const { incoming, existing, remainingQueue, processedMerged } =
      pendingConflict;
    pendingConflict = null;

    if (action === 'cancel') {
      importMessage = 'Import abgebrochen. Es wurden keine Änderungen vorgenommen.';
      importSuccess = false;
      return;
    }

    let nextMerged = [...processedMerged];
    if (action === 'overwrite') {
      // Bestehenden Spieler mit den Daten der Datei aktualisieren (andere Spieler bleiben unverändert)
      nextMerged = nextMerged.map((p) =>
        p.id === existing.id ? { ...incoming, id: existing.id } : p
      );
    } else if (action === 'keep_both') {
      // Als neues Profil mit Zusatznamen anlegen
      const copyProfile: UserProfileV3 = {
        ...incoming,
        id: `user_v3_copy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: `${incoming.name} (Import)`,
      };
      nextMerged.push(copyProfile);
    }

    processImportQueue(remainingQueue, nextMerged);
  }

  function finishImport(finalMerged: UserProfileV3[]) {
    const activeId = finalMerged[finalMerged.length - 1].id;
    saveV3ProfilesAndActiveId(finalMerged, activeId);
    onImportSuccess(finalMerged);
    importMessage = `Erfolgreich importiert! (${finalMerged.length} Spieler vorhanden). Andere Spieler wurden nicht gelöscht.`;
    importSuccess = true;
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

    <!-- ERSCHEINUNGSBILD / THEME SWITCHER -->
    <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
          Erscheinungsbild
        </span>
        <span class="text-[10px] text-slate-400">
          Design wählen
        </span>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <button
          type="button"
          onclick={() => themeManager.setMode('system')}
          class="py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer {
            themeManager.mode === 'system'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400'
          }"
        >
          <span class="text-base">💻</span>
          <span>System</span>
        </button>
        <button
          type="button"
          onclick={() => themeManager.setMode('light')}
          class="py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer {
            themeManager.mode === 'light'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400'
          }"
        >
          <span class="text-base">☀️</span>
          <span>Hell</span>
        </button>
        <button
          type="button"
          onclick={() => themeManager.setMode('dark')}
          class="py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer {
            themeManager.mode === 'dark'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400'
          }"
        >
          <span class="text-base">🌙</span>
          <span>Dunkel</span>
        </button>
      </div>
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
              onclick={() => downloadProfileBackupV3(prof)}
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs"
              title="Profil als Backup (.json) sichern"
            >
              💾
            </button>
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

    <!-- 4. BACKUP-DATEI IMPORTIEREN MIT SICHERHEITSABFRAGE -->
    <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
            Backup importieren
          </span>
          <span class="text-[10px] text-slate-400">
            Spieler hinzufügen (andere Profile bleiben sicher erhalten)
          </span>
        </div>
        <button
          type="button"
          onclick={() => fileInputEl?.click()}
          class="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold border border-slate-300 dark:border-slate-600 cursor-pointer transition shadow-2xs flex items-center gap-1.5"
        >
          <span>📁</span>
          <span>Datei wählen</span>
        </button>
      </div>

      <!-- KONFLIKT-DIALOG VOR DEM ÜBERSCHREIBEN -->
      {#if pendingConflict}
        <div class="p-3.5 bg-amber-50 dark:bg-amber-950/60 rounded-2xl border-2 border-amber-300 dark:border-amber-700 space-y-2.5 animate-fade-in">
          <div class="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <span class="text-lg">⚠️</span>
            <span class="text-xs font-extrabold">Spieler existiert bereits!</span>
          </div>
          <p class="text-xs text-amber-900 dark:text-amber-100 font-semibold m-0 leading-relaxed">
            Ein Spieler mit dem Namen <strong>„{pendingConflict.existing.name}“</strong> existiert bereits auf diesem Gerät. Was möchtest du tun?
          </p>
          <div class="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onclick={() => handleConflictChoice('overwrite')}
              class="flex-1 py-1.5 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold border-none cursor-pointer"
            >
              Überschreiben
            </button>
            <button
              type="button"
              onclick={() => handleConflictChoice('keep_both')}
              class="flex-1 py-1.5 px-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold border border-slate-300 dark:border-slate-600 cursor-pointer"
            >
              Als Kopie anlegen
            </button>
            <button
              type="button"
              onclick={() => handleConflictChoice('cancel')}
              class="py-1.5 px-2.5 rounded-xl bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 text-xs font-bold border-none cursor-pointer"
            >
              Abbrechen
            </button>
          </div>
        </div>
      {/if}

      {#if importMessage}
        <div class="p-2 rounded-xl text-xs font-bold {importSuccess ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800'}">
          {importMessage}
        </div>
      {/if}

      <input
        type="file"
        accept=".json,application/json"
        class="hidden"
        bind:this={fileInputEl}
        onchange={handleFileSelect}
      />
    </div>

    <!-- 5. WECHSEL ZU ANDEREN VERSIONEN -->
    <div class="text-center pt-1 border-t border-slate-100 dark:border-slate-800 space-y-1">
      <div>
        <a
          href={typeof window !== 'undefined' && window.location.pathname.includes('/v3') ? '../v2/' : './v2/'}
          class="text-[11px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-block"
        >
          ‹ Zur vorherigen Version (v2) wechseln
        </a>
      </div>
      <div>
        <a
          href={typeof window !== 'undefined' && window.location.pathname.includes('/v3') ? '../v1/' : './v1/'}
          class="text-[10px] text-slate-400 hover:text-slate-500 font-medium hover:underline inline-block"
        >
          Zur klassischen Version (v1) wechseln ›
        </a>
      </div>
    </div>
  </div>
</div>
