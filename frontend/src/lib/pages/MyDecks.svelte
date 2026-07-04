<script lang="ts">
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
    <p class="loading-text">Loading dictionary...</p>
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
    display: flex;
    gap: 12px;
    background: #f5f0e3;
    background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    background-size: 200px 200px;
    border: none;
    border-radius: 2px;
    padding: 14px 18px;
    box-shadow: 0 1px 0 #e0d8c8, 2px 3px 10px rgba(0, 0, 0, 0.25), 4px 6px 18px rgba(0, 0, 0, 0.10);
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
    font-family: 'Ma Shan Zheng', cursive;
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
    background: #f5f0e3;
    background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    background-size: 200px 200px;
    border: none;
    border-radius: 2px;
    padding: 18px;
    box-shadow: 0 1px 0 #e0d8c8, 2px 3px 10px rgba(0, 0, 0, 0.25), 4px 6px 18px rgba(0, 0, 0, 0.10);
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
