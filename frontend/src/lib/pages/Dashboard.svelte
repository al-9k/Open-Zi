<script lang="ts">
  import { onMount } from 'svelte';
  import { stats as statsStore, bankDict, beastiaryDict, openDictionary, navigateTo, masteredChars } from '$lib/stores';
  import { api } from '$lib/api';
  import { numericToAccented, getToneNumber, getToneColor, splitPronunciations, computeCoverage } from '$lib/utils';
  import CharacterCard from '$lib/components/CharacterCard.svelte';
  import AddBar from '$lib/components/AddBar.svelte';
  import type { StatsData, DictionaryEntry } from '$lib/types';

  let statsData = $state<StatsData | null>(null);
  let cotd = $state<DictionaryEntry | null>(null);
  let addText = $state('');
  let addMessage = $state('');
  let addMsgType = $state<'success' | 'error' | ''>('');
  let loading = $state(true);

  let learntCoverage = $derived.by(() => {
    const mastered = $masteredChars;
    const learnt: Record<string, { char_rank?: number | null }> = {};
    for (const [char, data] of Object.entries($bankDict)) {
      if (mastered.has(char)) learnt[char] = data;
    }
    return computeCoverage(learnt);
  });

  onMount(async () => {
    await Promise.all([loadStats(), loadCharOfDay()]);
    loading = false;
  });

  async function loadCharOfDay() {
    try {
      const dict = await api.getDictionary();
      const seed = new Date().toDateString().split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      cotd = dict[seed % dict.length];
    } catch (e) { console.error(e); }
  }

  async function loadStats() {
    try {
      const data = await api.getStats();
      statsData = data;
      statsStore.set(data);
    } catch (e) { console.error(e); }
  }

  async function handleAdd() {
    const text = addText.trim();
    if (!text) return;
    try {
      const res = await api.addCharacters(text);
      const parts: string[] = [];
      if (res.added.length) parts.push(`Added: ${res.added.join('')}`);
      if (res.existed.length) parts.push(`Already in bank: ${res.existed.join('')}`);
      addMessage = parts.join(' | ');
      addMsgType = 'success';
      addText = '';
      await loadStats();
      const [chars, words] = await Promise.all([api.getCharacters(), api.getWords()]);
      bankDict.set(chars); beastiaryDict.set(words);
    } catch (e) { addMessage = 'Failed'; addMsgType = 'error'; }
  }

  function getRecentChars() {
    if (!statsData?.char_timeline) return [];
    const entries: { char: string; date: string }[] = [];
    for (const [date, chars] of Object.entries(statsData.char_timeline))
      for (const char of chars) entries.push({ char, date });
    entries.sort((a, b) => b.date.localeCompare(a.date));
    return entries.slice(0, 10).map(e => ({
      char: e.char, hsk: $bankDict[e.char]?.hsk ?? null,
      frequencyRank: $bankDict[e.char]?.frequency_rank ?? null,
    }));
  }
</script>

<div class="page">
  {#if loading}
    <slot name="loading"><p class="text-muted">Loading...</p></slot>
  {:else}
    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-number">{statsData?.char_count ?? 0}</span>
        <span class="stat-label">Characters</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">{statsData?.word_count ?? 0}</span>
        <span class="stat-label">Words</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">{statsData?.dictionary_count ?? 0}</span>
        <span class="stat-label">Dictionary</span>
      </div>
    </div>

    <!-- Coverage -->
    <div class="section">
      <h2 class="section-title">Text Coverage</h2>
      <div class="coverage-bar-wrap">
        <div class="coverage-bar"><div class="coverage-fill" style="width: {learntCoverage}%"></div></div>
        <span class="coverage-pct">{learntCoverage}%</span>
      </div>
      <p class="coverage-sub">Based on HanziCraft frequency data</p>
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
                {#if pi === 0}{pron.definition.split('; ').filter(Boolean).join(' • ')}{/if}
              {/each}
              {#if splitPronunciations(cotd.pinyin, cotd.definition).length > 1}
                <span class="cotd-more">+{splitPronunciations(cotd.pinyin, cotd.definition).length - 1} more</span>
              {/if}
            </p>
            <div class="cotd-meta">
              {#if cotd.frequency_rank}<span class="cotd-rank">#{cotd.frequency_rank}</span>{/if}
              {#if cotd.hsk}<span class="cotd-hsk">HSK {cotd.hsk}</span>{/if}
            </div>
          </div>
        </button>
      </div>
    {/if}

    <!-- Quick Add -->
    <div class="section">
      <h2 class="section-title">Quick Add</h2>
      <AddBar bind:value={addText} onsubmit={handleAdd} />
      {#if addMessage}<p class="add-message" class:error={addMsgType === 'error'}>{addMessage}</p>{/if}
    </div>

    <!-- Recently Added -->
    <div class="section">
      <h2 class="section-title">Recently Added</h2>
      <div class="recent-grid">
        {#each getRecentChars() as entry}
          {@const rot = ((entry.char.charCodeAt(0) * 7) % 3) - 1}
          <CharacterCard character={entry.char} hsk={entry.hsk} frequencyRank={entry.frequencyRank} inBank={true} rotate={rot} onclick={() => openDictionary(entry.char, false)} />
        {/each}
      </div>
      {#if getRecentChars().length === 0}<p class="empty-text">Add characters above to get started!</p>{/if}
    </div>
  {/if}
</div>

<style>
  .page { flex: 1; min-height: 0; padding: 36px; display: flex; flex-direction: column; gap: 28px; }
  .text-muted { font-size: 14px; color: #b0aaa2; font-family: 'Inter', sans-serif; }

  .stats-row { display: flex; gap: 16px; }
  .stats-row > * { flex: 1; }

  .stat-card {
    background: #ffffff;
    border: 1px solid #e8e5e0;
    padding: 20px 24px;
    display: flex; flex-direction: column; gap: 4px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  }
  .stat-number { font-family: 'Inter', sans-serif; font-size: 36px; font-weight: 700; color: #3a3a3a; }
  .stat-label { font-family: 'Inter', sans-serif; font-size: 12px; color: #b0aaa2; font-weight: 500; text-transform: uppercase; letter-spacing: 0.8px; }

  .section {
    background: #ffffff;
    border: 1px solid #e8e5e0;
    padding: 24px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  }
  .section-title { font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600; color: #b0aaa2; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px; }

  .coverage-bar-wrap { display: flex; align-items: center; gap: 16px; }
  .coverage-bar { flex: 1; height: 8px; background: #f0ede8; overflow: hidden; }
  .coverage-fill { height: 100%; background: #c41e3a; transition: width 0.6s ease; }
  .coverage-pct { font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 700; color: #3a3a3a; min-width: 50px; }
  .coverage-sub { font-size: 11px; color: #b0aaa2; font-family: 'Inter', sans-serif; margin: 8px 0 0; }

  .cotd-card { display: flex; gap: 20px; align-items: flex-start; background: none; border: none; cursor: pointer; text-align: left; width: 100%; padding: 0; }
  .cotd-char { font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', 'SimKai', cursive; font-size: 80px; color: #3a3a3a; line-height: 1; flex-shrink: 0; }
  .cotd-info { display: flex; flex-direction: column; gap: 6px; padding-top: 6px; min-width: 0; }
  .cotd-pinyin { font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600; display: flex; align-items: baseline; flex-wrap: wrap; }
  .cotd-num { font-size: 11px; font-weight: 400; color: #b0aaa2; margin-right: 5px; }
  .cotd-def { font-family: 'Inter', sans-serif; font-size: 14px; color: #6a6560; line-height: 1.6; margin: 0; }
  .cotd-more { font-size: 11px; color: #c41e3a; font-style: italic; }
  .cotd-meta { display: flex; gap: 12px; align-items: center; }
  .cotd-rank { font-size: 11px; color: #b0aaa2; font-family: 'Inter', sans-serif; }
  .cotd-hsk { font-size: 11px; color: #c41e3a; font-family: 'Inter', sans-serif; font-weight: 600; }

  .add-message { margin-top: 10px; font-size: 13px; color: #5a8a7a; font-family: 'Inter', sans-serif; }
  .add-message.error { color: #c41e3a; }

  .recent-grid { display: flex; flex-wrap: wrap; gap: 12px; }
  .empty-text { font-size: 13px; color: #b0aaa2; font-style: italic; font-family: 'Inter', sans-serif; }
</style>
