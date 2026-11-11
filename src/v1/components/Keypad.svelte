<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    disabled?: boolean;
    canSubmit?: boolean;
    canDelete?: boolean;
    onDigit: (digit: string) => void;
    onDelete: () => void;
    onSubmit: () => void;
  }

  let {
    disabled = false,
    canSubmit = false,
    canDelete = false,
    onDigit,
    onDelete,
    onSubmit,
  }: Props = $props();

  const digitsRow1 = ['1', '2', '3'];
  const digitsRow2 = ['4', '5', '6'];
  const digitsRow3 = ['7', '8', '9'];

  function handleKeydown(event: KeyboardEvent) {
    if (disabled) return;
    if (event.key >= '0' && event.key <= '9') {
      event.preventDefault();
      onDigit(event.key);
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      if (canDelete) onDelete();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (canSubmit) onSubmit();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<div class="keypad" role="group" aria-label="Ziffernblock">
  <div class="keypad-grid">
    {#each digitsRow1 as d (d)}
      <button
        type="button"
        class="key-btn digit-btn"
        {disabled}
        onclick={() => onDigit(d)}
        aria-label="Ziffer {d}"
      >
        {d}
      </button>
    {/each}

    {#each digitsRow2 as d (d)}
      <button
        type="button"
        class="key-btn digit-btn"
        {disabled}
        onclick={() => onDigit(d)}
        aria-label="Ziffer {d}"
      >
        {d}
      </button>
    {/each}

    {#each digitsRow3 as d (d)}
      <button
        type="button"
        class="key-btn digit-btn"
        {disabled}
        onclick={() => onDigit(d)}
        aria-label="Ziffer {d}"
      >
        {d}
      </button>
    {/each}

    <button
      type="button"
      class="key-btn action-delete"
      disabled={disabled || !canDelete}
      onclick={onDelete}
      aria-label="Löschen"
      title="Letzte Ziffer löschen (Rückstelltaste)"
    >
      <span class="key-icon">⌫</span>
      <span class="key-sub">Löschen</span>
    </button>

    <button
      type="button"
      class="key-btn digit-btn"
      {disabled}
      onclick={() => onDigit('0')}
      aria-label="Ziffer 0"
    >
      0
    </button>

    <button
      type="button"
      class="key-btn action-submit"
      disabled={disabled || !canSubmit}
      onclick={onSubmit}
      aria-label="Antwort prüfen"
      title="Antwort prüfen (Eingabetaste)"
    >
      <span class="key-icon">✓</span>
      <span class="key-sub">Prüfen</span>
    </button>
  </div>
</div>

<style>
  .keypad {
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    user-select: none;
    -webkit-user-select: none;
  }

  .keypad-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .key-btn {
    min-height: 62px;
    min-width: 62px;
    border: none;
    border-radius: 18px;
    font-family: inherit;
    font-size: 1.65rem;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: transform 0.08s ease, box-shadow 0.08s ease, background-color 0.15s ease;
  }

  .digit-btn {
    background: #ffffff;
    color: #1e1b4b;
    border: 2px solid #e0e7ff;
    box-shadow: 0 5px 0 #c7d2fe, 0 6px 12px rgba(79, 70, 229, 0.08);
  }

  .digit-btn:hover:not(:disabled) {
    background: #f5f7ff;
    border-color: #a5b4fc;
  }

  .digit-btn:active:not(:disabled) {
    transform: translateY(4px);
    box-shadow: 0 1px 0 #c7d2fe;
    background: #eef2ff;
  }

  .action-delete {
    background: #fef2f2;
    color: #b91c1c;
    border: 2px solid #fecaca;
    box-shadow: 0 5px 0 #fca5a5, 0 6px 12px rgba(239, 68, 68, 0.08);
  }

  .action-delete:hover:not(:disabled) {
    background: #fee2e2;
  }

  .action-delete:active:not(:disabled) {
    transform: translateY(4px);
    box-shadow: 0 1px 0 #fca5a5;
  }

  .action-submit {
    background: linear-gradient(180deg, #10b981 0%, #059669 100%);
    color: #ffffff;
    border: 2px solid #059669;
    box-shadow: 0 5px 0 #047857, 0 6px 14px rgba(16, 185, 129, 0.28);
  }

  .action-submit:hover:not(:disabled) {
    filter: brightness(1.05);
  }

  .action-submit:active:not(:disabled) {
    transform: translateY(4px);
    box-shadow: 0 1px 0 #047857;
  }

  .key-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
  }

  .key-icon {
    font-size: 1.45rem;
    line-height: 1.1;
  }

  .key-sub {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    margin-top: 1px;
    text-transform: uppercase;
  }

  @media (min-height: 760px) {
    .key-btn {
      min-height: 68px;
      font-size: 1.8rem;
    }
    .keypad-grid {
      gap: 12px;
    }
  }
</style>

