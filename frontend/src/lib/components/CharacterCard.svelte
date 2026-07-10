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
    isMastered = undefined,
    showActions = true,
    onclick,
  }: {
    character: string;
    hsk?: number | null;
    frequencyRank?: number | null;
    inBank?: boolean;
    rotate?: number;
    isMastered?: boolean;
    showActions?: boolean;
    onclick?: () => void;
  } = $props();

  let hskNumeral = $derived(hskToChineseNumeral(hsk ?? null));
  let hovering = $state(false);
  let _mastered = $state(false);
  let hideTimer: ReturnType<typeof setTimeout> | null = $state(null);
  let mastered = $derived(isMastered !== undefined ? isMastered : _mastered);

  $effect(() => {
    if (isMastered === undefined && showActions) _mastered = $masteredChars.has(character);
  });

  function showMenu() {
    if (!showActions) return;
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    hovering = true;
  }
  function startHide() {
    if (!showActions) return;
    hideTimer = setTimeout(() => { hovering = false; }, 150);
  }
  function cancelHide() {
    if (!showActions) return;
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  }

  async function handleAdd(m: boolean) {
    try {
      await api.addCharacters(character);
      const [chars, words] = await Promise.all([api.getCharacters(), api.getWords()]);
      bankDict.set(chars); beastiaryDict.set(words);
      if (m) markMastered(character); else markLearning(character);
    } catch (e) {}
  }

  async function handleRemove() {
    try {
      await api.removeCharacter(character);
      markLearning(character);
      const [chars, words] = await Promise.all([api.getCharacters(), api.getWords()]);
      bankDict.set(chars); beastiaryDict.set(words);
    } catch (e) {}
  }
</script>

{#if showActions}
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
      {#if inBank}<div class="lanyard"><div class="lanyard-strip"></div></div>{/if}
      {#if hskNumeral}<span class="hsk-badge">{hskNumeral}</span>{/if}
      <span class="character">{character}</span>
      {#if frequencyRank}<span class="freq-rank">#{frequencyRank}</span>{/if}
    </button>
  </div>
{:else}
  <button class="character-card plain-card" class:in-bank={inBank} style="--card-rotate: {rotate}deg" {onclick} type="button">
    {#if inBank}<div class="lanyard"><div class="lanyard-strip"></div></div>{/if}
    {#if hskNumeral}<span class="hsk-badge">{hskNumeral}</span>{/if}
    <span class="character">{character}</span>
    {#if frequencyRank}<span class="freq-rank">#{frequencyRank}</span>{/if}
  </button>
{/if}

<style>
  .card-wrapper { position: relative; display: inline-flex; flex-direction: column; align-items: center; }

  .card-hover-menu {
    position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
    margin-bottom: 6px; display: flex; flex-direction: column; gap: 3px;
    z-index: 20; background: #2a2a2a; border: 1px solid #3a3a3a;
    padding: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  }

  .h-btn {
    padding: 4px 10px; font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 600;
    border: none; cursor: pointer; white-space: nowrap;
    color: #fff; min-width: 95px; text-align: center;
  }

  .h-btn:active { opacity: 0.85; }
  .h-green { background: #5a8a7a; }
  .h-gold { background: #b8863e; }
  .h-remove { background: #c41e3a; }

  .character-card {
    position: relative; display: flex; align-items: center; justify-content: center;
    width: 90px; height: 90px;
    background: #ffffff;
    border: 1px solid #e8e5e0;
    box-shadow: 0 1px 2px rgba(0,0,0,0.06);
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
    transform: rotate(var(--card-rotate, 0deg));
    overflow: visible; padding: 0;
  }

  .plain-card:hover,
  .card-wrapper:hover .character-card {
    transform: translateY(-3px) rotate(var(--card-rotate, 0deg));
    box-shadow: 0 4px 12px rgba(196,30,57,0.18);
    border-color: #c41e3a;
  }

  .lanyard { position: absolute; top: -2px; left: 6px; z-index: 10; display: flex; flex-direction: column; align-items: center; }
  .lanyard-strip {
    width: 12px; height: 20px;
    background: #c41e3a;
    clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%);
  }

  .hsk-badge {
    position: absolute; top: 2px; right: 4px;
    font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', 'SimKai', cursive;
    font-size: 20px; color: #c41e3a; opacity: 0.7;
    transform: rotate(4deg); line-height: 1; z-index: 2;
  }

  .character {
    font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', 'SimKai', cursive;
    font-size: 46px; color: #3a3a3a; line-height: 1; position: relative; z-index: 1;
  }

  .freq-rank {
    position: absolute; bottom: 3px; left: 0; right: 0; text-align: center;
    font-family: 'Inter', sans-serif; font-size: 9px; color: #b0aaa2; font-weight: 500;
    letter-spacing: 0.3px; z-index: 2;
  }
</style>
