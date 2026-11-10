<script lang="ts">
  import { formatEquationParts } from '../lib/generator';
  import { getCardMastery, getMatrixCellStatus } from '../lib/sm2';
  import type { GameMode, MasteryStatus, TaskCard } from '../lib/types';

  interface Props {
    gameMode: GameMode;
    cards: TaskCard[];
    onSwitchGameMode: (mode: GameMode) => void;
    onPracticeRow: (row: number) => void;
    onBack: () => void;
    onResetProgress: () => void;
  }

  let {
    gameMode,
    cards,
    onSwitchGameMode,
    onPracticeRow,
    onBack,
    onResetProgress,
  }: Props = $props();

  const factors = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  let selectedCell = $state<{ a: number; b: number } | null>({ a: 3, b: 4 });
  let showResetConfirm = $state(false);

  function getCardsForCell(a: number, b: number): TaskCard[] {
    return cards.filter((c) => c.fact[0] === a && c.fact[1] === b);
  }

  function getStatus(a: number, b: number): MasteryStatus {
    return getMatrixCellStatus(getCardsForCell(a, b));
  }

  let counts = $derived.by(() => {
    let mastered = 0;
    let learning = 0;
    let fresh = 0;

    for (const a of factors) {
      for (const b of factors) {
        const st = getStatus(a, b);
        if (st === 'mastered') mastered++;
        else if (st === 'learning') learning++;
        else fresh++;
      }
    }
    return { mastered, learning, fresh };
  });

  let selectedCellCards = $derived(
    selectedCell ? getCardsForCell(selectedCell.a, selectedCell.b) : []
  );

  let selectedCellStatus = $derived(
    selectedCell ? getStatus(selectedCell.a, selectedCell.b) : 'new'
  );

  function statusLabel(status: MasteryStatus): string {
    if (status === 'mastered') return 'Gemeistert';
    if (status === 'learning') return 'Am Lernen';
    return 'Neu';
  }

  function variantTypeName(card: TaskCard): string {
    if (card.type === 'mult') return 'Mal';
    if (card.type === 'div') return 'Geteilt';
    if (card.type === 'add') return 'Plus';
    if (card.type === 'sub') return 'Minus';
    return 'Lücke';
  }
</script>

<section class="matrix-view" aria-label="Fortschritts-Matrix">
  <div class="matrix-header-card">
    <div class="matrix-title-row">
      <div>
        <h2>
          {gameMode === 'mult'
            ? 'Deine 1×1-Tafel'
            : 'Deine 1+1-Tafel (Zahlenheld)'}
        </h2>
        <p class="subtitle">
          Tippe auf ein Feld für Details zu allen Aufgaben
        </p>
      </div>
      <button type="button" class="back-btn" onclick={onBack}>
        ← Zurück
      </button>
    </div>

    <div class="mode-mini-tabs">
      <button
        type="button"
        class="mini-tab"
        class:active={gameMode === 'mult'}
        onclick={() => onSwitchGameMode('mult')}
      >
        ✖️ 1×1-Tafel
      </button>
      <button
        type="button"
        class="mini-tab"
        class:active={gameMode === 'plusminus'}
        onclick={() => onSwitchGameMode('plusminus')}
      >
        ➕ 1+1-Tafel (bis 20)
      </button>
    </div>

    <div class="legend-bar">
      <div class="legend-item">
        <span class="dot dot-mastered"></span>
        <span>Grün: Gemeistert (<strong>{counts.mastered}</strong>)</span>
      </div>
      <div class="legend-item">
        <span class="dot dot-learning"></span>
        <span>Gelb: Am Lernen (<strong>{counts.learning}</strong>)</span>
      </div>
      <div class="legend-item">
        <span class="dot dot-new"></span>
        <span>Grau: Neu (<strong>{counts.fresh}</strong>)</span>
      </div>
    </div>

    <div class="overall-progress" aria-label="Gesamtfortschritt">
      <div
        class="bar-segment seg-mastered"
        style="width: {counts.mastered}%"
        title="{counts.mastered}% Gemeistert"
      ></div>
      <div
        class="bar-segment seg-learning"
        style="width: {counts.learning}%"
        title="{counts.learning}% Am Lernen"
      ></div>
    </div>
  </div>

  <div class="grid-container">
    <div class="matrix-grid" role="grid" aria-label="10 mal 10 Matrix">
      <div
        class="corner-cell"
        class:corner-pm={gameMode === 'plusminus'}
        role="columnheader"
      >
        {gameMode === 'mult' ? '×' : '+'}
      </div>
      {#each factors as col (col)}
        <div class="header-cell" role="columnheader" title="Spalte {col}">
          {gameMode === 'mult' ? col : `+${col}`}
        </div>
      {/each}

      {#each factors as a (a)}
        <div class="header-cell row-header" role="rowheader">
          {a}
        </div>
        {#each factors as b (`${a}_${b}`)}
          {@const status = getStatus(a, b)}
          {@const isSelected = selectedCell?.a === a && selectedCell?.b === b}
          {@const cellResult = gameMode === 'mult' ? a * b : a + b}
          {@const isMakeTen = gameMode === 'plusminus' && a + b === 10}
          <button
            type="button"
            class="matrix-cell status-{status}"
            class:selected={isSelected}
            class:make-ten={isMakeTen}
            onclick={() => (selectedCell = { a, b })}
            aria-label="{a} {gameMode === 'mult' ? 'mal' : 'plus'} {b} gleich {cellResult}, Status: {statusLabel(status)}"
          >
            <span class="cell-product">{cellResult}</span>
          </button>
        {/each}
      {/each}
    </div>
  </div>

  {#if selectedCell}
    {@const selResult =
      gameMode === 'mult'
        ? selectedCell.a * selectedCell.b
        : selectedCell.a + selectedCell.b}
    <div class="detail-card">
      <div class="detail-top">
        <div class="detail-fact">
          <span class="big-eq">
            {selectedCell.a}
            {gameMode === 'mult' ? '×' : '+'}
            {selectedCell.b} = {selResult}
          </span>
          <span class="status-pill pill-{selectedCellStatus}">
            {statusLabel(selectedCellStatus)}
          </span>
        </div>
        <button
          type="button"
          class="practice-row-btn"
          class:btn-pm={gameMode === 'plusminus'}
          onclick={() => onPracticeRow(selectedCell!.b)}
        >
          {gameMode === 'mult'
            ? `${selectedCell.b}er-Reihe üben 🚀`
            : `+${selectedCell.b}-Reihe üben 🚀`}
        </button>
      </div>

      <div class="variants-grid">
        {#each selectedCellCards as vCard (vCard.id)}
          {@const vStatus = getCardMastery(vCard)}
          {@const eq = formatEquationParts(vCard)}
          <div class="variant-item v-{vStatus}">
            <div class="variant-eq">{eq.fullEquationWithSolution}</div>
            <div class="variant-meta">
              <span>{variantTypeName(vCard)}</span>
              {#if vCard.totalAttempts > 0}
                <span>· {vCard.repetitions}× sicher</span>
                {#if vCard.lastResponseMs}
                  <span>· {(vCard.lastResponseMs / 1000).toFixed(1).replace('.', ',')}s</span>
                {/if}
              {:else}
                <span>· Noch neu</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="reset-zone">
    {#if !showResetConfirm}
      <button
        type="button"
        class="reset-trigger-btn"
        onclick={() => (showResetConfirm = true)}
      >
        Lernstand für {gameMode === 'mult' ? '1×1 Meister' : 'Zahlenheld'} zurücksetzen
      </button>
    {:else}
      <div class="reset-confirm-box">
        <span>
          Wirklich den Lernstand im Modus <strong>{gameMode === 'mult' ? '1×1 Meister' : 'Zahlenheld'}</strong> löschen? (Der andere Modus bleibt erhalten!)
        </span>
        <div class="reset-actions">
          <button
            type="button"
            class="confirm-delete-btn"
            onclick={() => {
              showResetConfirm = false;
              onResetProgress();
            }}
          >
            Ja, Modus zurücksetzen
          </button>
          <button
            type="button"
            class="cancel-btn"
            onclick={() => (showResetConfirm = false)}
          >
            Abbrechen
          </button>
        </div>
      </div>
    {/if}
  </div>
</section>

<style>
  .matrix-view {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-bottom: 24px;
  }

  .matrix-header-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 4px 16px rgba(79, 70, 229, 0.08);
    border: 2px solid #e0e7ff;
  }

  .matrix-title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #1e1b4b;
  }

  .subtitle {
    margin: 2px 0 0;
    font-size: 0.85rem;
    color: #64748b;
  }

  .mode-mini-tabs {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .mini-tab {
    flex: 1;
    padding: 7px 10px;
    border-radius: 11px;
    border: 1.5px solid #cbd5e1;
    background: #f8fafc;
    color: #475569;
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 800;
    cursor: pointer;
  }

  .mini-tab.active {
    background: #eef2ff;
    border-color: #4f46e5;
    color: #312e81;
  }

  .back-btn {
    background: #eef2ff;
    color: #4338ca;
    border: 2px solid #c7d2fe;
    border-radius: 12px;
    padding: 8px 14px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    white-space: nowrap;
  }

  .back-btn:hover {
    background: #e0e7ff;
  }

  .legend-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 12px;
    font-size: 0.84rem;
    color: #334155;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .dot {
    width: 13px;
    height: 13px;
    border-radius: 4px;
    display: inline-block;
  }

  .dot-mastered {
    background: #10b981;
  }

  .dot-learning {
    background: #f59e0b;
  }

  .dot-new {
    background: #cbd5e1;
  }

  .overall-progress {
    margin-top: 10px;
    height: 10px;
    background: #f1f5f9;
    border-radius: 999px;
    overflow: hidden;
    display: flex;
  }

  .bar-segment {
    height: 100%;
    transition: width 0.35s ease;
  }

  .seg-mastered {
    background: #10b981;
  }

  .seg-learning {
    background: #fbbf24;
  }

  .grid-container {
    background: #ffffff;
    border-radius: 20px;
    padding: 10px;
    box-shadow: 0 4px 16px rgba(79, 70, 229, 0.08);
    border: 2px solid #e0e7ff;
    overflow-x: auto;
  }

  .matrix-grid {
    display: grid;
    grid-template-columns: 28px repeat(10, minmax(26px, 1fr));
    gap: 4px;
    min-width: 300px;
  }

  .corner-cell,
  .header-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 0.75rem;
    color: #4338ca;
    background: #eef2ff;
    border-radius: 7px;
    min-height: 28px;
  }

  .corner-cell {
    background: #4f46e5;
    color: #ffffff;
    font-size: 0.9rem;
  }

  .corner-cell.corner-pm {
    background: #0d9488;
  }

  .matrix-cell {
    aspect-ratio: 1 / 1;
    min-height: 30px;
    border-radius: 8px;
    border: 2px solid transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: inherit;
    font-weight: 800;
    font-size: 0.78rem;
    cursor: pointer;
    padding: 0;
    transition: transform 0.1s ease, border-color 0.12s ease;
    touch-action: manipulation;
  }

  .matrix-cell.make-ten.status-new {
    border-color: #99f6e4;
  }

  .matrix-cell:hover {
    transform: scale(1.06);
    z-index: 1;
  }

  .matrix-cell.selected {
    border-color: #1e1b4b;
    box-shadow: 0 0 0 2px #6366f1;
    transform: scale(1.08);
    z-index: 2;
  }

  .status-new {
    background: #f1f5f9;
    color: #64748b;
    border-color: #e2e8f0;
  }

  .status-learning {
    background: #fef3c7;
    color: #92400e;
    border-color: #fcd34d;
  }

  .status-mastered {
    background: #d1fae5;
    color: #065f46;
    border-color: #6ee7b7;
  }

  .detail-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 16px;
    border: 2px solid #e0e7ff;
    box-shadow: 0 4px 16px rgba(79, 70, 229, 0.08);
  }

  .detail-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 12px;
  }

  .detail-fact {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .big-eq {
    font-size: 1.35rem;
    font-weight: 900;
    color: #1e1b4b;
  }

  .status-pill {
    font-size: 0.76rem;
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 999px;
    text-transform: uppercase;
  }

  .pill-new {
    background: #f1f5f9;
    color: #475569;
  }

  .pill-learning {
    background: #fef3c7;
    color: #b45309;
  }

  .pill-mastered {
    background: #d1fae5;
    color: #047857;
  }

  .practice-row-btn {
    background: #4f46e5;
    color: #ffffff;
    border: none;
    border-radius: 12px;
    padding: 9px 14px;
    font-weight: 800;
    font-size: 0.86rem;
    cursor: pointer;
  }

  .practice-row-btn.btn-pm {
    background: #0d9488;
  }

  .practice-row-btn:hover {
    filter: brightness(0.95);
  }

  .variants-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
  }

  .variant-item {
    padding: 8px 10px;
    border-radius: 12px;
    border: 1.5px solid #e2e8f0;
    font-size: 0.82rem;
  }

  .variant-item.v-mastered {
    background: #ecfdf5;
    border-color: #a7f3d0;
  }

  .variant-item.v-learning {
    background: #fffbeb;
    border-color: #fde68a;
  }

  .variant-item.v-new {
    background: #f8fafc;
    border-color: #e2e8f0;
  }

  .variant-eq {
    font-weight: 800;
    color: #1e293b;
  }

  .variant-meta {
    font-size: 0.73rem;
    color: #64748b;
    margin-top: 2px;
  }

  .reset-zone {
    display: flex;
    justify-content: center;
    margin-top: 4px;
  }

  .reset-trigger-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 0.8rem;
    text-decoration: underline;
    cursor: pointer;
    padding: 6px 12px;
  }

  .reset-confirm-box {
    background: #fef2f2;
    border: 2px solid #fecaca;
    border-radius: 14px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    color: #991b1b;
    font-weight: 700;
    text-align: center;
  }

  .reset-actions {
    display: flex;
    gap: 10px;
  }

  .confirm-delete-btn {
    background: #dc2626;
    color: #ffffff;
    border: none;
    border-radius: 10px;
    padding: 7px 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .cancel-btn {
    background: #ffffff;
    color: #334155;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    padding: 7px 12px;
    font-weight: 700;
    cursor: pointer;
  }
</style>
