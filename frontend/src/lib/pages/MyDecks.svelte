<script lang="ts">
  import LoadingScreen from '$lib/components/LoadingScreen.svelte';
  import { onMount } from 'svelte';
  import { bankDict, beastiaryDict, openDictionary } from '$lib/stores';
  import { api } from '$lib/api';
  import CharacterCard from '$lib/components/CharacterCard.svelte';
  import type { DictionaryEntry } from '$lib/types';

  let allChars = $state<DictionaryEntry[]>([]);
  let loading = $state(true);

  const CHUNK_SIZE = 250;
  const hskNumerals = ['一', '二', '三', '四', '五', '六'];

  onMount(async () => {
    try {
      const [chars, words, dict] = await Promise.all([
        api.getCharacters(),
        api.getWords(),
        api.getDictionary(),
      ]);
      bankDict.set(chars);
      beastiaryDict.set(words);
      allChars = dict;
    } catch (e) {
      console.error('Failed to load dictionary:', e);
    } finally {
      loading = false;
    }
  });

  function isInBank(char: string): boolean {
    return char in $bankDict;
  }

  function learnedCount(chunk: DictionaryEntry[]): number {
    return chunk.filter(e => isInBank(e.character)).length;
  }

  function hskProgress(level: number): { learned: number; total: number } {
    let learned = 0;
    let total = 0;
    for (const [, d] of Object.entries($bankDict)) { if (d.hsk === level) { total++; learned++; } }
    for (const [, d] of Object.entries($beastiaryDict)) { if (d.hsk === level) { total++; learned++; } }
    for (const e of allChars) { if (e.hsk === level) total++; }
    return { learned, total };
  }

  const containers = $derived.by(() => {
    const chunks: DictionaryEntry[][] = [];
    for (let i = 0; i < allChars.length; i += CHUNK_SIZE) {
      chunks.push(allChars.slice(i, i + CHUNK_SIZE));
    }
    return chunks;
  });
</script>

<div class="page">

  {#if loading}
    <LoadingScreen />
  {:else}
    <div class="hsk-summary">
      {#each [1, 2, 3, 4, 5, 6] as lv}
        {@const p = hskProgress(lv)}
        {@const pct = p.total > 0 ? (p.learned / p.total) * 100 : 0}
        <div class="hsk-item">
          <span class="hsk-label">{hskNumerals[lv - 1]}</span>
          <div class="hsk-bar"><div class="hsk-fill" style="width:{pct}%"></div></div>
          <span class="hsk-count">{p.learned}/{p.total}</span>
        </div>
      {/each}
    </div>
    <div class="containers">
      {#each containers as chunk, ci}
        <div class="container">
          <div class="container-header">
            <span class="container-range">
              #{chunk[0]?.frequency_rank}–#{chunk[chunk.length - 1]?.frequency_rank}
            </span>
            <span class="container-label">
              {chunk.length} characters
            </span>
            <span class="container-progress">
              {learnedCount(chunk)}/{chunk.length} Learned
            </span>
          </div>
          <div class="card-grid">
            {#each chunk as entry}
              {@const rot = ((entry.character.charCodeAt(0) * 7) % 3) - 1}
              <CharacterCard
                character={entry.character}
                hsk={entry.hsk}
                frequencyRank={entry.frequency_rank}
                inBank={isInBank(entry.character)}
                rotate={rot}
                onclick={() => openDictionary(entry.character, false)}
              />
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .page {
    flex: 1;
    min-height: 0;
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .loading-text {
    font-size: 14px;
    color: #888888;
    font-family: 'Inter', sans-serif;
  }

  .containers {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .hsk-summary {
    position: relative;
    display: flex;
    gap: 12px;
    background: #fefeff;
    
    
    border: none;
    border-radius: 0;
    padding: 14px 18px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  }

  .hsk-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'Inter', sans-serif;
    flex: 1;
    min-width: 0;
  }

  .hsk-label {
    font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', 'SimKai', cursive;
    font-size: 18px;
    color: #c41e3a;
    line-height: 1;
    flex-shrink: 0;
  }

  .hsk-bar {
    flex: 1;
    height: 5px;
    background: #f0ece5;
    border-radius: 3px;
    overflow: hidden;
    min-width: 0;
  }

  .hsk-fill {
    height: 100%;
    background: linear-gradient(90deg, #e87d7d, #f0a8a8);
    border-radius: 3px;
    transition: width 0.5s;
  }

  .hsk-count {
    font-size: 11px;
    font-weight: 600;
    color: #2d2d2d;
  }

  .container {
    position: relative;
    background: #fefeff;
    
    
    border: none;
    border-radius: 0;
    padding: 18px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  }

  .container-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f0ece5;
  }

  .container-range {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #2d2d2d;
  }

  .container-label {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    color: #bbbbbb;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .container-progress {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: #6bb5b0;
    margin-left: auto;
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, 90px);
    gap: 12px;
    justify-content: space-between;
  }
</style>
