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
    background: #fefeff;
    border: 1px solid #b8d4d0;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 0 #4a8a85, 0 6px 10px rgba(0,0,0,0.10);
    transition: border-color 0.15s;
  }
  .add-bar:focus-within {
    border-color: #6bb5b0;
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
    background: #6bb5b0;
    border: none;
    cursor: pointer;
    color: white;
    flex-shrink: 0;
    transition: background 0.15s;
  }
  .add-btn:hover {
    background: #5aa39e;
  }
  .add-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
