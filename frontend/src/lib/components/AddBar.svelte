<script lang="ts">
  let { value = $bindable(''), placeholder = 'Add characters...', onsubmit, disabled = false }:
    { value?: string; placeholder?: string; onsubmit?: () => void; disabled?: boolean } = $props();
</script>

<div class="add-bar">
  <input type="text" bind:value {placeholder} {disabled} onkeydown={(e) => e.key === 'Enter' && onsubmit?.()} class="add-input" />
  <button class="add-btn" onclick={() => onsubmit?.()} disabled={disabled}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  </button>
</div>

<style>
  .add-bar {
    display: flex; width: 100%; max-width: 400px; height: 44px;
    background: #ffffff; border: 3px solid #2a2a2a; box-shadow: 3px 3px 0 #1a1a1a;
  }
  .add-bar:focus-within { border-color: #dc0a2d; }

  .add-input {
    flex: 1; padding: 0 14px; font-family: 'Inter', sans-serif; font-size: 14px;
    color: #1a1a1a; background: transparent; border: none; outline: none; min-width: 0;
  }
  .add-input::placeholder { color: #9a9590; }

  .add-btn {
    display: flex; align-items: center; justify-content: center;
    width: 44px; background: #dc0a2d; border: none; cursor: pointer; color: #fff;
    flex-shrink: 0; transition: opacity 0.1s;
  }
  .add-btn:hover { opacity: 0.85; }
  .add-btn:disabled { opacity: 0.4; cursor: default; }
</style>
