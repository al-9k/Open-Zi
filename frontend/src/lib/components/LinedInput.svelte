<script lang="ts">
  let {
    value = $bindable(''),
    placeholder = '',
    onkeydown,
    disabled = false,
  }: {
    value?: string;
    placeholder?: string;
    onkeydown?: (e: KeyboardEvent) => void;
    disabled?: boolean;
  } = $props();
</script>

<div class="lined-input-wrapper">
  <input
    type="text"
    bind:value
    {placeholder}
    {disabled}
    {onkeydown}
    class="lined-input"
  />
  <div class="lines"></div>
  <div class="focus-underline"></div>
</div>

<style>
  .lined-input-wrapper {
    position: relative;
    width: 100%;
  }

  .lined-input {
    position: relative;
    z-index: 1;
    width: 100%;
    padding: 10px 14px;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 15px;
    color: #2d2d2d;
    background: transparent;
    border: none;
    outline: none;
    line-height: 1.6;
  }

  .lined-input::placeholder {
    color: #c4bfb5;
    font-style: italic;
    font-size: 14px;
  }

  .lines {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      to bottom,
      transparent,
      transparent 28px,
      #e8e5e0 28px,
      #e8e5e0 29px
    );
    border: 1px solid #e8e5e0;
    border-radius: 3px;
    background-color: #fefdfb;
  }

  .lines::before {
    content: '';
    position: absolute;
    top: 0;
    left: 20px;
    bottom: 0;
    width: 1px;
    background: #f0d0d0;
    opacity: 0.5;
  }

  .focus-underline {
    position: absolute;
    bottom: 0;
    left: 8px;
    right: 8px;
    height: 2px;
    background: #e87d7d;
    transform: scaleX(0);
    transition: transform 0.2s ease;
    z-index: 2;
    border-radius: 1px;
  }

  .lined-input:focus ~ .focus-underline {
    transform: scaleX(1);
  }
</style>
