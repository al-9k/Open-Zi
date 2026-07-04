<script lang="ts">
  import { onMount } from 'svelte';
  import { stats as statsStore, bankDict, beastiaryDict, openDictionary, navigateTo } from '$lib/stores';
  import { api } from '$lib/api';
  import { numericToAccented, hskToChineseNumeral, getToneNumber, getToneColor, splitPronunciations } from '$lib/utils';
  import ClipboardCard from '$lib/components/ClipboardCard.svelte';
  import Button3D from '$lib/components/Button3D.svelte';
  import LinedInput from '$lib/components/LinedInput.svelte';
  import CharacterCard from '$lib/components/CharacterCard.svelte';
  import type { StatsData, DictionaryEntry } from '$lib/types';

  let statsData = $state<StatsData | null>(null);
  let cotd = $state<DictionaryEntry | null>(null);
  let addText = $state('');
  let addMessage = $state('');
  let addMsgType = $state<'success' | 'error' | ''>('');
  let loading = $state(true);

  onMount(async () => {
    await Promise.all([loadStats(), loadCharOfDay()]);
    loading = false;
  });

  async function loadCharOfDay() {
    try {
      const dict = await api.getDictionary();
      const seed = new Date().toDateString().split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const idx = seed % dict.length;
      cotd = dict[idx];
    } catch (e) {
      console.error('Failed to load character of the day:', e);
    }
  }

  async function loadStats() {
    try {
      const data = await api.getStats();
      statsData = data;
      statsStore.set(data);
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }

  async function handleAdd() {
    const text = addText.trim();
    if (!text) return;
    try {
      const res = await api.addCharacters(text);
      const parts: string[] = [];
      if (res.added.length) parts.push(`Added: ${res.added.join('')}`);
      if (res.existed.length) parts.push(`Already in bank: ${res.existed.join('')}`);
      if (res.not_found.length) parts.push(`Not found: ${res.not_found.join('')}`);
      addMessage = parts.join(' | ');
      addMsgType = 'success';
      addText = '';
      await loadStats();
      const [chars, words] = await Promise.all([api.getCharacters(), api.getWords()]);
      bankDict.set(chars);
      beastiaryDict.set(words);
    } catch (e) {
      console.error('Add characters failed:', e);
      addMessage = 'Failed to add characters';
      addMsgType = 'error';
    }
  }

  async function handleSave() {
    await api.save();
  }

  async function handleLoad() {
    try {
      await api.load();
      await loadStats();
      const [chars, words] = await Promise.all([api.getCharacters(), api.getWords()]);
      bankDict.set(chars);
      beastiaryDict.set(words);
    } catch (e) {
      console.error('Load failed:', e);
    }
  }

  function handleAddKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleAdd();
  }

  // Get recently added chars from timeline
  function getRecentChars(): { char: string; hsk: number | null; frequencyRank: number | null }[] {
    if (!statsData?.char_timeline) return [];
    const entries: { char: string; date: string }[] = [];
    for (const [date, chars] of Object.entries(statsData.char_timeline)) {
      for (const char of chars) {
        entries.push({ char, date });
      }
    }
    entries.sort((a, b) => b.date.localeCompare(a.date));
    return entries.slice(0, 10).map(e => ({
      char: e.char,
      hsk: $bankDict[e.char]?.hsk ?? null,
      frequencyRank: $bankDict[e.char]?.frequency_rank ?? null,
    }));
  }
</script>

<div class="page">
  {#if loading}
    <p class="text-ink-grey text-sm">Loading...</p>
  {:else}
    <!-- Stats row - clipped to clipboard -->
    <div class="stats-row">
      <ClipboardCard title="Characters in Bank" rotate={-1.5}>
        <span class="stat-number">{statsData?.char_count ?? 0}</span>
      </ClipboardCard>
      <ClipboardCard title="Words Unlocked" rotate={0.8}>
        <span class="stat-number">{statsData?.word_count ?? 0}</span>
      </ClipboardCard>
      <ClipboardCard title="Dictionary Size" rotate={-0.5}>
        <span class="stat-number">{statsData?.dictionary_count ?? 0}</span>
      </ClipboardCard>
    </div>

    <!-- Save / Load -->
    <div class="actions-row">
      <Button3D size="sm" variant="teal" onclick={handleSave}>Save</Button3D>
      <Button3D size="sm" variant="coral" onclick={handleLoad}>Load</Button3D>
    </div>

    <!-- Character of the Day -->
    {#if cotd}
      <div class="section">
        <h2 class="section-title">Character of the Day</h2>
        <button class="cotd-card" onclick={() => openDictionary(cotd.character, false)}>
          <span class="cotd-char">{cotd.character}</span>
          <div class="cotd-info">
            <div class="cotd-pinyin">
              {#each splitPronunciations(cotd.pinyin, cotd.definition) as pron, pi}
                {#if pi === 0}
                  {#each pron.pinyin.split(' ').filter(Boolean) as syl, si}
                    {#if si > 0}{' '}{/if}
                    <span style="color:{getToneColor(getToneNumber(syl))}">{numericToAccented(syl)}</span>
                    <span class="cotd-num">({syl.toLowerCase()})</span>
                  {/each}
                {/if}
              {/each}
            </div>
            <p class="cotd-def">
              {#each splitPronunciations(cotd.pinyin, cotd.definition) as pron, pi}
                {#if pi === 0}
                  {pron.definition.split('; ').filter(Boolean).join(' • ')}
                {/if}
              {/each}
              {#if splitPronunciations(cotd.pinyin, cotd.definition).length > 1}
                <span class="cotd-more">+{splitPronunciations(cotd.pinyin, cotd.definition).length - 1} more</span>
              {/if}
            </p>
            <div class="cotd-meta">
              {#if cotd.frequency_rank}
                <span class="cotd-rank">#{cotd.frequency_rank}</span>
              {/if}
              {#if cotd.hsk}
                <span class="cotd-hsk">HSK {cotd.hsk}</span>
              {/if}
            </div>
          </div>
        </button>
      </div>
    {/if}

    <!-- Quick Add -->
    <div class="section">
      <h2 class="section-title">Quick Add</h2>
      <div class="quick-add">
        <div class="add-input-wrap">
          <LinedInput
            bind:value={addText}
            placeholder="Type characters to add..."
            onkeydown={handleAddKeydown}
          />
        </div>
        <Button3D size="md" variant="coral" onclick={handleAdd}>Add Characters</Button3D>
      </div>
      {#if addMessage}
        <p class="add-message" class:error={addMsgType === 'error'}>{addMessage}</p>
      {/if}
    </div>

    <!-- Recently Added -->
    <div class="section">
      <h2 class="section-title">Recently Added</h2>
      <div class="recent-grid">
        {#each getRecentChars() as entry}
          {@const rot = ((entry.char.charCodeAt(0) * 7) % 3) - 1}
          <CharacterCard
            character={entry.char}
            hsk={entry.hsk}
            frequencyRank={entry.frequencyRank}
            inBank={true}
            rotate={rot}
            onclick={() => openDictionary(entry.char, false)}
          />
        {/each}
      </div>
      {#if getRecentChars().length === 0}
        <p class="empty-text">Add characters above to get started!</p>
      {/if}
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
    gap: 24px;
  }

  .stats-row {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }

  .stat-number {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 42px;
    font-weight: 700;
    color: #2d2d2d;
    display: block;
  }

  .actions-row {
    display: flex;
    gap: 10px;
  }

  .section {
    background: #ffffff;
    border: 1px solid #e8e5e0;
    border-radius: 2px;
    padding: 20px;
    box-shadow: 2px 3px 8px rgba(0, 0, 0, 0.06);
  }

  .section-title {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #888888;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    margin: 0 0 16px;
  }

  /* Character of the Day */
  .cotd-card {
    display: flex;
    gap: 20px;
    align-items: flex-start;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    width: 100%;
    padding: 0;
  }

  .cotd-char {
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 80px;
    color: #2d2d2d;
    line-height: 1;
    flex-shrink: 0;
  }

  .cotd-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 8px;
    min-width: 0;
  }

  .cotd-pinyin {
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 600;
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0;
  }

  .cotd-num {
    font-size: 11px;
    font-weight: 400;
    color: #bbbbbb;
    margin-right: 5px;
  }

  .cotd-def {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #555555;
    line-height: 1.6;
    margin: 0;
  }

  .cotd-more {
    font-size: 11px;
    color: #e87d7d;
    font-style: italic;
  }

  .cotd-meta {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .cotd-rank {
    font-size: 11px;
    color: #bbbbbb;
    font-family: 'Inter', sans-serif;
  }

  .cotd-hsk {
    font-size: 11px;
    color: #c41e3a;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
  }

  /* Quick add */
  .quick-add {
    display: flex;
    gap: 12px;
    align-items: flex-end;
  }

  .add-input-wrap {
    flex: 1;
    max-width: 340px;
  }

  .add-message {
    margin-top: 10px;
    font-size: 13px;
    color: #6bb5b0;
    font-family: 'Inter', sans-serif;
  }

  .add-message.error {
    color: #e87d7d;
  }

  /* Recently added */
  .recent-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .empty-text {
    font-size: 13px;
    color: #bbbbbb;
    font-style: italic;
    font-family: 'Inter', sans-serif;
  }
</style>
