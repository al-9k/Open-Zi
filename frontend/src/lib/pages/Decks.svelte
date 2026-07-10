<script lang="ts">
  import LoadingScreen from '$lib/components/LoadingScreen.svelte';
  import { onMount } from 'svelte';
  import { bankDict, beastiaryDict, openDictionary, masteredChars, markMastered, markLearning } from '$lib/stores';
  import CharacterCard from '$lib/components/CharacterCard.svelte';

  let learning: { char: string; hsk: number | null; frequencyRank: number | null }[] = $state([]);
  let learnt: { char: string; hsk: number | null; frequencyRank: number | null }[] = $state([]);
  let loading = $state(true);

  onMount(async () => {
    try {
      const [chars, words] = await Promise.all([api.getCharacters(), api.getWords()]);
      bankDict.set(chars);
      beastiaryDict.set(words);
      buildColumns(chars);
    } catch (e) {
      console.error('Failed to load:', e);
    } finally {
      loading = false;
    }
  });

  function buildColumns(chars: Record<string, import('$lib/types').CharacterData>) {
    const lc: typeof learning = [];
    const lt: typeof learnt = [];
    for (const [char, data] of Object.entries(chars)) {
      if ($masteredChars.has(char)) {
        lt.push({ char, hsk: data.hsk, frequencyRank: data.frequency_rank });
      } else {
        lc.push({ char, hsk: data.hsk, frequencyRank: data.frequency_rank });
      }
    }
    learning = lc;
    learnt = lt;
  }

  function refreshColumns() {
    buildColumns($bankDict);
  }

  $effect(() => {
    $bankDict; $masteredChars;
    buildColumns($bankDict);
  });
</script>

<div class="page">
  {#if loading}
    <LoadingScreen />
  {:else}
    <div class="kanban">
      <!-- Learning column -->
      <div class="column" style="background:#fef8ec;border:3px solid #2a2a2a;box-shadow:3px 3px 0 #1a1a1a;">
        <div class="column-header">
          <span class="column-dot learning-dot"></span>
          <span class="column-title">Learning</span>
          <span class="column-count">{learning.length}</span>
        </div>
        <div class="column-cards">
          {#each learning as card}
            {@const rot = ((card.char.charCodeAt(0) * 7) % 3) - 1}
            <div class="kanban-card">
              <CharacterCard
                character={card.char}
                hsk={card.hsk}
                frequencyRank={card.frequencyRank}
                inBank={true}
                rotate={rot}
                onclick={() => openDictionary(card.char, false)}
              />

            </div>
          {/each}
          {#if learning.length === 0}
            <p class="empty-col">All done!</p>
          {/if}
        </div>
      </div>

      <!-- Learnt column -->
      <div class="column" style="background:#eaf6ef;border:3px solid #2a2a2a;box-shadow:3px 3px 0 #1a1a1a;">
        <div class="column-header">
          <span class="column-dot learnt-dot"></span>
          <span class="column-title">Learnt</span>
          <span class="column-count">{learnt.length}</span>
        </div>
        <div class="column-cards">
          {#each learnt as card}
            {@const rot = ((card.char.charCodeAt(0) * 7) % 3) - 1}
            <div class="kanban-card">
              <CharacterCard
                character={card.char}
                hsk={card.hsk}
                frequencyRank={card.frequencyRank}
                inBank={true}
                rotate={rot}
                onclick={() => openDictionary(card.char, false)}
              />

            </div>
          {/each}
          {#if learnt.length === 0}
            <p class="empty-col">Nothing mastered yet</p>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .page {
    flex: 1;
    min-height: 0;
    padding: 32px;
    display: flex;
  }

  .loading-text {
    font-size: 14px;
    color: #888888;
    font-family: 'Inter', sans-serif;
  }

  .kanban {
    display: flex;
    gap: 24px;
    flex: 1;
    min-height: 0;
  }

  .column {
    flex: 1;
    background: #fefeff;
    
    
    border: none;
    border-radius: 0;
    padding: 16px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
  }

  .column-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 12px;
    margin-bottom: 12px;
    border-bottom: 2px solid #2a2a2a;
    flex-shrink: 0;
  }

  

  

  .column-title {
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: #2d2d2d;
  }

  .column-count {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: #bbbbbb;
    margin-left: auto;
  }

  .column-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, 90px);
    gap: 10px;
    justify-content: space-between;
    align-content: start;
    flex: 1;
    padding-top: 32px;
    min-height: 0;
  }

  .kanban-card {
    position: relative;
  }



  .empty-col {
    font-size: 13px;
    color: #bbbbbb;
    font-style: italic;
    font-family: 'Inter', sans-serif;
    text-align: center;
    padding: 40px 0;
    width: 100%;
  }
</style>
