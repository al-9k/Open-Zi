<script lang="ts">
  import { onMount } from 'svelte';
  import { stats as statsStore, bankDict, beastiaryDict, openDictionary, navigateTo } from '$lib/stores';
  import { api } from '$lib/api';
  import { numericToAccented, hskToChineseNumeral } from '$lib/utils';
  import ClipboardCard from '$lib/components/ClipboardCard.svelte';
  import Button3D from '$lib/components/Button3D.svelte';
  import LinedInput from '$lib/components/LinedInput.svelte';
  import type { StatsData } from '$lib/types';

  let statsData = $state<StatsData | null>(null);
  let addText = $state('');
  let addMessage = $state('');
  let addMsgType = $state<'success' | 'error' | ''>('');
  let loading = $state(true);

  onMount(async () => {
    await loadStats();
    loading = false;
  });

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
  function getRecentChars(): { char: string; date: string }[] {
    if (!statsData?.char_timeline) return [];
    const entries: { char: string; date: string }[] = [];
    for (const [date, chars] of Object.entries(statsData.char_timeline)) {
      for (const char of chars) {
        entries.push({ char, date });
      }
    }
    entries.sort((a, b) => b.date.localeCompare(a.date));
    return entries.slice(0, 10);
  }

  const hskLevels = [1, 2, 3, 4, 5, 6];
  const hskNumerals = ['一', '二', '三', '四', '五', '六'];
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

    <!-- HSK Breakdown -->
    <div class="section">
      <h2 class="section-title">HSK Breakdown</h2>
      <div class="hsk-bars">
        {#each hskLevels as level}
          {@const charsCount = statsData?.hsk_chars?.[String(level)] ?? 0}
          {@const wordsCount = statsData?.hsk_words?.[String(level)] ?? 0}
          {@const maxVal = Math.max(
            ...Object.values(statsData?.hsk_chars ?? {}).map(Number),
            ...Object.values(statsData?.hsk_words ?? {}).map(Number),
            1
          )}
          <div class="hsk-row">
            <span class="hsk-label">HSK {hskNumerals[level - 1]}</span>
            <div class="hsk-bar-track">
              <div
                class="hsk-bar-fill chars"
                style="width: {(charsCount / maxVal) * 100}%"
              ></div>
            </div>
            <span class="hsk-count">{charsCount} chars</span>
            <div class="hsk-bar-track">
              <div
                class="hsk-bar-fill words"
                style="width: {(wordsCount / maxVal) * 100}%"
              ></div>
            </div>
            <span class="hsk-count">{wordsCount} words</span>
          </div>
        {/each}
      </div>
    </div>

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
          <button
            class="recent-char"
            onclick={() => openDictionary(entry.char, false)}
          >
            <span class="recent-char-text">{entry.char}</span>
          </button>
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

  /* HSK bars */
  .hsk-bars {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .hsk-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .hsk-label {
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 18px;
    color: #c41e3a;
    min-width: 50px;
    opacity: 0.8;
  }

  .hsk-bar-track {
    flex: 1;
    height: 12px;
    background: #f0ece5;
    border-radius: 6px;
    overflow: hidden;
    max-width: 120px;
  }

  .hsk-bar-fill {
    height: 100%;
    border-radius: 6px;
    transition: width 0.5s ease;
  }

  .hsk-bar-fill.chars {
    background: linear-gradient(90deg, #e87d7d, #f0a8a8);
  }

  .hsk-bar-fill.words {
    background: linear-gradient(90deg, #6bb5b0, #8ecfcb);
  }

  .hsk-count {
    font-size: 12px;
    color: #888888;
    min-width: 65px;
    text-align: right;
    font-family: 'Inter', sans-serif;
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
    gap: 10px;
  }

  .recent-char {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #faf7f2;
    border: 1px solid #e8e3da;
    border-radius: 2px;
    cursor: pointer;
    box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.06);
    transition: transform 0.15s, box-shadow 0.15s;
  }

  .recent-char:hover {
    transform: translateY(-2px);
    box-shadow: 2px 4px 8px rgba(0, 0, 0, 0.10);
  }

  .recent-char-text {
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 26px;
    color: #2d2d2d;
  }

  .empty-text {
    font-size: 13px;
    color: #bbbbbb;
    font-style: italic;
    font-family: 'Inter', sans-serif;
  }
</style>
