<script lang="ts">
  let { corner = 'tl', top = '-12px' }: { corner?: 'tl' | 'tr'; top?: string } = $props();
</script>

<div
  class="tape-strip"
  class:tl={corner === 'tl'}
  class:tr={corner === 'tr'}
  style="top: {top};"
></div>

<style>
  .tape-strip {
    position: absolute;
    width: 50px;
    height: 18px;
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(2px);
    z-index: 10;
    pointer-events: none;
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

  .tl {
    left: 8px;
    transform: rotate(-3deg);
  }

  .tr {
    right: 8px;
    transform: rotate(2deg);
  }
</style>
