<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    rotate = 0,
    tapeStyle = '',
    color = '#fff9c4',
    children,
  }: {
    title: string;
    rotate?: number;
    tapeStyle?: string;
    color?: string;
    children: Snippet;
  } = $props();
</script>

<div class="clipboard" style="--clip-rotate: {rotate}deg">
  <div class="tape" style={tapeStyle || ''}></div>
  <div class="paper" style="background:{color}">
    <h3 class="title">{title}</h3>
    {@render children()}
  </div>
</div>

<style>
  .clipboard {
    position: relative;
    transform: rotate(var(--clip-rotate, 0deg));
    padding-top: 8px;
  }

  .tape {
    position: absolute;
    top: -2px;
    left: 50%;
    transform: translateX(-50%) rotate(-3deg);
    width: 80px;
    height: 24px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(2px);
    border-radius: 1px;
    z-index: 5;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    clip-path: polygon(
      0% 30%, 3% 10%, 8% 35%, 14% 5%, 20% 25%, 25% 8%, 30% 28%, 35% 12%,
      40% 20%, 45% 5%, 50% 30%, 55% 10%, 60% 25%, 65% 8%, 70% 30%,
      75% 15%, 80% 28%, 86% 10%, 92% 25%, 97% 12%, 100% 28%,
      100% 72%, 97% 88%, 92% 75%, 86% 90%, 80% 72%, 75% 85%,
      70% 70%, 65% 92%, 60% 75%, 55% 90%, 50% 70%, 45% 95%,
      40% 80%, 35% 88%, 30% 72%, 25% 92%, 20% 75%, 14% 90%,
      8% 65%, 3% 90%, 0% 70%
    );
  }

  .paper {
    border: none;
    border-radius: 2px;
    padding: 20px 16px 16px;
    box-shadow:
      0 1px 0 #d4cfc0,
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
