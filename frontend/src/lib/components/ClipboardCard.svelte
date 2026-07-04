<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    rotate = 0,
    color = '#fff9c4',
    children,
  }: {
    title: string;
    rotate?: number;
    color?: string;
    children: Snippet;
  } = $props();
</script>

<div class="clipboard" style="--clip-rotate: {rotate}deg">
  <div class="paper" style="background:{color}">
    <h3 class="title">{title}</h3>
    {@render children()}
  </div>
</div>

<style>
  .clipboard {
    position: relative;
    transform: rotate(var(--clip-rotate, 0deg));
    width: 100%;
  }

  .paper {
    border: none;
    border-top: 18px solid rgba(0,0,0,0.06);
    border-radius: 2px;
    padding: 8px 16px 16px;
    box-shadow:
      2px 3px 8px rgba(0, 0, 0, 0.25),
      4px 6px 16px rgba(0, 0, 0, 0.10);
    position: relative;
  }

  .paper::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    border-radius: 2px;
  }

  .title {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: #777;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 12px;
  }
</style>
