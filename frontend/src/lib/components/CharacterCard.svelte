<script lang="ts">
  import { hskToChineseNumeral } from '$lib/utils';

  let {
    character,
    hsk,
    frequencyRank,
    inBank = true,
    rotate = 0,
    onclick,
  }: {
    character: string;
    hsk?: number | null;
    frequencyRank?: number | null;
    inBank?: boolean;
    rotate?: number;
    onclick?: () => void;
  } = $props();

  let hskNumeral = $derived(hskToChineseNumeral(hsk ?? null));
</script>

<button
  class="character-card group"
  class:muted={!inBank}
  style="--card-rotate: {rotate}deg"
  {onclick}
  type="button"
>
  {#if inBank && hsk}
    <div class="lanyard-wrapper">
      <div class="lanyard-strip"></div>
      <div class="lanyard-hole"></div>
    </div>
  {/if}

  {#if hskNumeral}
    <span class="hsk-badge">{hskNumeral}</span>
  {/if}

  <span class="character">{character}</span>

  {#if frequencyRank}
    <span class="freq-rank">#{frequencyRank}</span>
  {/if}

  <div class="card-gloss"></div>
</button>

<style>
  .character-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 140px;
    height: 186px;
    background: #faf7f2;
    border: 1px solid #e8e3da;
    border-radius: 2px;
    box-shadow: 2px 3px 8px rgba(0, 0, 0, 0.10), 1px 1px 3px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    transform: rotate(var(--card-rotate, 0deg));
    overflow: hidden;
    padding: 12px 8px;
    gap: 4px;
    background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    background-size: 200px 200px;
  }

  .character-card:hover {
    transform: translateY(-4px) rotate(var(--card-rotate, 0deg));
    box-shadow: 3px 5px 14px rgba(0, 0, 0, 0.14), 1px 2px 4px rgba(0, 0, 0, 0.08);
  }

  .character-card.muted {
    opacity: 0.65;
    filter: grayscale(0.3);
  }

  .lanyard-wrapper {
    position: absolute;
    top: -2px;
    left: -2px;
    z-index: 10;
    width: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .lanyard-strip {
    width: 14px;
    height: 36px;
    background: linear-gradient(
      135deg,
      #c41e3a 0%,
      #d94a5a 30%,
      #c41e3a 50%,
      #9a1630 80%,
      #c41e3a 100%
    );
    border-radius: 1px 1px 0 0;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      0 1px 2px rgba(0, 0, 0, 0.2);
    position: relative;
  }

  .lanyard-strip::after {
    content: '';
    position: absolute;
    top: 1px;
    left: 2px;
    right: 2px;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 1px;
  }

  .lanyard-hole {
    width: 5px;
    height: 5px;
    background: #faf8f5;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.15);
    margin-top: -1px;
    box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.1);
  }

  .hsk-badge {
    position: absolute;
    top: 6px;
    right: 8px;
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 28px;
    color: #c41e3a;
    opacity: 0.85;
    transform: rotate(3deg);
    line-height: 1;
    text-shadow: 0 1px 0 rgba(200, 30, 50, 0.15);
  }

  .character {
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 72px;
    color: #2d2d2d;
    line-height: 1;
    margin-top: 14px;
  }

  .freq-rank {
    position: absolute;
    bottom: 8px;
    font-size: 10px;
    color: #bbbbbb;
    font-weight: 500;
    letter-spacing: 0.5px;
  }

  .card-gloss {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.4) 0%,
      transparent 50%,
      rgba(0, 0, 0, 0.02) 100%
    );
    border-radius: 2px;
  }
</style>
