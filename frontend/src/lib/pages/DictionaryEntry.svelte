<script lang="ts">
  import { onMount } from 'svelte';
  import { dictionaryTarget, navigateTo, bankDict, beastiaryDict } from '$lib/stores';
  import { api } from '$lib/api';
  import { numericToAccented, splitPronunciations } from '$lib/utils';
  import Button3D from '$lib/components/Button3D.svelte';
  import type { CharacterData, WordData, BankDict, BeastiaryDict } from '$lib/types';

  let text = $state('');
  let isWord = $state(false);
  let charData = $state<CharacterData | null>(null);
  let wordData = $state<WordData | null>(null);
  let inBank = $state(false);
  let loading = $state(true);
  let removeMsg = $state('');

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
        // Check if any char from word is in bank
        inBank = [...text].some((c) => c in chars);
      } else {
        charData = chars[text] ?? null;
        inBank = text in chars;

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
            {numericToAccented(data.pinyin.split(';')[0].trim())}
          </span>
          {#if data.hsk}
            <span class="hsk-stamp">HSK {data.hsk}</span>
          {/if}
          {'frequency_rank' in data && data.frequency_rank
            ? `<span class="freq-badge">#${data.frequency_rank}</span>`
            : ''}
        </div>
      </div>

      <!-- Definitions -->
      <div class="definitions-section">
        <h3 class="section-label">Definitions</h3>
        {#if pronPairs.length > 0}
          <div class="def-list">
            {#each pronPairs as pair}
              <div class="def-item">
                <span class="def-pinyin">{numericToAccented(pair.pinyin)}</span>
                <span class="def-sep">—</span>
                <span class="def-text">{pair.definition}</span>
              </div>
            {/each}
          </div>
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
                <span class="word-pinyin">
                  {numericToAccented(wData.pinyin.split(';')[0].trim())}
                </span>
                <span class="word-def">{wData.definition}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Remove button (characters only) -->
      {#if !isWord && inBank}
        <div class="remove-section">
          <Button3D variant="ghost" size="sm" onclick={handleRemove}>
            Remove from bank
          </Button3D>
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
    background: #ffffff;
    border: 1px solid #e8e5e0;
    border-radius: 2px;
    padding: 28px;
    box-shadow: 2px 3px 8px rgba(0, 0, 0, 0.06);
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
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .def-item {
    display: flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: wrap;
  }

  .def-pinyin {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #6bb5b0;
    white-space: nowrap;
  }

  .def-sep {
    color: #cccccc;
    font-size: 14px;
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
    display: flex;
    align-items: center;
    gap: 12px;
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
    font-size: 24px;
    color: #2d2d2d;
    min-width: 48px;
  }

  .word-pinyin {
    font-size: 12px;
    color: #888888;
    min-width: 80px;
    font-family: 'Inter', sans-serif;
  }

  .word-def {
    font-size: 13px;
    color: #555555;
    font-family: 'Inter', sans-serif;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
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
