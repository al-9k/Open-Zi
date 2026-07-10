<script lang="ts">
  import { hskToChineseNumeral } from '$lib/utils';
  import { bankDict, beastiaryDict, masteredChars, markMastered, markLearning } from '$lib/stores';
  import { api } from '$lib/api';

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
  let hovering = $state(false);
  let mastered = $state(false);
  let hideTimer: ReturnType<typeof setTimeout> | null = $state(null);

  $effect(() => {
    mastered = $masteredChars.has(character);
  });

  function showMenu() {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    hovering = true;
  }

  function startHide() {
    hideTimer = setTimeout(() => { hovering = false; }, 150);
  }

  function cancelHide() {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  }

  async function handleAdd(m: boolean) {
    try {
      await api.addCharacters(character);
      const [chars, words] = await Promise.all([api.getCharacters(), api.getWords()]);
      bankDict.set(chars);
      beastiaryDict.set(words);
      if (m) markMastered(character); else markLearning(character);
    } catch (e) { console.error('Add failed:', e); }
  }

  async function handleRemove() {
    try {
      await api.removeCharacter(character);
      markLearning(character);
      const [chars, words] = await Promise.all([api.getCharacters(), api.getWords()]);
      bankDict.set(chars);
      beastiaryDict.set(words);
    } catch (e) { console.error('Remove failed:', e); }
  }
</script>

<div class="card-wrapper" style="--card-rotate: {rotate}deg" onmouseenter={showMenu} onmouseleave={startHide}>
  {#if hovering}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="card-hover-menu" onmouseenter={cancelHide} onmouseleave={startHide}>
      {#if inBank}
        {#if mastered}
          <button class="h-btn h-gold" onclick={(e) => { e.stopPropagation(); markLearning(character); hovering = false; }}>Move to Learning</button>
        {:else}
          <button class="h-btn h-green" onclick={(e) => { e.stopPropagation(); markMastered(character); hovering = false; }}>Move to Learnt</button>
        {/if}
        <button class="h-btn h-remove" onclick={(e) => { e.stopPropagation(); handleRemove(); hovering = false; }}>Remove</button>
      {:else}
        <button class="h-btn h-green" onclick={(e) => { e.stopPropagation(); handleAdd(true); hovering = false; }}>Add to Learnt</button>
        <button class="h-btn h-gold" onclick={(e) => { e.stopPropagation(); handleAdd(false); hovering = false; }}>Add to Learning</button>
      {/if}
    </div>
  {/if}

  <button class="character-card" class:in-bank={inBank} {onclick} type="button">
    {#if inBank}
      <div class="lanyard"><div class="lanyard-strip"></div></div>
    {/if}
    {#if hskNumeral}
      <span class="hsk-badge">{hskNumeral}</span>
    {/if}
    <span class="character">{character}</span>
    {#if frequencyRank}
      <span class="freq-rank">#{frequencyRank}</span>
    {/if}
  </button>
</div>

<style>
  .card-wrapper {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
  }

  .card-hover-menu {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 6px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    z-index: 20;
    background: #fefeff;
    border: 1px solid #e0dce8;
    border-radius: 4px;
    padding: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  .h-btn {
    padding: 4px 10px;
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    font-weight: 600;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    white-space: nowrap;
    box-shadow: 0 2px 0 rgba(0,0,0,0.15);
    transition: all 0.1s;
    color: #fff;
    min-width: 95px;
    text-align: center;
  }

  .h-btn:active {
    transform: translateY(1px);
    box-shadow: 0 1px 0 rgba(0,0,0,0.15);
  }

  .h-green { background: #6bb5b0; box-shadow: 0 2px 0 #4a8a85; }
  .h-gold { background: #d4953a; box-shadow: 0 2px 0 #a0702a; }
  .h-remove { background: #e87d7d; box-shadow: 0 2px 0 #c06060; }

  .character-card {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 90px;
    height: 90px;
    background: #fefeff;
    background-image: radial-gradient(circle, #c8d4e4 0.6px, transparent 0.6px);
    background-size: 16px 16px;
    border: 1px solid #e0dce8;
    border-radius: 2px;
    box-shadow: 0 1px 0 #e0d8c8, 1px 2px 6px rgba(0,0,0,0.20), 2px 4px 12px rgba(0,0,0,0.08);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    transform: rotate(var(--card-rotate, 0deg));
    overflow: visible;
    padding: 0;
  }

  .card-wrapper:hover .character-card {
    transform: translateY(-3px) rotate(var(--card-rotate, 0deg));
    box-shadow: 0 1px 0 #e0d8c8, 2px 4px 10px rgba(0,0,0,0.25), 4px 8px 18px rgba(0,0,0,0.10);
  }

  .lanyard { position: absolute; top: -2px; left: 6px; z-index: 10; display: flex; flex-direction: column; align-items: center; }
  .lanyard-strip {
    width: 12px; height: 24px;
    background: linear-gradient(135deg, #c41e3a 0%, #d94a5a 30%, #c41e3a 50%, #9a1630 80%, #c41e3a 100%);
    clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2);
  }

  .hsk-badge {
    position: absolute; top: 2px; right: 5px;
    font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', 'SimKai', cursive;
    font-size: 22px; color: #c41e3a; opacity: 0.8; transform: rotate(4deg); line-height: 1; z-index: 2;
  }

  .character {
    font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', 'SimKai', cursive;
    font-size: 48px; color: #2d2d2d; line-height: 1; position: relative; z-index: 1;
  }

  .freq-rank {
    position: absolute; bottom: 3px; left: 0; right: 0; text-align: center;
    font-family: 'Inter', sans-serif; font-size: 9px; color: #bbbbbb; font-weight: 500; letter-spacing: 0.3px; z-index: 2;
  }
</style>
