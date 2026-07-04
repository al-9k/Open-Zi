<script lang="ts">
  import { onMount } from 'svelte';
  import { bankDict, openDictionary } from '$lib/stores';
  import { api } from '$lib/api';
  import CharacterCard from '$lib/components/CharacterCard.svelte';
  import Button3D from '$lib/components/Button3D.svelte';
  import type { DictionaryEntry } from '$lib/types';

  let allChars = $state<DictionaryEntry[]>([]);
  let loading = $state(true);

  const CHUNK_SIZE = 250;

  onMount(async () => {
    try {
      const [chars, dict] = await Promise.all([
        api.getCharacters(),
        api.getDictionary(),
      ]);
      bankDict.set(chars);
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

  const containers = $derived.by(() => {
    const chunks: DictionaryEntry[][] = [];
    for (let i = 0; i < allChars.length; i += CHUNK_SIZE) {
      chunks.push(allChars.slice(i, i + CHUNK_SIZE));
    }
    return chunks;
  });

  async function handleExport() {
    try {
      const csv = await api.exportAnki();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'openzi-export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      console.error('Export failed');
    }
  }
</script>

<div class="page">
  <div class="page-header">
    <h1 class="page-title">Character Codex</h1>
    <Button3D size="sm" variant="ghost" onclick={handleExport}>Export to Anki</Button3D>
  </div>

  {#if loading}
    <p class="loading-text">Loading dictionary...</p>
  {:else}
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
              {learnedCount(chunk)} learned
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

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .page-title {
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 36px;
    color: #2d2d2d;
    margin: 0;
    line-height: 1;
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

  .container {
    background: #ffffff;
    border: 1px solid #e8e5e0;
    border-radius: 2px;
    padding: 18px;
    box-shadow: 2px 3px 8px rgba(0, 0, 0, 0.04);
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
