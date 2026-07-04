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

<div class="input-wrapper">
  <input
    type="text"
    bind:value
    {placeholder}
    {disabled}
    {onkeydown}
    class="clean-input"
  />
</div>

<style>
  .input-wrapper { width: 100%; }
  .clean-input {
    width: 100%;
    padding: 8px 14px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #2d2d2d;
    background: #fefdfb;
    border: 1px solid #d4cfc5;
    border-radius: 8px;
    outline: none;
    line-height: 1.5;
    height: 42px;
    box-sizing: border-box;
    box-shadow: 0 4px 0 #d0cbc0, 0 6px 10px rgba(0,0,0,0.08);
  }
  .clean-input::placeholder {
    color: #c4bfb5;
    font-style: italic;
  }
  .clean-input:focus {
    border-color: #e87d7d;
  }
</style>
