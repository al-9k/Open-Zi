<script lang="ts">
  import { hskToChineseNumeral } from '$lib/utils';
  import { bankDict, beastiaryDict, masteredChars, markMastered, markLearning } from '$lib/stores';
  import { api } from '$lib/api';

  let {
    character, hsk, frequencyRank, inBank = true, rotate = 0,
    isMastered = undefined, showActions = true, onclick,
  }: {
    character: string; hsk?: number | null; frequencyRank?: number | null;
    inBank?: boolean; rotate?: number; isMastered?: boolean; showActions?: boolean;
    onclick?: () => void;
  } = $props();

  let hskNumeral = $derived(hskToChineseNumeral(hsk ?? null));
  let hovering = $state(false);
  let _mastered = $state(false);
  let hideTimer: ReturnType<typeof setTimeout> | null = $state(null);
  let mastered = $derived(isMastered !== undefined ? isMastered : _mastered);

  $effect(() => { if (isMastered === undefined && showActions) _mastered = $masteredChars.has(character); });

  function showMenu() { if (!showActions) return; if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } hovering = true; }
  function startHide() { if (!showActions) return; hideTimer = setTimeout(() => { hovering = false; }, 150); }
  function cancelHide() { if (!showActions) return; if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } }

  async function handleAdd(m: boolean) {
    try { await api.addCharacters(character); const [c,w] = await Promise.all([api.getCharacters(),api.getWords()]); bankDict.set(c);beastiaryDict.set(w); if(m)markMastered(character);else markLearning(character); } catch(e){}
  }
  async function handleRemove() {
    try { await api.removeCharacter(character); markLearning(character); const [c,w] = await Promise.all([api.getCharacters(),api.getWords()]); bankDict.set(c);beastiaryDict.set(w); } catch(e){}
  }
</script>

{#if showActions}
  <div class="card-wrap" style="--r:{rotate}deg" onmouseenter={showMenu} onmouseleave={startHide}>
    {#if hovering}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="card-menu" onmouseenter={cancelHide} onmouseleave={startHide}>
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
    <button class="card {inBank ? '' : 'caught'}" class:caught={!inBank} {onclick} type="button">
      {#if hskNumeral}<span class="card-hsk">{hskNumeral}</span>{/if}
      {#if inBank}<span class="card-caught">✓</span>{/if}
      <span class="card-char">{character}</span>
      {#if frequencyRank}<span class="card-rank">#{frequencyRank}</span>{/if}
    </button>
  </div>
{:else}
  <button class="card {inBank ? '' : 'caught'}" class:caught={!inBank} style="--r:{rotate}deg" {onclick} type="button">
    {#if hskNumeral}<span class="card-hsk">{hskNumeral}</span>{/if}
    {#if inBank}<span class="card-caught">✓</span>{/if}
    <span class="card-char">{character}</span>
    {#if frequencyRank}<span class="card-rank">#{frequencyRank}</span>{/if}
  </button>
{/if}

<style>
  .card-wrap { position: relative; display: inline-flex; flex-direction: column; align-items: center; }

  .card-menu {
    position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
    margin-bottom: 6px; display: flex; flex-direction: column; gap: 3px;
    z-index: 20; background: #1a1a1a; border: 2px solid #c41e3a;
    padding: 4px;
  }

  .h-btn {
    padding: 4px 10px; font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 600;
    border: none; cursor: pointer; white-space: nowrap; color: #fff; min-width: 95px; text-align: center;
  }
  .h-btn:active { opacity: 0.8; }
  .h-green { background: #2a8a4a; }
  .h-gold { background: #d4952a; }
  .h-remove { background: #c41e3a; }

  .card {
    position: relative; display: flex; align-items: center; justify-content: center;
    width: 90px; height: 90px;
    background: #ffffff;
    border: 3px solid #2a2a2a;
    box-shadow: 3px 3px 0 #1a1a1a;
    cursor: pointer;
    transition: transform 0.1s ease, box-shadow 0.1s ease;
    transform: rotate(var(--r, 0deg));
    overflow: visible; padding: 0;
  }

  .card.caught { opacity: 0.55; filter: grayscale(0.6); }

  .card-wrap:hover .card { transform: translateY(-3px) rotate(var(--r, 0deg)); box-shadow: 5px 5px 0 #c41e3a; border-color: #c41e3a; }
  .plain-card:hover { transform: translateY(-3px) rotate(var(--r, 0deg)); box-shadow: 5px 5px 0 #c41e3a; border-color: #c41e3a; }

  .card-caught {
    position: absolute; top: 2px; left: 4px;
    font-size: 10px; color: #2a8a4a; font-weight: 700; z-index: 2;
  }

  .card-hsk {
    position: absolute; top: 2px; right: 3px;
    font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', 'SimKai', cursive;
    font-size: 18px; color: #c41e3a; opacity: 0.8;
    transform: rotate(4deg); line-height: 1; z-index: 2;
  }

  .card-char {
    font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', 'SimKai', cursive;
    font-size: 44px; color: #1a1a1a; line-height: 1; position: relative; z-index: 1;
  }

  .card-rank {
    position: absolute; bottom: 2px; left: 0; right: 0; text-align: center;
    font-family: 'Inter', sans-serif; font-size: 8px; color: #9a9590; font-weight: 700;
    letter-spacing: 0.3px; z-index: 2;
  }
</style>
