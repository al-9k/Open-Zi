<script lang="ts">
  import { onMount } from 'svelte';
  import HanziWriter from 'hanzi-writer';

  let { character }: { character: string } = $props();

  let writer: HanziWriter | null = $state(null);
  let ready = $state(false);
  let loading = $state(true);
  let error = $state('');
  let playing = $state(false);
  let canvasEl: HTMLDivElement | undefined = $state();

  let lastChar = $state('');

  function initWriter() {
    if (!canvasEl || character.length !== 1) return;
    loading = true;
    error = '';
    ready = false;
    playing = false;
    if (writer) { try { writer.hideCharacter(); } catch {} }
    canvasEl.innerHTML = '';

    writer = HanziWriter.create(canvasEl, character, {
      width: 200,
      height: 200,
      padding: 8,
      strokeColor: '#3a3a3a',
      radicalColor: '#c41e3a',
      outlineColor: '#d0cbc0',
      strokeAnimationSpeed: 1.5,
      delayBetweenStrokes: 200,
      onLoadCharDataSuccess: () => { loading = false; ready = true; },
      onLoadCharDataError: () => { error = 'No stroke data'; loading = false; },
    });
  }

  onMount(() => { initWriter(); });

  $effect(() => {
    if (character !== lastChar) {
      lastChar = character;
      initWriter();
    }
  });

  function animateStroke() {
    if (!writer || playing) return;
    playing = true;
    writer.animateCharacter({ onComplete: () => { playing = false; } });
  }

  function resetStroke() {
    if (!writer) return;
    playing = false;
    writer.hideCharacter();
    setTimeout(() => { writer?.showCharacter(); }, 100);
  }
</script>

<div class="stroke-wrap">
  <div class="stroke-canvas-wrap">
    {#if loading}
      <div class="stroke-loading">
        <span class="stroke-loading-char">{character}</span>
      </div>
    {/if}
    <div bind:this={canvasEl} class="stroke-canvas" class:hidden={loading}></div>
  </div>
  <div class="stroke-controls">
    {#if error}
      <span class="stroke-error">No stroke data</span>
    {:else if ready}
      <button class="sc-btn" onclick={animateStroke} disabled={playing}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
        Play
      </button>
      <button class="sc-btn" onclick={resetStroke}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1,4 1,10 7,10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
        Reset
      </button>
    {/if}
  </div>
</div>

<style>
  .stroke-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .stroke-canvas-wrap {
    position: relative;
    width: 200px;
    height: 200px;
    background: #fefeff;
    background-image: radial-gradient(circle, #e0dcd4 0.5px, transparent 0.5px);
    background-size: 12px 12px;
    border: 1px solid #e8e3da;
    border-radius: 2px;
    overflow: hidden;
  }

  .stroke-canvas {
    width: 200px;
    height: 200px;
  }

  .stroke-canvas.hidden { visibility: hidden; }

  .stroke-loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stroke-loading-char {
    font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', 'SimKai', cursive;
    font-size: 80px;
    color: #e0dcd4;
  }

  .stroke-error {
    font-size: 11px;
    color: #bbbbbb;
    font-family: 'Inter', sans-serif;
    font-style: italic;
  }

  .stroke-controls {
    display: flex;
    gap: 6px;
    justify-content: center;
  }

  .sc-btn {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 3px 10px;
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: #666;
    background: #fff;
    border: 1px solid #e8e3da;
    border-radius: 3px;
    cursor: pointer;
  }

  .sc-btn:hover { background: #f5f2ec; }
  .sc-btn:active { background: #eee9e0; }
  .sc-btn:disabled { opacity: 0.5; cursor: default; }
</style>
