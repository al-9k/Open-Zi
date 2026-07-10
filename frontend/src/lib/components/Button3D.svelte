<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    variant = 'coral',
    size = 'md',
    onclick,
    disabled = false,
    children,
  }: {
    variant?: 'coral' | 'teal' | 'ghost';
    size?: 'sm' | 'md';
    onclick?: () => void;
    disabled?: boolean;
    children: Snippet;
  } = $props();
</script>

<button {onclick} {disabled} class="btn-3d btn-{variant} btn-{size}" class:disabled type="button">
  {@render children()}
</button>

<style>
  .btn-3d {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: opacity 0.12s;
    letter-spacing: 0.2px;
    color: #fff;
  }

  .btn-3d:hover { opacity: 0.88; }
  .btn-3d:active { opacity: 0.75; }
  .disabled { opacity: 0.4; cursor: default; }

  .btn-sm { padding: 6px 16px; font-size: 12px; }
  .btn-md { padding: 8px 20px; font-size: 14px; }

  .btn-coral { background: #c41e3a; }
  .btn-teal { background: #5a8a7a; }
  .btn-ghost { background: transparent; color: #8a8680; border: 1px solid #e8e5e0; }
  .btn-ghost:hover { background: #f6f4f0; color: #3a3a3a; opacity: 1; }
</style>
