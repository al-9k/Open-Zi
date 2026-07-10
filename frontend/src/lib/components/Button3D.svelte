<script lang="ts">
  import type { Snippet } from 'svelte';
  let { variant = 'red', size = 'md', onclick, disabled = false, children }:
    { variant?: 'red' | 'green' | 'ghost'; size?: 'sm' | 'md'; onclick?: () => void; disabled?: boolean; children: Snippet } = $props();
</script>

<button {onclick} {disabled} class="btn btn-{variant} btn-{size}" class:dis={disabled} type="button">
  {@render children()}
</button>

<style>
  .btn {
    display: inline-flex; align-items: center; justify-content: center;
    font-family: 'Inter', sans-serif; font-weight: 700; border: 3px solid #1a1a1a;
    cursor: pointer; transition: all 0.1s; box-shadow: 3px 3px 0 #1a1a1a;
    color: #fff; letter-spacing: 0.3px;
  }
  .btn:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 #1a1a1a; }
  .btn:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 #1a1a1a; }
  .dis { opacity: 0.4; cursor: default; }
  .dis:hover { transform: none; box-shadow: 3px 3px 0 #1a1a1a; }
  .btn-sm { padding: 6px 14px; font-size: 12px; }
  .btn-md { padding: 8px 20px; font-size: 14px; }
  .btn-red { background: #c41e3a; }
  .btn-green { background: #2a8a4a; }
  .btn-ghost { background: #ffffff; color: #5a5550; }
</style>
