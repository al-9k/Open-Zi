<script lang="ts">
  import { onMount } from 'svelte';
  import { beastiaryDict, openDictionary } from '$lib/stores';
  import { api } from '$lib/api';
  import { numericToAccented, splitPronunciations, getToneNumber, getToneColor } from '$lib/utils';
  import type { BeastiaryDict, WordData } from '$lib/types';

  let words = $state<BeastiaryDict>({});
  let collapsedLevels = $state<Set<number>>(new Set());
  let loading = $state(true);

  onMount(async () => {
    try {
      const data = await api.getWords();
      words = data;
      beastiaryDict.set(data);
    } catch (e) {
      console.error('Failed to load words:', e);
    } finally {
      loading = false;
    }
  });

  const hskNumerals = ['一', '二', '三', '四', '五', '六'];

  function toggleLevel(level: number) {
    if (collapsedLevels.has(level)) {
      collapsedLevels.delete(level);
    } else {
      collapsedLevels.add(level);
    }
    collapsedLevels = new Set(collapsedLevels);
  }

  function getWordsForLevel(level: number): { word: string; data: WordData }[] {
    const result: { word: string; data: WordData }[] = [];
    for (const [word, data] of Object.entries(words)) {
      if (data.hsk === level) {
        result.push({ word, data });
      }
    }
    result.sort((a, b) => a.word.localeCompare(b.word, 'zh'));
    return result;
  }
</script>

<div class="page">
  <h1 class="page-title">HSK Levels</h1>

  {#if loading}
    <p class="text-ink-grey text-sm">Loading...</p>
  {:else}
    <div class="levels-list">
      {#each [1, 2, 3, 4, 5, 6] as level}
        {@const levelWords = getWordsForLevel(level)}
        {@const isCollapsed = collapsedLevels.has(level)}

        <div class="level-section" class:collapsed={isCollapsed} class:empty={levelWords.length === 0}>
          <button class="level-header" onclick={() => toggleLevel(level)}>
            <div class="level-header-left">
              <span class="level-hsk">HSK {hskNumerals[level - 1]}</span>
              <span class="level-count" class:zero={levelWords.length === 0}>
                {levelWords.length} word{levelWords.length !== 1 ? 's' : ''} unlocked
              </span>
            </div>
            <svg
              class="chevron"
              class:rotated={!isCollapsed}
              width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2.5"
            >
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </button>

          {#if !isCollapsed && levelWords.length > 0}
            <div class="word-list">
              {#each levelWords as { word, data }}
                <button
                  class="word-row"
                  onclick={() => openDictionary(word, true)}
                >
                  <span class="word-char">{word}</span>
                  <span class="word-meta">
                    {#each splitPronunciations(data.pinyin, data.definition) as pron, pi}
                      {#if pi === 0}
                        {#each pron.pinyin.split(' ').filter(Boolean) as syl, si}
                          {#if si > 0}{' '}{/if}
                          <span class="word-pinyin-colored" style="color: {getToneColor(getToneNumber(syl))}">{numericToAccented(syl)}</span>
                          <span class="word-pinyin-num">({syl.replace(/[A-Z]/g, (c) => c.toLowerCase())})</span>
                        {/each}
                        <span class="word-dash">—</span>
                        <span class="word-meanings">
                          {pron.definition.split('; ').filter(Boolean).join(' • ')}
                        </span>
                        {#if splitPronunciations(data.pinyin, data.definition).length > 1}
                          <span class="word-more">+{splitPronunciations(data.pinyin, data.definition).length - 1} more</span>
                        {/if}
                      {/if}
                    {/each}
                  </span>
                </button>
              {/each}
            </div>
          {:else if !isCollapsed && levelWords.length === 0}
            <p class="empty-msg">0 words</p>
          {/if}
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

  .page-title {
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 36px;
    color: #2d2d2d;
    margin: 0;
    line-height: 1;
  }

  .levels-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .level-section {
    background: #ffffff;
    border: 1px solid #e8e5e0;
    border-radius: 2px;
    box-shadow: 2px 3px 8px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    transition: opacity 0.2s;
  }

  .level-section.empty {
    opacity: 0.5;
  }

  .level-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 14px 18px;
    background: none;
    border: none;
    cursor: pointer;
    transition: background 0.15s;
    text-align: left;
  }

  .level-header:hover {
    background: #faf8f5;
  }

  .level-header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .level-hsk {
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 28px;
    color: #c41e3a;
    line-height: 1;
  }

  .level-count {
    font-size: 13px;
    color: #888888;
    font-family: 'Inter', sans-serif;
  }

  .level-count.zero {
    color: #cccccc;
    font-style: italic;
  }

  .chevron {
    color: #cccccc;
    transition: transform 0.2s ease;
  }

  .chevron.rotated {
    transform: rotate(180deg);
  }

  .word-list {
    border-top: 1px solid #f0ece5;
  }

  .word-row {
    display: flex;
    align-items: baseline;
    gap: 14px;
    width: 100%;
    padding: 10px 18px;
    background: none;
    border: none;
    border-bottom: 1px solid #f8f5f0;
    cursor: pointer;
    text-align: left;
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
    font-size: 26px;
    color: #2d2d2d;
    min-width: 55px;
    flex-shrink: 0;
  }

  .word-meta {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    line-height: 1.6;
    min-width: 0;
    flex: 1;
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

  .word-dash {
    color: #cccccc;
    margin: 0 5px;
    flex-shrink: 0;
  }

  .word-meanings {
    color: #555555;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .word-more {
    font-size: 10px;
    color: #bbbbbb;
    font-style: italic;
    margin-left: 6px;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .empty-msg {
    padding: 16px 18px;
    font-size: 13px;
    color: #cccccc;
    font-style: italic;
    font-family: 'Inter', sans-serif;
    margin: 0;
    border-top: 1px solid #f0ece5;
  }
</style>
