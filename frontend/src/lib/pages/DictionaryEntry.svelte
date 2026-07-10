<script lang="ts">
  import LoadingScreen from '$lib/components/LoadingScreen.svelte';
  import { onMount } from 'svelte';
  import { dictionaryTarget, navigateTo, previousPage, bankDict, beastiaryDict, masteredChars, markMastered, markLearning } from '$lib/stores';
  import { api } from '$lib/api';
  import { numericToAccented, splitPronunciations, getToneNumber, getToneColor } from '$lib/utils';
  import Button3D from '$lib/components/Button3D.svelte';
  import Speak from '$lib/components/Speak.svelte';
  import StrokeOrder from '$lib/components/StrokeOrder.svelte';
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

  let lastTarget = $state('');

  onMount(async () => {
    await loadFromTarget();
  });

  $effect(() => {
    const t = $dictionaryTarget;
    if (!t) return;
    const key = t.text + '|' + t.isWord;
    if (key !== lastTarget) {
      lastTarget = key;
      text = t.text;
      isWord = t.isWord;
      loadData();
    }
  });

  async function loadFromTarget() {
    const target = $dictionaryTarget;
    if (!target) {
      navigateTo('dashboard');
      return;
    }
    text = target.text;
    isWord = target.isWord;
    lastTarget = target.text + '|' + target.isWord;
    await loadData();
  }

  async function loadData() {
    loading = true;
    charData = null;
    wordData = null;
    componentChars = [];
    unlockedWords = [];
    removeMsg = '';
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

        // Fallback: look up word in full dictionary
        if (!wordData) {
          try {
            const entry = await api.getCharacter(text);
            if (entry.pinyin) {
              wordData = { ...entry, date: '' } as WordData;
            }
          } catch (e) { console.error('Word fallback failed:', e); }
        }

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
            console.log('Dictionary fallback:', text, entry);
            if (entry.pinyin) {
              charData = { ...entry, date: '' } as CharacterData;
            }
          } catch (e) { console.error('Fallback failed:', e); }
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

  async function addToBankAnd(mastered: boolean) {
    try {
      const res = await api.addCharacters(text);
      if (res.added.length > 0 || res.existed.length > 0) {
        inBank = true;
        if (mastered) markMastered(text); else markLearning(text);
        const [chars, words] = await Promise.all([api.getCharacters(), api.getWords()]);
        bankDict.set(chars);
        beastiaryDict.set(words);
        charData = chars[text] ?? null;
        if (charData) {
          unlockedWords = Object.entries(words)
            .filter(([word]) => word.includes(text))
            .map(([word, data]) => ({ word, data }));
        }
        removeMsg = mastered ? 'Added to Learnt' : 'Added to Learning';
      }
    } catch (e) {
      removeMsg = 'Failed to add character';
    }
  }

  async function handleAddToLearning() {
    await addToBankAnd(false);
  }

  async function handleAddToLearnt() {
    await addToBankAnd(true);
  }

  async function handleMoveToLearnt() {
    markMastered(text);
    removeMsg = 'Moved to Learnt';
  }

  async function handleMoveToLearning() {
    markLearning(text);
    removeMsg = 'Moved to Learning';
  }

  async function handleRemoveFromLearning() {
    await handleRemove();
    markLearning(text);
  }

  async function handleRemoveFromLearnt() {
    await handleRemove();
    markLearning(text);
  }

  function goBack() {
    navigateTo($previousPage);
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
    <LoadingScreen />
  {:else if data}
    <div class="entry-card">
      <div class="entry-layout">
        <div class="entry-body">

          <!-- Pinyin header -->
          <div class="entry-pinyin-row">
            {#each data.pinyin.split(';').map(p => p.trim()) as p, i}
              <span style="color: {getToneColor(getToneNumber(p))}">{numericToAccented(p)}</span>{#if i < data.pinyin.split(';').length - 1} <span class="text-ink-light"> / </span> {/if}
            {/each}
          </div>

          <!-- Definitions as subsections -->
          <div class="definitions-section">
            <h3 class="section-label">Definitions</h3>
            {#if pronPairs.length > 0}
              {#each pronPairs as pair, i}
                <div class="def-subsection">
                  <div class="def-subheader">
                    <span class="def-pinyin-group">
                      {#each pair.pinyin.split(' ').filter(Boolean) as syl, si}
                        {#if si > 0}{' '}{/if}
                        <span class="def-pinyin" style="color: {getToneColor(getToneNumber(syl))}">{numericToAccented(syl)}</span>
                        <span class="def-numeric">({syl.replace(/[A-Z]/g, (c) => c.toLowerCase())})</span>
                      {/each}
                    </span>
                    <Speak text={text} />
                  </div>
                  <ul class="def-bullets">
                    {#each pair.definition.split('; ').filter(Boolean) as meaning}
                      <li class="def-bullet">{meaning}</li>
                    {/each}
                  </ul>
                </div>
              {/each}
            {:else}
              <p class="def-text">{data.definition}</p>
            {/if}
          </div>

          {#if isWord && !wordData}
            <p class="not-unlocked">This word hasn't been unlocked yet. Add its characters to your bank first.</p>
          {/if}

          <!-- Character-specific: unlocked words -->
          {#if !isWord && inBank && unlockedWords.length > 0}
            <div class="words-section">
              <h3 class="section-label">Unlocked Words</h3>
              <div class="words-list">
                {#each unlockedWords as { word, data: wData }}
                  <button class="word-row" onclick={() => { dictionaryTarget.set({ text: word, isWord: true }); }}>
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
                          <span class="word-meanings">{pron.definition.split('; ').filter(Boolean).join(' • ')}</span>
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
                {#each componentChars as cc}}
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

        </div>

        <!-- Sidebar — Wikipedia infobox style -->
        <div class="entry-sidebar">
          {#if !isWord}
            <StrokeOrder character={text} />
          {:else}
            <span class="sidebar-char">{text}</span>
          {/if}
          <div class="info-panel">
            {#if data.hsk}
              <div class="info-row">
                <span class="info-label">HSK</span>
                <span class="info-value hsk-value">{data.hsk}</span>
              </div>
            {/if}
            {#if 'frequency_rank' in data && data.frequency_rank}
              <div class="info-row">
                <span class="info-label">Rank</span>
                <span class="info-value">#{data.frequency_rank}</span>
              </div>
            {/if}
            <div class="info-row">
              <span class="info-label">Type</span>
              <span class="info-value">{isWord ? 'word' : 'character'}</span>
            </div>
          </div>
          {#if !isWord}
            <div class="sidebar-action">
              {#if inBank}
                {#if $masteredChars.has(text)}
                  <button class="action-btn action-gold" onclick={handleMoveToLearning}>
                    Move to Learning
                  </button>
                  <button class="action-btn action-remove" onclick={handleRemoveFromLearnt}>
                    Remove from Learnt
                  </button>
                {:else}
                  <button class="action-btn action-green" onclick={handleMoveToLearnt}>
                    Move to Learnt
                  </button>
                  <button class="action-btn action-remove" onclick={handleRemoveFromLearning}>
                    Remove from Learning
                  </button>
                {/if}
              {:else}
                <button class="action-btn action-green" onclick={handleAddToLearnt}>
                  Add to Learnt
                </button>
                <button class="action-btn action-gold" onclick={handleAddToLearning}>
                  Add to Learning
                </button>
              {/if}
              {#if removeMsg}
                <p class="remove-msg">{removeMsg}</p>
              {/if}
            </div>
          {/if}
        </div>
      </div>
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
    color: #5a5550;
    font-weight: 600;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    width: fit-content;
  }

  .back-link:hover {
    color: #c41e3a;
  }

  .entry-card {
    position: relative;
    background: #ffffff;
    border: 3px solid #2a2a2a;
    padding: 28px;
    box-shadow: 3px 3px 0 #1a1a1a;
  }

  .entry-layout {
    display: flex;
    gap: 32px;
    align-items: flex-start;
  }

  .entry-body {
    flex: 1;
    min-width: 0;
  }

  .entry-sidebar {
    flex-shrink: 0;
    width: 220px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    position: sticky;
    top: 32px;
    align-self: flex-start;
  }

  .info-panel {
    width: 100%;
    background: #f8f6f2;
    border: 3px solid #2a2a2a;
    box-shadow: 3px 3px 0 #1a1a1a;
    border-radius: 0;
    overflow: hidden;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 2px solid #2a2a2a;
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .info-label {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: #bbbbbb;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .info-value {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #2d2d2d;
  }

  .hsk-value {
    color: #c41e3a;
  }

  .sidebar-action {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 100%;
  }

  .action-btn {
    width: 100%;
    padding: 8px 12px;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 600;
    border: none;
    border-radius: 0;
    cursor: pointer;
    transition: all 0.1s;
    
  }

  .action-btn:active {
    transform: translateY(2px);
    
  }

  .action-green {
    background: #2a8a4a;
    color: #fff;
    border: 3px solid #1a1a1a; box-shadow: 3px 3px 0 #1a1a1a;
  }

  .action-green:hover { filter: brightness(0.92); }

  .action-gold {
    background: #c4883a;
    color: #fff;
    border: 3px solid #1a1a1a; box-shadow: 3px 3px 0 #1a1a1a;
  }

  .action-gold:hover { filter: brightness(0.92); }

  .action-remove {
    background: transparent;
    color: #bbb;
    box-shadow: none;
    font-weight: 400;
    font-size: 11px;
    padding: 4px;
  }

  .action-remove:hover { color: #c41e3a; }

  .sidebar-char {
    font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', 'SimKai', cursive;
    font-size: 120px;
    color: #2d2d2d;
    line-height: 1;
  }

  .type-badge {
    font-size: 10px;
    color: #bbbbbb;
    font-family: 'Inter', sans-serif;
    text-transform: uppercase;
    letter-spacing: 1px;
    border: 1px solid #e8e3da;
    padding: 2px 8px;
    border-radius: 0;
  }



  .entry-pinyin-row {
    font-size: 22px;
    font-weight: 500;
    color: #5a5550;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    margin-bottom: 10px;
  }

  .hsk-stamp {
    display: inline-block;
    padding: 2px 10px;
    font-size: 11px;
    font-weight: 700;
    color: #c41e3a;
    border: 2px solid #c41e3a;
    border-radius: 0;
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
    font-weight: 800;
    color: #c41e3a;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin: 0 0 12px;
  }


  .definitions-section {
    margin-bottom: 20px;
  }

  .def-subsection {
    margin-bottom: 16px;
  }

  .def-subsection:last-child {
    margin-bottom: 0;
  }

  .def-subheader {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
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

  .def-bullets {
    list-style: disc;
    padding-left: 28px;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .def-bullet {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #555555;
    line-height: 1.6;
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
    border-top: 3px solid #2a2a2a;
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
    background: rgba(196,30,57,0.06);
  }

  .word-text {
    font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', 'SimKai', cursive;
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
    color: #c41e3a;
    font-style: italic;
    margin-left: 4px;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .remove-section {
    padding-top: 20px;
    border-top: 3px solid #2a2a2a;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .remove-msg {
    font-size: 12px;
    color: #5a5550;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
  }

  .not-unlocked {
    font-size: 14px;
    color: #5a5550;
    font-weight: 600;
    font-style: italic;
    font-family: 'Inter', sans-serif;
  }

  .not-found {
    font-size: 14px;
    color: #bbbbbb;
    font-family: 'Inter', sans-serif;
  }
</style>
