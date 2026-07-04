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
  class="character-card"
  class:in-bank={inBank}
  style="--card-rotate: {rotate}deg"
  {onclick}
  type="button"
>
  {#if inBank}
    <div class="lanyard">
      <div class="lanyard-strip"></div>
    </div>
  {/if}

  {#if hskNumeral}
    <span class="hsk-badge">{hskNumeral}</span>
  {/if}

  <span class="character">{character}</span>

  {#if frequencyRank}
    <span class="freq-rank">#{frequencyRank}</span>
  {/if}
</button>

<style>
  .character-card {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 90px;
    height: 90px;
    background: #faf7f2;
    border: 1px solid #e8e3da;
    border-radius: 2px;
    box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    transform: rotate(var(--card-rotate, 0deg));
    overflow: visible;
    padding: 0;
  }

  .character-card:hover {
    transform: translateY(-3px) rotate(var(--card-rotate, 0deg));
    box-shadow: 2px 4px 8px rgba(0, 0, 0, 0.12);
  }

  /* Lanyard — top left */
  .lanyard {
    position: absolute;
    top: -2px;
    left: 6px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .lanyard-strip {
    width: 12px;
    height: 24px;
    background: linear-gradient(
      135deg,
      #c41e3a 0%,
      #d94a5a 30%,
      #c41e3a 50%,
      #9a1630 80%,
      #c41e3a 100%
    );
    clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      0 1px 2px rgba(0, 0, 0, 0.2);
  }

  /* HSK stamp — top right */
  .hsk-badge {
    position: absolute;
    top: 2px;
    right: 5px;
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 22px;
    color: #c41e3a;
    opacity: 0.8;
    transform: rotate(4deg);
    line-height: 1;
    z-index: 2;
  }

  /* Character — center */
  .character {
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 48px;
    color: #2d2d2d;
    line-height: 1;
    position: relative;
    z-index: 1;
  }

  /* Frequency rank — bottom */
  .freq-rank {
    position: absolute;
    bottom: 3px;
    left: 0;
    right: 0;
    text-align: center;
    font-family: 'Inter', sans-serif;
    font-size: 9px;
    color: #bbbbbb;
    font-weight: 500;
    letter-spacing: 0.3px;
    z-index: 2;
  }
</style>
