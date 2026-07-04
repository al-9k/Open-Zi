<script lang="ts">
  import { onMount } from 'svelte';
  import { dictionaryTarget, navigateTo, bankDict, beastiaryDict } from '$lib/stores';
  import { api } from '$lib/api';
  import { numericToAccented, splitPronunciations, getToneNumber, getToneColor } from '$lib/utils';
  import Button3D from '$lib/components/Button3D.svelte';
  import type { CharacterData, WordData, BankDict, BeastiaryDict } from '$lib/types';

  let text = $state('');
  let isWord = $state(false);
  let charData = $state<CharacterData | null>(null);
  let wordData = $state<WordData | null>(null);
  let inBank = $state(false);
  let loading = $state(true);
  let removeMsg = $state('');
  let componentChars = $state<{ char: string; pinyin: string; definition: string; hsk: number | null }[]>([]);

  // Find unlocked words containing this character
  let unlockedWords = $state<{ word: string; data: WordData }[]>([]);

  onMount(async () => {
    const target = $dictionaryTarget;
    if (!target) {
      navigateTo('dashboard');
      return;
    }
    text = target.text;
    isWord = target.isWord;

    await loadData();
  });

  async function loadData() {
    loading = true;
    try {
      const [chars, words] = await Promise.all([
        api.getCharacters(),
        api.getWords(),
      ]);

      bankDict.set(chars);
      beastiaryDict.set(words);

      if (isWord) {
        wordData = words[text] ?? null;
        inBank = [...text].some((c) => c in chars);

        // Load component characters
        const comps: typeof componentChars = [];
        for (const c of text) {
          const bankEntry = chars[c];
          if (bankEntry) {
            comps.push({ char: c, pinyin: bankEntry.pinyin, definition: bankEntry.definition, hsk: bankEntry.hsk });
          } else {
            try {
              const entry = await api.getCharacter(c);
              if (entry.pinyin) comps.push({ char: c, pinyin: entry.pinyin, definition: entry.definition, hsk: entry.hsk });
            } catch { /* skip */ }
          }
        }
        componentChars = comps;
      } else {
        charData = chars[text] ?? null;
        inBank = text in chars;

        // Fallback: look up in full dictionary if not in bank
        if (!charData) {
          try {
            const entry = await api.getCharacter(text);
            if (entry.pinyin) {
              charData = entry as CharacterData;
            }
          } catch { /* ignore */ }
        }

        // Find words containing this character
        if (inBank) {
          unlockedWords = Object.entries(words)
            .filter(([word]) => word.includes(text))
            .map(([word, data]) => ({ word, data }));
        }
      }
    } catch (e) {
      console.error('Failed to load dictionary entry:', e);
    } finally {
      loading = false;
    }
  }

  async function handleRemove() {
    if (!charData) return;
    try {
      const res = await api.removeCharacter(text);
      const parts: string[] = [`Removed: ${res.removed_char}`];
      if (res.removed_words.length) {
        parts.push(`Affected words: ${res.removed_words.join(', ')}`);
      }
      removeMsg = parts.join(' | ');
      inBank = false;
      unlockedWords = [];
      // Refresh stores
      const [chars, words] = await Promise.all([api.getCharacters(), api.getWords()]);
      bankDict.set(chars);
      beastiaryDict.set(words);
    } catch (e) {
      removeMsg = 'Failed to remove character';
    }
  }

  async function handleAddToBank() {
    try {
      const res = await api.addCharacters(text);
      if (res.added.length > 0) {
        removeMsg = `Added: ${res.added.join('')}`;
        inBank = true;
        const [chars, words] = await Promise.all([api.getCharacters(), api.getWords()]);
        bankDict.set(chars);
        beastiaryDict.set(words);
        charData = chars[text] ?? null;
        if (charData) {
          unlockedWords = Object.entries(words)
            .filter(([word]) => word.includes(text))
            .map(([word, data]) => ({ word, data }));
        }
      } else {
        removeMsg = 'Already in bank';
      }
    } catch (e) {
      removeMsg = 'Failed to add character';
    }
  }

  function goBack() {
    navigateTo($dictionaryTarget?.isWord ? 'my-bank' : 'my-bank');
  }

  let data = $derived(charData || wordData);

  // Get pronunciation-definition pairs
  let pronPairs = $derived(
    data
      ? splitPronunciations(data.pinyin, data.definition)
      : []
  );
</script>

<div class="page">
  <button class="back-link" onclick={goBack}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="15,18 9,12 15,6"/>
    </svg>
    Back
  </button>

  {#if loading}
    <p class="text-ink-grey text-sm">Loading...</p>
  {:else if data}
    <div class="entry-card">
      <!-- Header -->
      <div class="entry-header">
        <span class="entry-char">{text}</span>
        <div class="entry-meta">
          <span class="entry-pinyin">
            {#each data.pinyin.split(';').map(p => p.trim()) as p, i}
              <span style="color: {getToneColor(getToneNumber(p))}">{numericToAccented(p)}</span>{#if i < data.pinyin.split(';').length - 1} <span class="text-ink-light">/</span> {/if}
            {/each}
          </span>
          {#if data.hsk}
            <span class="hsk-stamp">HSK {data.hsk}</span>
          {/if}
          {#if 'frequency_rank' in data && data.frequency_rank}
            <span class="freq-badge">#{data.frequency_rank}</span>
          {/if}
        </div>
      </div>

      <!-- Definitions -->
      <div class="definitions-section">
        <h3 class="section-label">Definitions</h3>
        {#if pronPairs.length > 0}
          <ol class="def-list">
          {#each pronPairs as pair, i}
            <li class="def-item">
              <span class="def-pinyin-group">
                {#each pair.pinyin.split(' ').filter(Boolean) as syl, si}
                  {#if si > 0}{' '}{/if}
                  <span class="def-pinyin" style="color: {getToneColor(getToneNumber(syl))}">{numericToAccented(syl)}</span>
                  <span class="def-numeric">({syl.replace(/[A-Z]/g, (c) => c.toLowerCase())})</span>
                {/each}
              </span>
              <span class="def-dash">—</span>
              <span class="def-meanings">
                {pair.definition.split('; ').filter(Boolean).join(' • ')}
              </span>
            </li>
          {/each}
        </ol>
        {:else}
          <p class="def-text">{data.definition}</p>
        {/if}
      </div>

      <!-- Character-specific: unlocked words -->
      {#if !isWord && inBank && unlockedWords.length > 0}
        <div class="words-section">
          <h3 class="section-label">Unlocked Words</h3>
          <div class="words-list">
            {#each unlockedWords as { word, data: wData }}
              <button
                class="word-row"
                onclick={() => {
                  dictionaryTarget.set({ text: word, isWord: true });
                }}
              >
                <span class="word-text">{word}</span>
                <span class="word-pinyin-cell">
                  {#each splitPronunciations(wData.pinyin, wData.definition) as pron, pi}
                    {#if pi === 0}
                      {#each pron.pinyin.split(' ').filter(Boolean) as syl, si}
                        {#if si > 0}{' '}{/if}
                        <span class="word-pinyin-colored" style="color: {getToneColor(getToneNumber(syl))}">{numericToAccented(syl)}</span>
                        <span class="word-pinyin-num">({syl.replace(/[A-Z]/g, (c) => c.toLowerCase())})</span>
                      {/each}
                    {/if}
                  {/each}
                </span>
                <span class="word-def-cell">
                  {#each splitPronunciations(wData.pinyin, wData.definition) as pron, pi}
                    {#if pi === 0}
                      <span class="word-meanings">
                        {pron.definition.split('; ').filter(Boolean).join(' • ')}
                      </span>
                      {#if splitPronunciations(wData.pinyin, wData.definition).length > 1}
                        <span class="word-more">+{splitPronunciations(wData.pinyin, wData.definition).length - 1} more</span>
                      {/if}
                    {/if}
                  {/each}
                </span>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Component characters (for words) -->
      {#if isWord && componentChars.length > 0}
        <div class="words-section">
          <h3 class="section-label">Characters</h3>
          <div class="words-list">
            {#each componentChars as cc}
              <button class="word-row" onclick={() => { dictionaryTarget.set({ text: cc.char, isWord: false }); }}>
                <span class="word-text">{cc.char}</span>
                <span class="word-pinyin-cell">
                  {#each splitPronunciations(cc.pinyin, cc.definition) as pron, pi}
                    {#if pi === 0}
                      {#each pron.pinyin.split(' ').filter(Boolean) as syl, si}
                        {#if si > 0}{' '}{/if}
                        <span class="word-pinyin-colored" style="color: {getToneColor(getToneNumber(syl))}">{numericToAccented(syl)}</span>
                        <span class="word-pinyin-num">({syl.replace(/[A-Z]/g, (c2) => c2.toLowerCase())})</span>
                      {/each}
                    {/if}
                  {/each}
                </span>
                <span class="word-def-cell">
                  {#each splitPronunciations(cc.pinyin, cc.definition) as pron, pi}
                    {#if pi === 0}
                      <span class="word-meanings">{pron.definition.split('; ').filter(Boolean).join(' • ')}</span>
                      {#if splitPronunciations(cc.pinyin, cc.definition).length > 1}
                        <span class="word-more">+{splitPronunciations(cc.pinyin, cc.definition).length - 1} more</span>
                      {/if}
                    {/if}
                  {/each}
                </span>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Add/Remove button (characters only) -->
      {#if !isWord}
        <div class="remove-section">
          {#if inBank}
            <Button3D variant="ghost" size="sm" onclick={handleRemove}>
              Remove from bank
            </Button3D>
          {:else}
            <Button3D variant="coral" size="sm" onclick={handleAddToBank}>
              Add to bank
            </Button3D>
          {/if}
          {#if removeMsg}
            <p class="remove-msg">{removeMsg}</p>
          {/if}
        </div>
      {/if}

      {#if isWord && !wordData}
        <p class="not-unlocked">This word hasn't been unlocked yet. Add its characters to your bank first.</p>
      {/if}
    </div>
  {:else}
    <p class="not-found">Not found in bank or dictionary.</p>
  {/if}
</div>

<style>
  .page {
    flex: 1;
    min-height: 0;
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    color: #888888;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    width: fit-content;
  }

  .back-link:hover {
    color: #e87d7d;
  }

  .entry-card {
    background: #f5f0e3;
    background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    background-size: 200px 200px;
    border: none;
    border-radius: 2px;
    padding: 28px;
    box-shadow: 0 1px 0 #e0d8c8, 2px 3px 10px rgba(0, 0, 0, 0.25), 4px 6px 18px rgba(0, 0, 0, 0.10);
  }

  .entry-header {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid #f0ece5;
  }

  .entry-char {
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 88px;
    color: #2d2d2d;
    line-height: 1;
  }

  .entry-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 8px;
  }

  .entry-pinyin {
    font-size: 21px;
    font-weight: 500;
    color: #888888;
    font-family: 'Inter', sans-serif;
  }

  .hsk-stamp {
    display: inline-block;
    padding: 2px 10px;
    font-size: 11px;
    font-weight: 700;
    color: #c41e3a;
    border: 1.5px solid #c41e3a;
    border-radius: 2px;
    transform: rotate(-2deg);
    opacity: 0.8;
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.5px;
    width: fit-content;
  }

  .freq-badge {
    display: inline-block;
    font-size: 11px;
    color: #bbbbbb;
    font-family: 'Inter', sans-serif;
  }

  .section-label {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: #bbbbbb;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin: 0 0 12px;
  }

  .definitions-section {
    margin-bottom: 20px;
  }

  .def-list {
    list-style: none;
    counter-reset: def-counter;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .def-item {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0;
    min-width: 0;
  }

  .def-item::before {
    counter-increment: def-counter;
    content: counter(def-counter) '. ';
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #bbbbbb;
    margin-right: 4px;
    flex-shrink: 0;
  }

  .def-pinyin-group {
    white-space: nowrap;
    flex-shrink: 0;
  }

  .def-pinyin {
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 600;
    margin-right: 1px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .def-numeric {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 400;
    color: #bbbbbb;
    margin-right: 6px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .def-dash {
    color: #cccccc;
    font-size: 14px;
    margin: 0 4px;
    flex-shrink: 0;
  }

  .def-meanings {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #555555;
    line-height: 1.6;
    min-width: 0;
  }

  .def-text {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #555555;
    line-height: 1.6;
  }

  .words-section {
    margin-bottom: 20px;
    padding-top: 20px;
    border-top: 1px solid #f0ece5;
  }

  .words-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .word-row {
    display: grid;
    grid-template-columns: 90px 160px 1fr;
    gap: 18px;
    align-items: baseline;
    padding: 8px 10px;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    border-radius: 3px;
    width: 100%;
  }

  .word-row:hover {
    background: #faf8f5;
  }

  .word-text {
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 28px;
    color: #2d2d2d;
    line-height: 1.2;
  }

  .word-pinyin-cell {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .word-def-cell {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    line-height: 1.4;
    overflow: hidden;
    display: flex;
    align-items: baseline;
    gap: 0;
    min-width: 0;
  }

  .word-pinyin-colored {
    font-weight: 600;
    font-size: 13px;
    margin-right: 1px;
    white-space: nowrap;
  }

  .word-pinyin-num {
    font-size: 10px;
    color: #bbbbbb;
    margin-right: 5px;
    white-space: nowrap;
  }

  .word-meanings {
    color: #555555;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .word-more {
    font-size: 9px;
    color: #e87d7d;
    font-style: italic;
    margin-left: 4px;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .remove-section {
    padding-top: 20px;
    border-top: 1px solid #f0ece5;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .remove-msg {
    font-size: 12px;
    color: #888888;
    font-family: 'Inter', sans-serif;
  }

  .not-unlocked {
    font-size: 14px;
    color: #888888;
    font-style: italic;
    font-family: 'Inter', sans-serif;
  }

  .not-found {
    font-size: 14px;
    color: #bbbbbb;
    font-family: 'Inter', sans-serif;
  }
</style>
