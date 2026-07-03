<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    rotate = 0,
    children,
  }: {
    title: string;
    rotate?: number;
    children: Snippet;
  } = $props();
</script>

<div class="clipboard" style="--clip-rotate: {rotate}deg">
  <div class="clip">
    <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
      <rect x="2" y="2" width="28" height="16" rx="2" fill="#b8b0a0" stroke="#9a9282" stroke-width="0.5"/>
      <rect x="6" y="4" width="20" height="12" rx="1" fill="#d4cfc5" stroke="#b8b0a0" stroke-width="0.5"/>
      <ellipse cx="10" cy="10" rx="4" ry="5" fill="#c0b8a8" stroke="#9a9282" stroke-width="0.5"/>
      <ellipse cx="22" cy="10" rx="4" ry="5" fill="#c0b8a8" stroke="#9a9282" stroke-width="0.5"/>
    </svg>
  </div>
  <div class="paper">
    <h3 class="title">{title}</h3>
    {@render children()}
  </div>
</div>

<style>
  .clipboard {
    position: relative;
    transform: rotate(var(--clip-rotate, 0deg));
  }

  .clip {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 5;
    filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.15));
  }

  .paper {
    background: #ffffff;
    border: 1px solid #e8e5e0;
    border-radius: 2px;
    padding: 20px 16px 16px;
    box-shadow: 3px 4px 10px rgba(0, 0, 0, 0.12);
    position: relative;
  }

  .paper::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    border-radius: 2px;
  }

  .title {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: #888888;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 12px;
  }
</style>
