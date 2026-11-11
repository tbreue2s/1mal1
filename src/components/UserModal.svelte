<script lang="ts">
  import { onMount } from 'svelte';
  import { LOGO_OPTIONS } from '../lib/logos';
  import { subscribePWAInstallable, triggerPWAInstall } from '../lib/pwa';
  import { getMatrixCellStatus } from '../lib/sm2';
  import { AVAILABLE_AVATARS } from '../lib/storage';
  import type { GameMode, LogoVariantId, TaskCard, UserProfile } from '../lib/types';
  import BrandLogo from './BrandLogo.svelte';

  interface Props {
    profiles: UserProfile[];
    activeProfileId: string;
    logoVariant: LogoVariantId;
    onSelectProfile: (id: string) => void;
    onCreateProfile: (name: string, avatar: string) => void;
    onUpdateProfile: (id: string, name: string, avatar: string) => void;
    onDeleteProfile: (id: string) => void;
    onResetProfile: (id: string, targetMode: GameMode | 'both') => void;
    onSetManualStreak: (id: string, streakDays: number, targetMode: GameMode) => void;
    onSetGameMode: (id: string, mode: GameMode) => void;
    onSelectLogo: (variant: LogoVariantId) => void;
    onClose: () => void;
  }

  let {
    profiles,
    activeProfileId,
    logoVariant,
    onSelectProfile,
    onCreateProfile,
    onUpdateProfile,
    onDeleteProfile,
    onResetProfile,
    onSetManualStreak,
    onSetGameMode,
    onSelectLogo,
    onClose,
  }: Props = $props();

  let newName = $state('');
  let selectedAvatar = $state(AVAILABLE_AVATARS[0]);

  // Zustand für Name/Avatar bearbeiten, manuelles Streak-Bearbeiten, Zurücksetzen & Löschen pro Profil
  let editingNameProfileId = $state<string | null>(null);
  let editNameInput = $state('');
  let editAvatarInput = $state(AVAILABLE_AVATARS[0]);
  let editingStreakProfileId = $state<string | null>(null);
  let editingStreakMode = $state<GameMode>('mult');
  let manualStreakInput = $state<string>('0');
  let confirmResetId = $state<string | null>(null);
  let confirmDeleteId = $state<string | null>(null);
  let canInstallPWA = $state(false);
  let logoChangedNotice = $state(false);

  const logoOptions = LOGO_OPTIONS;

  onMount(() => {
    const unsub = subscribePWAInstallable((installable) => {
      canInstallPWA = installable;
    });
    return () => unsub();
  });

  function handleSelectLogoOption(id: LogoVariantId) {
    if (id !== logoVariant) {
      logoChangedNotice = true;
    }
    onSelectLogo(id);
  }

  function countMasteredForPool(pool: TaskCard[]): number {
    let mastered = 0;
    for (let a = 1; a <= 10; a++) {
      for (let b = 1; b <= 10; b++) {
        const cellCards = pool.filter(
          (c) => c.fact[0] === a && c.fact[1] === b
        );
        if (getMatrixCellStatus(cellCards) === 'mastered') {
          mastered++;
        }
      }
    }
    return mastered;
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
    editingStreakMode = mode;
    const targetStats = mode === 'plusminus' ? profile.plusMinusStats : profile.stats;
    manualStreakInput = String(targetStats.streakDays);
    editingNameProfileId = null;
    confirmResetId = null;
    confirmDeleteId = null;
  }

  function switchStreakEditorMode(profile: UserProfile, mode: GameMode) {
    editingStreakMode = mode;
    const targetStats = mode === 'plusminus' ? profile.plusMinusStats : profile.stats;
    manualStreakInput = String(targetStats.streakDays);
  }

  function handleModeChange(profile: UserProfile, nextMode: GameMode) {
    onSetGameMode(profile.id, nextMode);
    if (editingStreakProfileId === profile.id) {
      editingStreakMode = nextMode;
      const targetStats = nextMode === 'plusminus' ? profile.plusMinusStats : profile.stats;
      manualStreakInput = String(targetStats.streakDays);
    }
  }

  function saveStreak(profileId: string) {
    const parsed = Number.parseInt(manualStreakInput, 10);
    const safeVal = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    onSetManualStreak(profileId, safeVal, editingStreakMode);
    editingStreakProfileId = null;
  }
</script>

<section class="user-modal-view" aria-label="Benutzerprofile und Einstellungen">
  <div class="header-card">
    <div class="header-top">
      <div>
        <h2>Benutzer & Profile</h2>
        <p class="subtitle">
          Jedes Profil speichert Lernstand, Sterne und Streak separat lokal auf diesem Gerät.
        </p>
      </div>
      <button type="button" class="back-btn" onclick={onClose}>
        ← Zurück
      </button>
    </div>
  </div>

  <!-- Vorhandene Benutzerprofile -->
  <div class="section-card">
    <h3 class="card-heading">Spieler auswählen oder verwalten</h3>

    <div class="profiles-list">
      {#each profiles as prof (prof.id)}
        {@const isActive = prof.id === activeProfileId}
        {@const masteredMult = countMasteredForPool(prof.cards)}
        {@const masteredPm = countMasteredForPool(prof.plusMinusCards)}
        <div class="profile-item" class:active={isActive}>
          <div class="profile-main-row">
            <button
              type="button"
              class="profile-select-btn"
              onclick={() => onSelectProfile(prof.id)}
              title="Zu {prof.name} wechseln"
            >
              <span class="prof-avatar">{prof.avatar}</span>
              <span class="prof-info">
                <span class="prof-name-row">
                  <span class="prof-name">{prof.name}</span>
                  {#if isActive}
                    <span class="active-badge">Aktiv</span>
                  {/if}
                </span>
                <span class="prof-stats">
                  ✖️ 1×1: 🔥 {prof.stats.streakDays} · ⭐ {prof.stats.stars} · ✅ {masteredMult}/100
                </span>
                <span class="prof-stats">
                  ➕ Zahlenheld: 🔥 {prof.plusMinusStats.streakDays} · ⭐ {prof.plusMinusStats.stars} · ✅ {masteredPm}/100
                </span>
              </span>
            </button>

            <div class="profile-actions">
              <button
                type="button"
                class="small-action-btn edit-name-btn"
                onclick={() =>
                  editingNameProfileId === prof.id
                    ? (editingNameProfileId = null)
                    : openNameEditor(prof)}
                title="Spielername oder Figur ändern"
              >
                ✏️ Name
              </button>

              <div class="mode-select-wrap">
                <select
                  id="mode-select-{prof.id}"
                  class="small-action-select mode-select"
                  class:is-pm={prof.activeGameMode === 'plusminus'}
                  value={prof.activeGameMode ?? 'mult'}
                  onchange={(e) =>
                    handleModeChange(prof, e.currentTarget.value as GameMode)}
                  title="Rechenmodus für {prof.name} festlegen"
                  aria-label="Rechenmodus für {prof.name}"
                >
                  <option value="mult">✖️ 1×1 Meister</option>
                  <option value="plusminus">➕ Zahlenheld</option>
                </select>
              </div>

              <button
                type="button"
                class="small-action-btn streak-edit-btn"
                onclick={() =>
                  editingStreakProfileId === prof.id
                    ? (editingStreakProfileId = null)
                    : openStreakEditor(prof)}
                title="Streak manuell eingeben / wiederherstellen"
              >
                🔥 Streak ändern
              </button>

              <button
                type="button"
                class="small-action-btn reset-btn"
                onclick={() => {
                  confirmResetId = confirmResetId === prof.id ? null : prof.id;
                  confirmDeleteId = null;
                  editingStreakProfileId = null;
                  editingNameProfileId = null;
                }}
                title="Lernstand für {prof.name} zurücksetzen"
              >
                🔄 Reset
              </button>

              <button
                type="button"
                class="small-action-btn delete-btn"
                onclick={() => {
                  confirmDeleteId = confirmDeleteId === prof.id ? null : prof.id;
                  confirmResetId = null;
                  editingStreakProfileId = null;
                  editingNameProfileId = null;
                }}
                title="Profil {prof.name} löschen"
              >
                🗑️
              </button>
            </div>
          </div>

          <!-- Spielername & Figur bearbeiten -->
          {#if editingNameProfileId === prof.id}
            <div class="inline-panel edit-profile-panel">
              <label class="streak-label" for="name-edit-input-{prof.id}">
                ✏️ Name &amp; Figur für <strong>{prof.name}</strong> anpassen:
              </label>
              <input
                id="name-edit-input-{prof.id}"
                type="text"
                maxlength="24"
                class="name-input"
                bind:value={editNameInput}
              />
              <div class="avatar-grid" role="group" aria-label="Neue Figur wählen">
                {#each AVAILABLE_AVATARS as av (av)}
                  <button
                    type="button"
                    class="avatar-choice"
                    class:selected={editAvatarInput === av}
                    onclick={() => (editAvatarInput = av)}
                    aria-label="Figur {av}"
                  >
                    {av}
                  </button>
                {/each}
              </div>
              <div class="inline-btn-group">
                <button
                  type="button"
                  class="save-profile-btn"
                  disabled={editNameInput.trim().length === 0}
                  onclick={() => saveProfileEdit(prof.id)}
                >
                  Änderung speichern
                </button>
                <button
                  type="button"
                  class="cancel-inline-btn"
                  onclick={() => (editingNameProfileId = null)}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          {/if}

          <!-- Manuelle Streak-Eingabe -->
          {#if editingStreakProfileId === prof.id}
            <div class="inline-panel streak-panel">
              <span class="streak-label">
                🔥 Tages-Streak für <strong>{prof.name}</strong> manuell setzen (Wiederherstellung):
              </span>
              <div class="inline-btn-group">
                <button
                  type="button"
                  class="cancel-inline-btn"
                  style={editingStreakMode === 'mult' ? 'border-color: #4f46e5; background: #eef2ff; color: #312e81;' : ''}
                  onclick={() => switchStreakEditorMode(prof, 'mult')}
                >
                  ✖️ 1×1 Meister ({prof.stats.streakDays})
                </button>
                <button
                  type="button"
                  class="cancel-inline-btn"
                  style={editingStreakMode === 'plusminus' ? 'border-color: #0d9488; background: #f0fdfa; color: #115e59;' : ''}
                  onclick={() => switchStreakEditorMode(prof, 'plusminus')}
                >
                  ➕ Zahlenheld ({prof.plusMinusStats.streakDays})
                </button>
              </div>
              <div class="streak-input-row">
                <input
                  id="streak-input-{prof.id}"
                  type="number"
                  min="0"
                  max="9999"
                  class="streak-number-input"
                  bind:value={manualStreakInput}
                />
                <button
                  type="button"
                  class="save-inline-btn"
                  onclick={() => saveStreak(prof.id)}
                >
                  Streak speichern
                </button>
                <button
                  type="button"
                  class="cancel-inline-btn"
                  onclick={() => (editingStreakProfileId = null)}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          {/if}

          <!-- Bestätigung: Einzelnes Profil (oder einzelnen Modus) zurücksetzen -->
          {#if confirmResetId === prof.id}
            <div class="inline-panel warn-panel">
              <span>
                Welchen Lernstand von <strong>{prof.name}</strong> möchtest du zurücksetzen?
              </span>
              <div class="inline-btn-group">
                <button
                  type="button"
                  class="danger-confirm-btn"
                  onclick={() => {
                    onResetProfile(prof.id, 'mult');
                    confirmResetId = null;
                  }}
                >
                  Nur ✖️ 1×1 Meister
                </button>
                <button
                  type="button"
                  class="danger-confirm-btn"
                  onclick={() => {
                    onResetProfile(prof.id, 'plusminus');
                    confirmResetId = null;
                  }}
                >
                  Nur ➕ Zahlenheld
                </button>
                <button
                  type="button"
                  class="danger-confirm-btn"
                  onclick={() => {
                    onResetProfile(prof.id, 'both');
                    confirmResetId = null;
                  }}
                >
                  Beide Modi
                </button>
                <button
                  type="button"
                  class="cancel-inline-btn"
                  onclick={() => (confirmResetId = null)}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          {/if}

          <!-- Bestätigung: Einzelnes Profil löschen -->
          {#if confirmDeleteId === prof.id}
            <div class="inline-panel warn-panel">
              <span>
                Benutzerprofil <strong>{prof.name}</strong> wirklich komplett löschen?
              </span>
              <div class="inline-btn-group">
                <button
                  type="button"
                  class="danger-confirm-btn"
                  onclick={() => {
                    onDeleteProfile(prof.id);
                    confirmDeleteId = null;
                  }}
                >
                  Ja, Profil löschen
                </button>
                <button
                  type="button"
                  class="cancel-inline-btn"
                  onclick={() => (confirmDeleteId = null)}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <!-- Neuen Benutzer anlegen -->
  <div class="section-card">
    <h3 class="card-heading">Neuen Benutzer anlegen</h3>
    <form class="create-form" onsubmit={handleAddProfile}>
      <div class="form-row">
        <label class="field-label" for="new-user-name">Name des Spielers:</label>
        <input
          id="new-user-name"
          type="text"
          maxlength="24"
          placeholder="z. B. Mia, Leon, Max ..."
          class="name-input"
          bind:value={newName}
          required
        />
      </div>

      <div class="form-row">
        <span class="field-label">Figur / Avatar wählen:</span>
        <div class="avatar-grid" role="group" aria-label="Avatar auswählen">
          {#each AVAILABLE_AVATARS as av (av)}
            <button
              type="button"
              class="avatar-choice"
              class:selected={selectedAvatar === av}
              onclick={() => (selectedAvatar = av)}
              aria-label="Avatar {av}"
            >
              {av}
            </button>
          {/each}
        </div>
      </div>

      <button
        type="submit"
        class="create-submit-btn"
        disabled={newName.trim().length === 0}
      >
        + Benutzer anlegen
      </button>
    </form>
  </div>

  <!-- Logo-Auswahl für App & Startbildschirm -->
  <div class="section-card">
    <h3 class="card-heading">App- &amp; Startbildschirm-Logo wählen</h3>
    <p class="subtitle" style="margin-bottom: 10px;">
      Wähle dein Lieblings-Klassentier! Es erscheint sofort oben in der App und wird auch als Icon genutzt, wenn du die App <strong>als App installierst / zum Startbildschirm hinzufügst</strong>:
    </p>
    <div class="logo-proposals-grid">
      {#each logoOptions as opt (opt.id)}
        <button
          type="button"
          class="logo-option-card"
          class:selected={logoVariant === opt.id}
          onclick={() => handleSelectLogoOption(opt.id)}
        >
          <BrandLogo variant={opt.id} size={54} />
          <div class="logo-opt-text">
            <span class="logo-opt-title">{opt.title}</span>
            <span class="logo-opt-sub">{opt.subtitle}</span>
          </div>
        </button>
      {/each}
    </div>

    {#if logoChangedNotice}
      <div class="inline-panel edit-profile-panel" style="margin-top: 12px;">
        <span>
          💡 <strong>Tipp für Android App-Installation:</strong> Lade die Seite einmal kurz neu, bevor du im Chrome-Menü auf <em>„App installieren“</em> tippst – dann übernimmt Android garantiert dieses neue Tier-Icon ohne Chrome-Zeichen!
        </span>
        <div class="inline-btn-group">
          <button
            type="button"
            class="save-profile-btn"
            onclick={() => window.location.reload()}
          >
            🔄 Seite jetzt kurz neu laden
          </button>
        </div>
      </div>
    {/if}

    {#if canInstallPWA}
      <div style="margin-top: 12px;">
        <button
          type="button"
          class="create-submit-btn"
          style="width: 100%; background: #059669;"
          onclick={() => triggerPWAInstall()}
        >
          📲 Jetzt als echte App installieren
        </button>
      </div>
    {/if}
  </div>
</section>

<style>
  .user-modal-view {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-bottom: 24px;
  }

  .header-card,
  .section-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 16px;
    border: 2px solid #e0e7ff;
    box-shadow: 0 4px 16px rgba(79, 70, 229, 0.06);
  }

  .header-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  h2 {
    margin: 0;
    font-size: 1.3rem;
    color: #1e1b4b;
  }

  .card-heading {
    margin: 0 0 12px;
    font-size: 1rem;
    font-weight: 800;
    color: #312e81;
  }

  .subtitle {
    margin: 4px 0 0;
    font-size: 0.84rem;
    color: #64748b;
  }

  .back-btn {
    background: #eef2ff;
    color: #4338ca;
    border: 2px solid #c7d2fe;
    border-radius: 12px;
    padding: 8px 14px;
    font-weight: 800;
    font-size: 0.9rem;
    cursor: pointer;
    white-space: nowrap;
    font-family: inherit;
  }

  .profiles-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .profile-item {
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    padding: 10px 12px;
    background: #f8fafc;
    transition: all 0.15s ease;
  }

  .profile-item.active {
    border-color: #4f46e5;
    background: #eef2ff;
  }

  .profile-main-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  .profile-select-btn {
    flex: 1;
    min-width: 180px;
    display: flex;
    align-items: center;
    gap: 10px;
    background: transparent;
    border: none;
    padding: 2px 0;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
  }

  .prof-avatar {
    font-size: 1.85rem;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #ffffff;
    border: 1.5px solid #cbd5e1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .prof-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .prof-name-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .prof-name {
    font-size: 1rem;
    font-weight: 900;
    color: #1e1b4b;
  }

  .active-badge {
    background: #4f46e5;
    color: #ffffff;
    font-size: 0.68rem;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 999px;
    text-transform: uppercase;
  }

  .prof-stats {
    font-size: 0.78rem;
    font-weight: 700;
    color: #475569;
  }

  .profile-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .small-action-btn {
    border: 1.5px solid #cbd5e1;
    background: #ffffff;
    color: #334155;
    border-radius: 10px;
    padding: 6px 9px;
    font-size: 0.76rem;
    font-weight: 800;
    cursor: pointer;
    font-family: inherit;
  }

  .mode-select-wrap {
    display: inline-flex;
    align-items: center;
  }

  .small-action-select {
    border: 1.5px solid #c7d2fe;
    background-color: #eef2ff;
    color: #3730a3;
    border-radius: 10px;
    padding: 6px 24px 6px 9px;
    font-size: 0.76rem;
    font-weight: 800;
    cursor: pointer;
    font-family: inherit;
    appearance: none;
    -webkit-appearance: none;
    line-height: 1.2;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%233730a3' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 7px center;
    transition: all 0.15s ease;
  }

  .small-action-select:hover {
    filter: brightness(0.97);
  }

  .small-action-select:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
  }

  .small-action-select.is-pm {
    border-color: #99f6e4;
    background-color: #f0fdfa;
    color: #0f766e;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%230f766e' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  }

  .edit-name-btn {
    background: #eef2ff;
    border-color: #c7d2fe;
    color: #3730a3;
  }

  .streak-edit-btn {
    background: #ffedd5;
    border-color: #fed7aa;
    color: #9a3412;
  }

  .reset-btn:hover {
    background: #fef3c7;
    border-color: #fde68a;
  }

  .delete-btn:hover {
    background: #fee2e2;
    border-color: #fecaca;
  }

  .inline-panel {
    margin-top: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    font-size: 0.84rem;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .edit-profile-panel {
    background: #f5f7ff;
    border: 1.5px solid #a5b4fc;
    color: #1e1b4b;
  }

  .save-profile-btn {
    background: #4f46e5;
    color: #ffffff;
    border: none;
    border-radius: 10px;
    padding: 8px 12px;
    font-weight: 800;
    font-size: 0.82rem;
    cursor: pointer;
    font-family: inherit;
  }

  .save-profile-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .streak-panel {
    background: #fff7ed;
    border: 1.5px solid #fdba74;
    color: #7c2d12;
  }

  .warn-panel {
    background: #fef2f2;
    border: 1.5px solid #fca5a5;
    color: #991b1b;
    font-weight: 700;
  }

  .streak-label {
    font-size: 0.82rem;
  }

  .streak-input-row,
  .inline-btn-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .streak-number-input {
    width: 90px;
    padding: 7px 10px;
    border-radius: 10px;
    border: 2px solid #fb923c;
    font-size: 0.95rem;
    font-weight: 800;
    font-family: inherit;
  }

  .save-inline-btn {
    background: #ea580c;
    color: #ffffff;
    border: none;
    border-radius: 10px;
    padding: 8px 12px;
    font-weight: 800;
    font-size: 0.82rem;
    cursor: pointer;
    font-family: inherit;
  }

  .danger-confirm-btn {
    background: #dc2626;
    color: #ffffff;
    border: none;
    border-radius: 10px;
    padding: 7px 12px;
    font-weight: 800;
    font-size: 0.82rem;
    cursor: pointer;
    font-family: inherit;
  }

  .cancel-inline-btn {
    background: #ffffff;
    color: #334155;
    border: 1.5px solid #cbd5e1;
    border-radius: 10px;
    padding: 7px 12px;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    font-family: inherit;
  }

  .create-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .form-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field-label {
    font-size: 0.84rem;
    font-weight: 800;
    color: #334155;
  }

  .name-input {
    padding: 10px 12px;
    border-radius: 12px;
    border: 2px solid #cbd5e1;
    font-size: 0.98rem;
    font-weight: 700;
    font-family: inherit;
    color: #1e1b4b;
  }

  .name-input:focus {
    outline: none;
    border-color: #4f46e5;
  }

  .avatar-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
  }

  .avatar-choice {
    min-height: 44px;
    border-radius: 12px;
    border: 2px solid #e2e8f0;
    background: #f8fafc;
    font-size: 1.4rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.12s ease;
  }

  .avatar-choice.selected {
    border-color: #4f46e5;
    background: #eef2ff;
    transform: scale(1.06);
  }

  .create-submit-btn {
    min-height: 48px;
    border: none;
    border-radius: 14px;
    background: #4f46e5;
    color: #ffffff;
    font-family: inherit;
    font-size: 0.96rem;
    font-weight: 800;
    cursor: pointer;
  }

  .create-submit-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .logo-proposals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 10px;
  }

  .logo-option-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 14px;
    border: 2px solid #e2e8f0;
    background: #f8fafc;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: all 0.12s ease;
  }

  .logo-option-card.selected {
    border-color: #4f46e5;
    background: #eef2ff;
    box-shadow: 0 3px 10px rgba(79, 70, 229, 0.14);
  }

  .logo-opt-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .logo-opt-title {
    font-size: 0.86rem;
    font-weight: 800;
    color: #1e1b4b;
  }

  .logo-opt-sub {
    font-size: 0.74rem;
    color: #64748b;
  }
</style>

