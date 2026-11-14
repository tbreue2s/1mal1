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

<div class="w-full max-w-md mx-auto select-none" role="group" aria-label="Ziffernblock">
  <div class="grid grid-cols-3 gap-2 sm:gap-2.5">
    {#each digitsRow1 as d (d)}
      <button
        type="button"
        class="key-btn"
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
        class="key-btn"
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
        class="key-btn"
        {disabled}
        onclick={() => onDigit(d)}
        aria-label="Ziffer {d}"
      >
        {d}
      </button>
    {/each}

    <!-- Löschen-Taste -->
    <button
      type="button"
      class="key-btn action-btn bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 disabled:opacity-40"
      disabled={disabled || !canDelete}
      onclick={onDelete}
      aria-label="Löschen"
      title="Letzte Ziffer löschen"
    >
      <span class="text-xl">⌫</span>
      <span class="text-[10px] font-bold block -mt-1">Löschen</span>
    </button>

    <!-- Ziffer 0 -->
    <button
      type="button"
      class="key-btn"
      {disabled}
      onclick={() => onDigit('0')}
      aria-label="Ziffer 0"
    >
      0
    </button>

    <!-- Prüfen-Taste -->
    <button
      type="button"
      class="key-btn action-btn {
        canSubmit
          ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700 shadow-md'
          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-700 opacity-60'
      }"
      disabled={disabled || !canSubmit}
      onclick={onSubmit}
      aria-label="Antwort prüfen"
      title="Antwort prüfen"
    >
      <span class="text-2xl font-black">✓</span>
      <span class="text-[10px] font-bold block -mt-1">Prüfen</span>
    </button>
  </div>
</div>

<style>
  .key-btn {
    min-height: 56px;
    border-radius: 16px;
    font-size: 1.6rem;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    touch-action: manipulation;
    transition: transform 0.08s ease, box-shadow 0.08s ease, background-color 0.12s ease;
    border: 1.5px solid #e2e8f0;
    background: #ffffff;
    color: #0f172a;
    box-shadow: 0 3px 0 #cbd5e1;
  }

  :global(.dark) .key-btn {
    background: #1e293b;
    color: #f8fafc;
    border-color: #334155;
    box-shadow: 0 3px 0 #0f172a;
  }

  .key-btn:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow: 0 1px 0 #cbd5e1;
  }

  :global(.dark) .key-btn:active:not(:disabled) {
    box-shadow: 0 1px 0 #0f172a;
  }

  .key-btn:disabled {
    cursor: not-allowed;
  }
</style>
