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
  <input
    type="text"
    bind:value
    {placeholder}
    {disabled}
    onkeydown={handleKeydown}
    class="add-input"
  />
  <button class="add-btn" onclick={() => onsubmit?.()} disabled={disabled} aria-label="Add">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  </button>
</div>

<style>
  .add-bar {
    display: flex;
    width: 100%;
    max-width: 380px;
    height: 44px;
    background: #fefdfb;
    border: 1px solid #d4cfc5;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 0 #d0cbc0, 0 6px 10px rgba(0,0,0,0.08);
    transition: border-color 0.15s;
  }
  .add-bar:focus-within {
    border-color: #e87d7d;
  }
  .add-input {
    flex: 1;
    padding: 0 14px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #2d2d2d;
    background: transparent;
    border: none;
    outline: none;
    min-width: 0;
  }
  .add-input::placeholder {
    color: #c4bfb5;
    font-style: italic;
  }
  .add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    background: #e87d7d;
    border: none;
    cursor: pointer;
    color: white;
    flex-shrink: 0;
    transition: background 0.15s;
  }
  .add-btn:hover {
    background: #d46d6d;
  }
  .add-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
