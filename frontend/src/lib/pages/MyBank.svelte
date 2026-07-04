<script lang="ts">
  import { onMount } from 'svelte';
  import { bankDict, beastiaryDict, openDictionary } from '$lib/stores';
  import { api } from '$lib/api';
  import { numericToAccented, getToneNumber, getToneColor, splitPronunciations } from '$lib/utils';
  import CharacterCard from '$lib/components/CharacterCard.svelte';
  import Button3D from '$lib/components/Button3D.svelte';
  import AddBar from '$lib/components/AddBar.svelte';
  import type { BankDict, BeastiaryDict } from '$lib/types';

  let activeTab = $state<'chars' | 'words'>('chars');
  let addText = $state('');
  let addMessage = $state('');
  let removeConfirm = $state<string | null>(null);

  // Sort state
  let charSort = $state<'alpha' | 'hsk' | 'freq'>('alpha');
  let wordSort = $state<'alpha' | 'hsk' | 'freq'>('alpha');
  let wordFilter = $state('');

  // Confirm dialog for remove
  let charToRemove = $state<string | null>(null);

  onMount(async () => {
    try {
      const [chars, words] = await Promise.all([
        api.getCharacters(),
        api.getWords(),
      ]);
      bankDict.set(chars);
      beastiaryDict.set(words);
    } catch (e) {
      console.error('Failed to load bank data:', e);
    }
  });

  async function handleAdd() {
    const text = addText.trim();
    if (!text) return;
    try {
      const res = await api.addCharacters(text);
      const parts: string[] = [];
      if (res.added.length) parts.push(`Added: ${res.added.join('')}`);
      if (res.existed.length) parts.push(`Already in bank: ${res.existed.join('')}`);
      addMessage = parts.join(' | ');
      addText = '';
      const [chars, words] = await Promise.all([api.getCharacters(), api.getWords()]);
      bankDict.set(chars);
      beastiaryDict.set(words);
    } catch (e) {
      console.error('Add characters failed:', e);
      addMessage = 'Failed to add';
    }
  }

  async function handleRemove(char: string) {
    charToRemove = char;
  }

  async function confirmRemove() {
    if (!charToRemove) return;
    try {
      await api.removeCharacter(charToRemove);
      const [chars, words] = await Promise.all([api.getCharacters(), api.getWords()]);
      bankDict.set(chars);
      beastiaryDict.set(words);
    } catch (e) {
      console.error('Failed to remove:', e);
    } finally {
      charToRemove = null;
    }
  }

  function cancelRemove() {
    charToRemove = null;
  }

  // Sorted/filtered character list
  const sortedChars = $derived.by(() => {
    const entries = Object.entries($bankDict).map(([char, data]) => ({
      char,
      ...data,
    }));

    if (charSort === 'alpha') {
      entries.sort((a, b) => a.char.localeCompare(b.char, 'zh'));
    } else if (charSort === 'hsk') {
      entries.sort((a, b) => (a.hsk ?? 99) - (b.hsk ?? 99));
    } else if (charSort === 'freq') {
      entries.sort(
        (a, b) => (a.frequency_rank ?? 99999) - (b.frequency_rank ?? 99999)
      );
    }
    return entries;
  });

  function hskGroups(chars: typeof sortedChars) {
    const groups: { level: number; label: string; chars: typeof sortedChars }[] = [];
    for (const lv of [1,2,3,4,5,6]) {
      const items = chars.filter(c => c.hsk === lv);
      if (items.length > 0) groups.push({ level: lv, label: ['','一','二','三','四','五','六'][lv], chars: items });
    }
    const unranked = chars.filter(c => !c.hsk);
    if (unranked.length > 0) groups.push({ level: 0, label: '?', chars: unranked });
    return groups;
  }

  function freqGroups(chars: typeof sortedChars) {
    const groups: { start: number; end: number; chars: typeof sortedChars }[] = [];
    const step = 250;
    const ranked = chars.filter(c => c.frequency_rank != null);
    for (let i = 1; i <= 1500; i += step) {
      const items = ranked.filter(c => (c.frequency_rank ?? 0) >= i && (c.frequency_rank ?? 0) < i + step);
      if (items.length > 0) groups.push({ start: i, end: i + step - 1, chars: items });
    }
    const unranked = chars.filter(c => c.frequency_rank == null);
    if (unranked.length > 0) groups.push({ start: 0, end: 0, chars: unranked });
    return groups;
  }

  function wordHskGroups(words: typeof sortedWords) {
    const groups: { level: number; label: string; words: typeof sortedWords }[] = [];
    const numerals = ['','一','二','三','四','五','六'];
    for (const lv of [1,2,3,4,5,6]) {
      const items = words.filter(w => w.hsk === lv);
      if (items.length > 0) groups.push({ level: lv, label: numerals[lv], words: items });
    }
    const unranked = words.filter(w => !w.hsk);
    if (unranked.length > 0) groups.push({ level: 0, label: '?', words: unranked });
    return groups;
  }

  function wordFreqGroups(words: typeof sortedWords) {
    const groups: { start: number; end: number; words: typeof sortedWords }[] = [];
    const step = 250;
    const ranked = words.filter(w => w.frequency_rank != null);
    for (let i = 1; i <= 1500; i += step) {
      const items = ranked.filter(w => (w.frequency_rank ?? 0) >= i && (w.frequency_rank ?? 0) < i + step);
      if (items.length > 0) groups.push({ start: i, end: i + step - 1, words: items });
    }
    const unranked = words.filter(w => w.frequency_rank == null);
    if (unranked.length > 0) groups.push({ start: 0, end: 0, words: unranked });
    return groups;
  }

  // Sorted/filtered word list
  const sortedWords = $derived.by(() => {
    let entries = Object.entries($beastiaryDict).map(([word, data]) => ({
      word,
      ...data,
    }));

    if (wordFilter.trim()) {
      const q = wordFilter.trim().toLowerCase();
      entries = entries.filter(
        ({ word, pinyin, definition }) =>
          word.includes(q) ||
          pinyin.toLowerCase().includes(q) ||
          definition.toLowerCase().includes(q)
      );
    }

    if (wordSort === 'alpha') {
      entries.sort((a, b) => a.word.localeCompare(b.word, 'zh'));
    } else if (wordSort === 'hsk') {
      entries.sort((a, b) => (a.hsk ?? 99) - (b.hsk ?? 99));
    } else if (wordSort === 'freq') {
      entries.sort((a, b) => (a.frequency_rank ?? 99999) - (b.frequency_rank ?? 99999));
    }
    return entries;
  });
</script>

<div class="page">
  <!-- Tab switcher -->
  <div class="tabs">
    <button
      class="tab"
      class:active={activeTab === 'chars'}
      onclick={() => (activeTab = 'chars')}
    >
      Character Bank
    </button>
    <button
      class="tab"
      class:active={activeTab === 'words'}
      onclick={() => (activeTab = 'words')}
    >
      Word Bank
    </button>
  </div>

  {#if activeTab === 'chars'}
    <!-- Add input -->
    <div class="add-row">
      <AddBar bind:value={addText} onsubmit={handleAdd} placeholder="Add characters..." />
    </div>
    {#if addMessage}
      <p class="msg">{addMessage}</p>
    {/if}

    <!-- Sort -->
    <div class="sort-row">
      <span class="sort-label">Sort:</span>
      <button class="sort-btn" class:active={charSort === 'alpha'} onclick={() => (charSort = 'alpha')}>A-Z</button>
      <button class="sort-btn" class:active={charSort === 'hsk'} onclick={() => (charSort = 'hsk')}>HSK</button>
      <button class="sort-btn" class:active={charSort === 'freq'} onclick={() => (charSort = 'freq')}>Frequency</button>
    </div>

    <!-- Character grid -->
    {#if sortedChars.length > 0}
      {#if charSort === 'alpha'}
        <div class="card-grid">
          {#each sortedChars as charData}
            {@const rot = ((charData.char.charCodeAt(0) * 7) % 3) - 1}
            <div class="card-wrapper">
              <CharacterCard character={charData.char} hsk={charData.hsk} frequencyRank={charData.frequency_rank} inBank={true} rotate={rot} onclick={() => openDictionary(charData.char, false)} />
              <button class="remove-btn" onclick={(e) => { e.stopPropagation(); handleRemove(charData.char); }} title="Remove">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          {/each}
        </div>
      {:else if charSort === 'hsk'}
        {#each hskGroups(sortedChars) as group}
          <div class="char-section">
            <div class="char-section-header">
              <span class="char-section-label" style="color:#c41e3a">HSK {group.level}</span>
              <span class="char-section-count">{group.chars.length} character{group.chars.length !== 1 ? 's' : ''}</span>
            </div>
            <div class="card-grid">
              {#each group.chars as charData}
                {@const rot = ((charData.char.charCodeAt(0) * 7) % 3) - 1}
                <div class="card-wrapper">
                  <CharacterCard character={charData.char} hsk={charData.hsk} frequencyRank={charData.frequency_rank} inBank={true} rotate={rot} onclick={() => openDictionary(charData.char, false)} />
                  <button class="remove-btn" onclick={(e) => { e.stopPropagation(); handleRemove(charData.char); }} title="Remove">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      {:else if charSort === 'freq'}
        {#each freqGroups(sortedChars) as group}
          <div class="char-section">
            <div class="char-section-header">
              <span class="char-section-label">{group.start > 0 ? `#${group.start}–${group.end}` : 'Unranked'}</span>
              <span class="char-section-count">{group.chars.length} character{group.chars.length !== 1 ? 's' : ''}</span>
            </div>
            <div class="card-grid">
              {#each group.chars as charData}
                {@const rot = ((charData.char.charCodeAt(0) * 7) % 3) - 1}
                <div class="card-wrapper">
                  <CharacterCard character={charData.char} hsk={charData.hsk} frequencyRank={charData.frequency_rank} inBank={true} rotate={rot} onclick={() => openDictionary(charData.char, false)} />
                  <button class="remove-btn" onclick={(e) => { e.stopPropagation(); handleRemove(charData.char); }} title="Remove">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      {/if}
    {:else}
      <p class="empty">No characters yet. Add some above!</p>
    {/if}

  {:else}
    <!-- Word bank -->
    <div class="word-controls">
      <div class="word-filter-wrap">
        <input
          type="text"
          bind:value={wordFilter}
          placeholder="Filter words..."
          class="word-filter"
        />
      </div>
      <div class="sort-row">
        <span class="sort-label">Sort:</span>
        <button class="sort-btn" class:active={wordSort === 'alpha'} onclick={() => (wordSort = 'alpha')}>A-Z</button>
        <button class="sort-btn" class:active={wordSort === 'hsk'} onclick={() => (wordSort = 'hsk')}>HSK</button>
        <button class="sort-btn" class:active={wordSort === 'freq'} onclick={() => (wordSort = 'freq')}>Frequency</button>
      </div>
    </div>

    {#if sortedWords.length > 0}
      {#if wordSort === 'hsk'}
        {#each wordHskGroups(sortedWords) as group}
          <div class="char-section">
            <div class="char-section-header">
              <span class="char-section-label" style="color:#c41e3a">HSK {group.level}</span>
              <span class="char-section-count">{group.words.length} word{group.words.length !== 1 ? 's' : ''}</span>
            </div>
            <div class="word-list">
              {#each group.words as wordData}
                <button class="word-row" onclick={() => openDictionary(wordData.word, true)}>
                  <span class="word-char">{wordData.word}</span>
                  <span class="word-pinyin-cell">
                    {#each splitPronunciations(wordData.pinyin, wordData.definition) as pron, pi}
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
                    {#each splitPronunciations(wordData.pinyin, wordData.definition) as pron, pi}
                      {#if pi === 0}
                        <span class="word-meanings">{pron.definition.split('; ').filter(Boolean).join(' • ')}</span>
                        {#if splitPronunciations(wordData.pinyin, wordData.definition).length > 1}
                          <span class="word-more">+{splitPronunciations(wordData.pinyin, wordData.definition).length - 1} more</span>
                        {/if}
                      {/if}
                    {/each}
                  </span>
                </button>
              {/each}
            </div>
          </div>
        {/each}
      {:else if wordSort === 'freq'}
        {#each wordFreqGroups(sortedWords) as group}
          <div class="char-section">
            <div class="char-section-header">
              <span class="char-section-label">{group.start > 0 ? `#${group.start}–${group.end}` : 'Unranked'}</span>
              <span class="char-section-count">{group.words.length} word{group.words.length !== 1 ? 's' : ''}</span>
            </div>
            <div class="word-list">
              {#each group.words as wordData}
                <button class="word-row" onclick={() => openDictionary(wordData.word, true)}>
                  <span class="word-char">{wordData.word}</span>
                  <span class="word-pinyin-cell">
                    {#each splitPronunciations(wordData.pinyin, wordData.definition) as pron, pi}
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
                    {#each splitPronunciations(wordData.pinyin, wordData.definition) as pron, pi}
                      {#if pi === 0}
                        <span class="word-meanings">{pron.definition.split('; ').filter(Boolean).join(' • ')}</span>
                        {#if splitPronunciations(wordData.pinyin, wordData.definition).length > 1}
                          <span class="word-more">+{splitPronunciations(wordData.pinyin, wordData.definition).length - 1} more</span>
                        {/if}
                      {/if}
                    {/each}
                  </span>
                </button>
              {/each}
            </div>
          </div>
        {/each}
      {:else}
        <div class="word-list">
          {#each sortedWords as wordData}
            <button class="word-row" onclick={() => openDictionary(wordData.word, true)}>
              <span class="word-char">{wordData.word}</span>
              <span class="word-pinyin-cell">
                {#each splitPronunciations(wordData.pinyin, wordData.definition) as pron, pi}
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
                {#each splitPronunciations(wordData.pinyin, wordData.definition) as pron, pi}
                  {#if pi === 0}
                    <span class="word-meanings">{pron.definition.split('; ').filter(Boolean).join(' • ')}</span>
                    {#if splitPronunciations(wordData.pinyin, wordData.definition).length > 1}
                      <span class="word-more">+{splitPronunciations(wordData.pinyin, wordData.definition).length - 1} more</span>
                    {/if}
                  {/if}
                {/each}
              </span>
            </button>
          {/each}
        </div>
      {/if}
    {:else}
      <p class="empty">Add characters to unlock words</p>
    {/if}
  {/if}
</div>

<!-- Confirm dialog -->
{#if charToRemove}
  <div
    class="dialog-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Confirm removal"
    onclick={cancelRemove}
    onkeydown={(e) => e.key === 'Escape' && cancelRemove()}
    tabindex="-1"
  >
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="dialog" role="button" tabindex="0" onclick={(e) => e.stopPropagation()}>
      <p class="dialog-text">Remove <strong>{charToRemove}</strong> from your bank? This will also remove any unlocked words containing it.</p>
      <div class="dialog-actions">
        <Button3D size="sm" variant="ghost" onclick={cancelRemove}>Cancel</Button3D>
        <Button3D size="sm" variant="coral" onclick={confirmRemove}>Remove</Button3D>
      </div>
    </div>
  </div>
{/if}

<style>
  .page {
    flex: 1;
    min-height: 0;
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .tabs {
    display: flex;
    gap: 2px;
    background: #f0ece5;
    border-radius: 6px;
    padding: 3px;
    width: fit-content;
  }

  .tab {
    padding: 8px 18px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #888888;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.15s;
  }

  .tab.active {
    background: #ffffff;
    color: #2d2d2d;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .add-row {
    display: flex;
  }

  .msg {
    font-size: 12px;
    color: #6bb5b0;
    font-family: 'Inter', sans-serif;
  }

  .sort-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .sort-label {
    font-size: 11px;
    color: #bbbbbb;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: 'Inter', sans-serif;
    margin-right: 4px;
  }

  .sort-btn {
    padding: 3px 10px;
    font-size: 12px;
    color: #888888;
    background: none;
    border: 1px solid #e8e3da;
    border-radius: 3px;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: all 0.15s;
  }

  .sort-btn.active {
    background: #e87d7d;
    color: white;
    border-color: #e87d7d;
  }

  .sort-btn:hover:not(.active) {
    background: #faf8f5;
    border-color: #d0cbc0;
  }

  .char-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .char-section-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #f0ece5;
  }

  .char-section-label {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #2d2d2d;
    line-height: 1;
    letter-spacing: 0.5px;
  }

  .char-section-count {
    font-size: 12px;
    color: #888888;
    font-family: 'Inter', sans-serif;
  }

  .card-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .card-wrapper {
    position: relative;
  }

  .card-wrapper:hover .remove-btn {
    opacity: 1;
  }

  .remove-btn {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    border: 1px solid #e8e3da;
    border-radius: 50%;
    cursor: pointer;
    color: #c41e3a;
    opacity: 0;
    transition: opacity 0.15s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    z-index: 5;
  }

  .remove-btn:hover {
    background: #c41e3a;
    color: white;
    border-color: #c41e3a;
  }

  .empty {
    font-size: 14px;
    color: #bbbbbb;
    font-style: italic;
    font-family: 'Inter', sans-serif;
    padding: 20px 0;
  }

  /* Word bank */
  .word-controls {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .word-filter-wrap {
    flex: 1;
    max-width: 280px;
  }

  .word-filter {
    width: 100%;
    padding: 8px 12px;
    font-size: 13px;
    color: #2d2d2d;
    background: #fefdfb;
    border: 1px solid #e0dbd0;
    border-radius: 4px;
    outline: none;
    font-family: 'Inter', sans-serif;
  }

  .word-filter:focus {
    border-color: #e87d7d;
  }

  .word-filter::placeholder {
    color: #c4bfb5;
    font-style: italic;
  }

  .word-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: #f5f0e3;
    background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    background-size: 200px 200px;
    border: none;
    border-radius: 2px;
    box-shadow: 0 1px 0 #e0d8c8, 2px 3px 10px rgba(0, 0, 0, 0.25), 4px 6px 18px rgba(0, 0, 0, 0.10);
    overflow: hidden;
  }

  .word-row {
    display: grid;
    grid-template-columns: 90px 160px 1fr;
    gap: 18px;
    align-items: baseline;
    padding: 10px 16px;
    background: none;
    border: none;
    border-bottom: 1px solid #f5f0e8;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: background 0.1s;
  }

  .word-row:hover {
    background: #faf8f5;
  }

  .word-row:last-child {
    border-bottom: none;
  }

  .word-char {
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
  }

  .word-pinyin-num {
    font-size: 10px;
    color: #bbbbbb;
    margin-right: 5px;
  }

  .word-meanings {
    color: #555555;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .word-more {
    font-size: 10px;
    color: #e87d7d;
    font-style: italic;
    margin-left: 6px;
    flex-shrink: 0;
    white-space: nowrap;
  }

  /* Dialog */
  .dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .dialog {
    background: #ffffff;
    border: 1px solid #e8e5e0;
    border-radius: 4px;
    padding: 24px;
    max-width: 380px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }

  .dialog-text {
    font-size: 14px;
    color: #555555;
    font-family: 'Inter', sans-serif;
    margin: 0 0 16px;
    line-height: 1.6;
  }

  .dialog-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }
</style>
