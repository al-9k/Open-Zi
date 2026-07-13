<script lang="ts">
  import { onMount } from 'svelte';
  import HanziWriter from 'hanzi-writer';

  let {
    character,
    autoplay = false,
    oncomplete,
  }: {
    character: string;
    autoplay?: boolean;
    oncomplete?: () => void;
  } = $props();

  let writer: HanziWriter | null = $state(null);
  let ready = $state(false);
  let loading = $state(true);
  let error = $state('');
  let playing = $state(false);
  let canvasEl: HTMLDivElement | undefined = $state();
  let lastChar = $state('');

  function initWriter() {
    if (!canvasEl || character.length !== 1) return;
    loading = true; error = ''; ready = false; playing = false;
    if (writer) { try { writer.hideCharacter(); } catch {} }
    canvasEl.innerHTML = '';

    writer = HanziWriter.create(canvasEl, character, {
      width: 140, height: 140, padding: 6,
      strokeColor: '#3a3a3a', radicalColor: '#c41e3a', outlineColor: '#d0cbc0',
      strokeAnimationSpeed: 1.2, delayBetweenStrokes: 150,
      onLoadCharDataSuccess: () => { loading = false; ready = true; if (autoplay) writer?.loopCharacterAnimation(); },
      onLoadCharDataError: () => { error = 'No data'; loading = false; },
    });
  }

  onMount(() => { initWriter(); });

  $effect(() => {
    if (character !== lastChar) { lastChar = character; initWriter(); }
  });

  function startAnim() {
    if (!writer) return;
    playing = true;
    writer.animateCharacter({
      onComplete: () => {
        playing = false;
        if (autoplay && oncomplete) oncomplete();
      },
    });
  }

  function manualPlay() { startAnim(); }
  function reset() { if (!writer) return; playing = false; writer.hideCharacter(); setTimeout(() => writer?.showCharacter(), 100); }
</script>

<div class="stroke-wrap">
  <div class="stroke-canvas-wrap">
    {#if loading}<div class="stroke-loading"><span class="stroke-loading-char">{character}</span></div>{/if}
    <div bind:this={canvasEl} class="stroke-canvas" class:hidden={loading}></div>
  </div>
  {#if !autoplay}
    <div class="stroke-controls">
      {#if error}<span class="stroke-error">No data</span>{:else if ready}
        <button class="sc-btn" onclick={manualPlay} disabled={playing}><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg> Play</button>
        <button class="sc-btn" onclick={reset}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="1,4 1,10 7,10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg> Reset</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .stroke-wrap { display:flex; flex-direction:column; align-items:center; gap:4px; flex-shrink:0; }
  .stroke-canvas-wrap { position:relative; width:140px; height:140px; background:#ffffff; border:1px solid #d0ccc4; overflow:hidden; }
  .stroke-canvas { width:140px; height:140px; }
  .stroke-canvas.hidden { visibility:hidden; }
  .stroke-loading { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; }
  .stroke-loading-char { font-family:'Kaiti SC','STKaiti','KaiTi','SimKai',cursive; font-size:60px; color:#e0dcd4; }
  .stroke-error { font-size:10px; color:#9a9590; font-family:'Inter',sans-serif; }
  .stroke-controls { display:flex; gap:4px; justify-content:center; }
  .sc-btn { display:inline-flex; align-items:center; gap:2px; padding:2px 8px; font-family:'Inter',sans-serif; font-size:10px; font-weight:600; color:#5a5550; background:#fff; border:1px solid #d0ccc4; cursor:pointer; }
  .sc-btn:hover { background:#f5f2ec; }
  .sc-btn:disabled { opacity:0.5; cursor:default; }
</style>
