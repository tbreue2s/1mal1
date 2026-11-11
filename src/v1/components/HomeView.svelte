<script lang="ts">
  import { getMatrixCellStatus } from '../../lib/sm2';
  import { countDueCards } from '../../lib/storage';
  import type {
    GameMode,
    LearningMode,
    PlusMinusFocus,
    TaskCard,
    TypeFilter,
    UserStats,
  } from '../../lib/types';

  interface Props {
    gameMode: GameMode;
    cards: TaskCard[];
    stats: UserStats;
    onUpdateSettings: (partial: Partial<UserStats>) => void;
    onStartSession: () => void;
    onOpenMatrix: () => void;
  }

  let {
    gameMode,
    cards,
    stats,
    onUpdateSettings,
    onStartSession,
    onOpenMatrix,
  }: Props = $props();

  const allRows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  let dueCount = $derived(countDueCards(cards, stats.typeFilter, gameMode));

  let matrixSummary = $derived.by(() => {
    let mastered = 0;
    let learning = 0;
    let fresh = 0;

    for (let a = 1; a <= 10; a++) {
      for (let b = 1; b <= 10; b++) {
        const cellCards = cards.filter((c) => c.fact[0] === a && c.fact[1] === b);
        const st = getMatrixCellStatus(cellCards);
        if (st === 'mastered') mastered++;
        else if (st === 'learning') learning++;
        else fresh++;
      }
    }
    return { mastered, learning, fresh };
  });

  function setMode(mode: LearningMode) {
    onUpdateSettings({ learningMode: mode });
  }

  function setTypeFilter(typeFilter: TypeFilter) {
    onUpdateSettings({ typeFilter });
  }

  function setPlusMinusFocus(focus: PlusMinusFocus) {
    onUpdateSettings({ plusMinusFocus: focus, learningMode: 'rows' });
  }

  function toggleRow(row: number) {
    const current = stats.selectedRows;
    if (current.includes(row)) {
      if (current.length > 1) {
        onUpdateSettings({
          selectedRows: current.filter((r) => r !== row).sort((a, b) => a - b),
          plusMinusFocus: 'rows',
        });
      }
    } else {
      onUpdateSettings({
        selectedRows: [...current, row].sort((a, b) => a - b),
        plusMinusFocus: 'rows',
      });
    }
  }

  function selectPresetRows(rows: number[]) {
    onUpdateSettings({
      selectedRows: rows,
      learningMode: 'rows',
      plusMinusFocus: 'rows',
    });
  }

  function getRowMasteredPercent(row: number): number {
    let mastered = 0;
    for (let a = 1; a <= 10; a++) {
      const cellCards = cards.filter((c) => c.fact[0] === a && c.fact[1] === row);
      if (getMatrixCellStatus(cellCards) === 'mastered') {
        mastered++;
      }
    }
    return mastered * 10;
  }

  let focusBadgeText = $derived.by(() => {
    if (gameMode === 'mult') {
      return `${stats.selectedRows.length} gewählt`;
    }
    const f = stats.plusMinusFocus ?? 'up_to_10';
    if (f === 'number_bonds_10') return 'Verliebte Zahlen ❤️';
    if (f === 'up_to_10') return 'Bis 10';
    if (f === 'over_10') return 'Zehnerübergang';
    if (f === 'doubles') return 'Verdoppeln';
    return `${stats.selectedRows.length} Reihen`;
  });
</script>

<div class="home-view">
  <!-- Lern-Modus Auswahl -->
  <section class="card-section" aria-label="Lern-Modus wählen">
    <h2 class="section-title">1. Wähle deinen Lern-Modus</h2>

    <div class="mode-cards">
      <button
        type="button"
        class="mode-card"
        class:active={stats.learningMode === 'daily'}
        onclick={() => setMode('daily')}
      >
        <div class="mode-icon">🧠</div>
        <div class="mode-content">
          <div class="mode-title-row">
            <span class="mode-name">Tages-Training</span>
            <span class="badge-pill">Spaced Repetition</span>
          </div>
          <p class="mode-desc">
            {#if gameMode === 'mult'}
              Mischt schlaue 1×1-Wiederholungen mit neuen Aufgaben passend zu deinem Tempo.
            {:else}
              Startet mit Aufgaben bis 10 &amp; Verliebten Zahlen und steigert sich zum Zehnerübergang.
            {/if}
          </p>
          <div class="due-info">
            {#if dueCount > 0}
              <span class="due-badge due-active">🔔 {dueCount} Wiederholungen fällig</span>
            {:else}
              <span class="due-badge">✨ Bereit für neue Aufgaben</span>
            {/if}
          </div>
        </div>
      </button>

      <button
        type="button"
        class="mode-card"
        class:active={stats.learningMode === 'rows'}
        onclick={() => setMode('rows')}
      >
        <div class="mode-icon">🎯</div>
        <div class="mode-content">
          <div class="mode-title-row">
            <span class="mode-name">
              {gameMode === 'mult' ? 'Fokus-Reihen' : 'Fokus-Themen & Reihen'}
            </span>
            <span class="badge-pill">{focusBadgeText}</span>
          </div>
          <p class="mode-desc">
            {#if gameMode === 'mult'}
              Übe gezielt einzelne 1×1-Reihen (z.&nbsp;B. nur die 2er-, 5er- und 10er-Reihe).
            {:else}
              Übe gezielt Verliebte Zahlen ❤️, Aufgaben bis 10, Zehnerübergänge, Verdoppeln oder Plus-Reihen.
            {/if}
          </p>
        </div>
      </button>
    </div>

    {#if stats.learningMode === 'rows'}
      {#if gameMode === 'mult'}
        <div class="rows-selector-box">
          <div class="rows-header">
            <span class="rows-label">Welche 1×1-Reihen möchtest du üben?</span>
            <div class="preset-chips">
              <button
                type="button"
                class="chip-btn"
                onclick={() => selectPresetRows([2, 5, 10])}
              >
                2er, 5er, 10er
              </button>
              <button
                type="button"
                class="chip-btn"
                onclick={() => selectPresetRows([1, 2, 4, 5, 10])}
              >
                Kern-Reihen
              </button>
              <button
                type="button"
                class="chip-btn"
                onclick={() => selectPresetRows([6, 7, 8, 9])}
              >
                6er–9er
              </button>
              <button
                type="button"
                class="chip-btn"
                onclick={() => selectPresetRows([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])}
              >
                Alle
              </button>
            </div>
          </div>

          <div class="rows-grid" role="group" aria-label="1 mal 1 Reihen auswählen">
            {#each allRows as r (r)}
              {@const isSelected = stats.selectedRows.includes(r)}
              {@const pct = getRowMasteredPercent(r)}
              <button
                type="button"
                class="row-btn"
                class:selected={isSelected}
                onclick={() => toggleRow(r)}
                aria-pressed={isSelected}
              >
                <span class="row-num">{r}er</span>
                <span class="row-mini-bar">
                  <span class="row-mini-fill" style="width: {pct}%"></span>
                </span>
              </button>
            {/each}
          </div>
        </div>
      {:else}
        <!-- Zahlenheld: Didaktische Fokus-Bereiche (Verliebte Zahlen, Bis 10, Zehnerübergang, Verdoppeln, Reihen) -->
        {@const pmFocus = stats.plusMinusFocus ?? 'up_to_10'}
        <div class="rows-selector-box">
          <span class="rows-label">Wähle deinen Zahlenheld-Schwerpunkt:</span>

          <div class="pm-focus-grid">
            <button
              type="button"
              class="pm-focus-card pm-focus-wide"
              class:selected={pmFocus === 'number_bonds_10'}
              onclick={() => setPlusMinusFocus('number_bonds_10')}
            >
              <span class="pm-f-icon">❤️</span>
              <span class="pm-f-title">Verliebte Zahlen (Immer 10)</span>
              <span class="pm-f-sub">Partnerzahlen zur 10: 6 + 4 = 10 · 7 + ? = 10 · 10 − 3 = 7</span>
            </button>

            <button
              type="button"
              class="pm-focus-card"
              class:selected={pmFocus === 'up_to_10'}
              onclick={() => setPlusMinusFocus('up_to_10')}
            >
              <span class="pm-f-icon">🌱</span>
              <span class="pm-f-title">Bis 10 &amp; Zerlegungen</span>
              <span class="pm-f-sub">Zahlenraum bis 10 (z. B. 4 + 3 = 7)</span>
            </button>

            <button
              type="button"
              class="pm-focus-card"
              class:selected={pmFocus === 'over_10'}
              onclick={() => setPlusMinusFocus('over_10')}
            >
              <span class="pm-f-icon">🌉</span>
              <span class="pm-f-title">Zehnerübergang</span>
              <span class="pm-f-sub">Über die 10 (z. B. 7 + 5 = 12)</span>
            </button>

            <button
              type="button"
              class="pm-focus-card"
              class:selected={pmFocus === 'doubles'}
              onclick={() => setPlusMinusFocus('doubles')}
            >
              <span class="pm-f-icon">👯</span>
              <span class="pm-f-title">Verdoppeln &amp; Nachbarn</span>
              <span class="pm-f-sub">z. B. 6 + 6 = 12 · 6 + 7 = 13</span>
            </button>

            <button
              type="button"
              class="pm-focus-card"
              class:selected={pmFocus === 'rows'}
              onclick={() => setPlusMinusFocus('rows')}
            >
              <span class="pm-f-icon">🔢</span>
              <span class="pm-f-title">Plus-Reihen (+1 bis +10)</span>
              <span class="pm-f-sub">Gezielt einzelne Zahlen üben</span>
            </button>
          </div>

          {#if pmFocus === 'rows'}
            <div class="rows-header" style="margin-top: 10px;">
              <span class="rows-label">Welche Plus-/Minus-Reihen möchtest du üben?</span>
              <div class="preset-chips">
                <button
                  type="button"
                  class="chip-btn"
                  onclick={() => selectPresetRows([1, 2, 5, 10])}
                >
                  +1, +2, +5, +10
                </button>
                <button
                  type="button"
                  class="chip-btn"
                  onclick={() => selectPresetRows([6, 7, 8, 9])}
                >
                  +6 bis +9
                </button>
                <button
                  type="button"
                  class="chip-btn"
                  onclick={() => selectPresetRows([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])}
                >
                  Alle
                </button>
              </div>
            </div>

            <div class="rows-grid" role="group" aria-label="Plus-Reihen auswählen">
              {#each allRows as r (r)}
                {@const isSelected = stats.selectedRows.includes(r)}
                {@const pct = getRowMasteredPercent(r)}
                <button
                  type="button"
                  class="row-btn pm-row-btn"
                  class:selected={isSelected}
                  onclick={() => toggleRow(r)}
                  aria-pressed={isSelected}
                >
                  <span class="row-num">+{r}</span>
                  <span class="row-mini-bar">
                    <span class="row-mini-fill" style="width: {pct}%"></span>
                  </span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </section>

  <!-- Aufgabentyp-Filter -->
  <section class="card-section" aria-label="Aufgaben-Typ wählen">
    <h2 class="section-title">2. Aufgaben-Typ</h2>
    <div class="type-toggle-grid">
      <button
        type="button"
        class="type-btn"
        class:selected={stats.typeFilter === 'mult_only'}
        onclick={() => setTypeFilter('mult_only')}
      >
        <span class="type-emoji">{gameMode === 'mult' ? '✖️' : '➕'}</span>
        <span class="type-title">
          {gameMode === 'mult' ? 'Nur Malnehmen' : 'Nur Plusrechnen'}
        </span>
        <span class="type-example">
          {gameMode === 'mult' ? '3 × 4 = ?' : '7 + 5 = ?'}
        </span>
      </button>

      <button
        type="button"
        class="type-btn"
        class:selected={stats.typeFilter === 'all_types'}
        onclick={() => setTypeFilter('all_types')}
      >
        <span class="type-emoji">🧩</span>
        <span class="type-title">
          {gameMode === 'mult' ? 'Auch Geteilt & Lücken' : 'Auch Minus & Lücken'}
        </span>
        <span class="type-example">
          {gameMode === 'mult'
            ? '12 : 4 = ? · ? × 4 = 12'
            : '12 − 5 = ? · 7 + ? = 12'}
        </span>
      </button>
    </div>
  </section>

  <!-- Start Button -->
  <button
    type="button"
    class="start-cta-btn"
    class:cta-pm={gameMode === 'plusminus'}
    onclick={onStartSession}
  >
    <span class="cta-text">
      {gameMode === 'mult' ? '1×1-Training' : 'Zahlenheld-Runde'} starten ({stats.sessionSize} Aufgaben)
    </span>
    <span class="cta-rocket">🚀</span>
  </button>

  <!-- Fortschritt & Matrix Vorschau -->
  <section class="card-section matrix-preview-card" aria-label="Dein Lernfortschritt">
    <div class="preview-header">
      <div>
        <h2 class="section-title">
          {gameMode === 'mult' ? 'Deine 1×1-Matrix' : 'Deine 1+1-Tafel (bis 20)'}
        </h2>
        <p class="preview-sub">
          <strong>{matrixSummary.mastered}</strong> von 100 gemeistert ·
          <strong>{matrixSummary.learning}</strong> am Lernen
        </p>
      </div>
      <button type="button" class="open-matrix-btn" onclick={onOpenMatrix}>
        {gameMode === 'mult' ? '10×10 Tafel öffnen →' : '1+1 Tafel öffnen →'}
      </button>
    </div>

    <div class="mini-status-pills">
      <div class="status-box box-green">
        <span class="box-num">{matrixSummary.mastered}</span>
        <span class="box-label">Gemeistert</span>
      </div>
      <div class="status-box box-yellow">
        <span class="box-num">{matrixSummary.learning}</span>
        <span class="box-label">Am Lernen</span>
      </div>
      <div class="status-box box-gray">
        <span class="box-num">{matrixSummary.fresh}</span>
        <span class="box-label">Noch neu</span>
      </div>
    </div>
  </section>
</div>

<style>
  .home-view {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-bottom: 20px;
  }

  .card-section {
    background: #ffffff;
    border-radius: 22px;
    padding: 16px;
    border: 2px solid #e0e7ff;
    box-shadow: 0 4px 16px rgba(79, 70, 229, 0.06);
  }

  .section-title {
    margin: 0 0 10px;
    font-size: 1rem;
    font-weight: 800;
    color: #312e81;
  }

  .mode-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .mode-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    text-align: left;
    background: #f8fafc;
    border: 2.5px solid #e2e8f0;
    border-radius: 16px;
    padding: 12px 14px;
    cursor: pointer;
    font-family: inherit;
    transition: border-color 0.15s ease, background-color 0.15s ease, transform 0.1s ease;
  }

  .mode-card:hover {
    border-color: #a5b4fc;
  }

  .mode-card.active {
    background: #eef2ff;
    border-color: #4f46e5;
    box-shadow: 0 3px 12px rgba(79, 70, 229, 0.14);
  }

  .mode-icon {
    font-size: 1.8rem;
    line-height: 1;
    padding-top: 2px;
  }

  .mode-content {
    flex: 1;
  }

  .mode-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .mode-name {
    font-size: 1.05rem;
    font-weight: 800;
    color: #1e1b4b;
  }

  .badge-pill {
    font-size: 0.72rem;
    font-weight: 800;
    background: #e0e7ff;
    color: #4338ca;
    padding: 3px 9px;
    border-radius: 999px;
  }

  .mode-desc {
    margin: 4px 0 0;
    font-size: 0.84rem;
    color: #475569;
    line-height: 1.35;
  }

  .due-info {
    margin-top: 7px;
  }

  .due-badge {
    display: inline-block;
    font-size: 0.76rem;
    font-weight: 700;
    color: #047857;
    background: #ecfdf5;
    padding: 3px 9px;
    border-radius: 8px;
  }

  .due-badge.due-active {
    color: #b45309;
    background: #fef3c7;
  }

  .rows-selector-box {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1.5px dashed #c7d2fe;
  }

  .rows-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 10px;
  }

  .rows-label {
    font-size: 0.85rem;
    font-weight: 700;
    color: #334155;
    display: block;
    margin-bottom: 8px;
  }

  .pm-focus-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .pm-focus-wide {
    grid-column: 1 / -1;
  }

  .pm-focus-card {
    border-radius: 14px;
    border: 2px solid #cbd5e1;
    background: #f8fafc;
    padding: 10px;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    text-align: left;
    transition: all 0.12s ease;
  }

  .pm-focus-card:hover {
    border-color: #2dd4bf;
  }

  .pm-focus-card.selected {
    background: #f0fdfa;
    border-color: #0d9488;
    box-shadow: 0 3px 10px rgba(13, 148, 136, 0.16);
  }

  .pm-f-icon {
    font-size: 1.25rem;
  }

  .pm-f-title {
    font-size: 0.85rem;
    font-weight: 900;
    color: #134e4a;
  }

  .pm-f-sub {
    font-size: 0.72rem;
    font-weight: 700;
    color: #64748b;
  }

  .preset-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chip-btn {
    background: #f1f5f9;
    color: #334155;
    border: 1.5px solid #cbd5e1;
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.76rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }

  .chip-btn:hover {
    background: #e0e7ff;
    border-color: #818cf8;
    color: #312e81;
  }

  .rows-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
  }

  .row-btn {
    min-height: 56px;
    border-radius: 14px;
    border: 2px solid #cbd5e1;
    background: #f8fafc;
    color: #475569;
    font-family: inherit;
    font-weight: 800;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 6px;
    touch-action: manipulation;
    transition: all 0.12s ease;
  }

  .row-btn.selected {
    background: #4f46e5;
    border-color: #3730a3;
    color: #ffffff;
    box-shadow: 0 3px 0 #312e81;
    transform: translateY(-1px);
  }

  .row-btn.pm-row-btn.selected {
    background: #0d9488;
    border-color: #115e59;
    box-shadow: 0 3px 0 #134e4a;
  }

  .row-mini-bar {
    width: 80%;
    height: 5px;
    background: rgba(0, 0, 0, 0.12);
    border-radius: 999px;
    overflow: hidden;
  }

  .row-btn.selected .row-mini-bar {
    background: rgba(255, 255, 255, 0.28);
  }

  .row-mini-fill {
    display: block;
    height: 100%;
    background: #10b981;
  }

  .row-btn.selected .row-mini-fill {
    background: #fde047;
  }

  .type-toggle-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .type-btn {
    min-height: 76px;
    border-radius: 16px;
    border: 2.5px solid #e2e8f0;
    background: #f8fafc;
    padding: 10px;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    text-align: center;
    touch-action: manipulation;
    transition: all 0.12s ease;
  }

  .type-btn.selected {
    background: #eef2ff;
    border-color: #4f46e5;
    box-shadow: 0 3px 10px rgba(79, 70, 229, 0.14);
  }

  .type-emoji {
    font-size: 1.35rem;
  }

  .type-title {
    font-size: 0.9rem;
    font-weight: 800;
    color: #1e1b4b;
  }

  .type-example {
    font-size: 0.75rem;
    font-weight: 700;
    color: #64748b;
  }

  .start-cta-btn {
    width: 100%;
    min-height: 64px;
    border: none;
    border-radius: 20px;
    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #4338ca 100%);
    color: #ffffff;
    font-family: inherit;
    font-size: 1.15rem;
    font-weight: 900;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    box-shadow: 0 6px 0 #312e81, 0 10px 20px rgba(79, 70, 229, 0.3);
    touch-action: manipulation;
    transition: transform 0.08s ease, box-shadow 0.08s ease;
  }

  .start-cta-btn.cta-pm {
    background: linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #0f766e 100%);
    box-shadow: 0 6px 0 #115e59, 0 10px 20px rgba(13, 148, 136, 0.3);
  }

  .start-cta-btn:hover {
    filter: brightness(1.05);
  }

  .start-cta-btn:active {
    transform: translateY(4px);
    box-shadow: 0 2px 0 #312e81;
  }

  .start-cta-btn.cta-pm:active {
    box-shadow: 0 2px 0 #115e59;
  }

  .cta-rocket {
    font-size: 1.4rem;
  }

  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .preview-sub {
    margin: -4px 0 0;
    font-size: 0.83rem;
    color: #64748b;
  }

  .open-matrix-btn {
    background: #eef2ff;
    color: #4338ca;
    border: 2px solid #c7d2fe;
    border-radius: 12px;
    padding: 8px 12px;
    font-family: inherit;
    font-weight: 800;
    font-size: 0.84rem;
    cursor: pointer;
  }

  .open-matrix-btn:hover {
    background: #e0e7ff;
  }

  .mini-status-pills {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .status-box {
    border-radius: 14px;
    padding: 10px 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .box-green {
    background: #d1fae5;
    color: #065f46;
  }

  .box-yellow {
    background: #fef3c7;
    color: #92400e;
  }

  .box-gray {
    background: #f1f5f9;
    color: #475569;
  }

  .box-num {
    font-size: 1.35rem;
    font-weight: 900;
    line-height: 1.1;
  }

  .box-label {
    font-size: 0.75rem;
    font-weight: 700;
    margin-top: 2px;
  }
</style>
