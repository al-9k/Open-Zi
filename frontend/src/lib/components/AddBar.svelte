<script lang="ts">
  let {
    value = $bindable(''),
    placeholder = 'Add characters...',
    onsubmit,
    disabled = false,
  }: {
    value?: string;
    placeholder?: string;
    onsubmit?: () => void;
    disabled?: boolean;
  } = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') onsubmit?.();
  }
</script>

<div class="add-bar">
  <input type="text" bind:value {placeholder} {disabled} onkeydown={handleKeydown} class="add-input" />
  <button class="add-btn" onclick={() => onsubmit?.()} disabled={disabled} aria-label="Add">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  </button>
</div>

<style>
  .add-bar {
    display: flex;
    width: 100%;
    max-width: 380px;
    height: 42px;
    background: #ffffff;
    border: 1px solid #e8e5e0;
    overflow: hidden;
  }

  .add-bar:focus-within { border-color: #c41e3a; }

  .add-input {
    flex: 1;
    padding: 0 14px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #3a3a3a;
    background: transparent;
    border: none;
    outline: none;
    min-width: 0;
  }

  .add-input::placeholder { color: #b0aaa2; }

  .add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    background: #c41e3a;
    border: none;
    cursor: pointer;
    color: #fff;
    flex-shrink: 0;
    transition: opacity 0.12s;
  }

  .add-btn:hover { opacity: 0.85; }
  .add-btn:disabled { opacity: 0.4; cursor: default; }
</style>
