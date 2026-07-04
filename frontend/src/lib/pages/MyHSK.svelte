<script lang="ts">
  import { onMount } from 'svelte';
  import { bankDict, beastiaryDict, openDictionary } from '$lib/stores';
  import { api } from '$lib/api';
  import { numericToAccented, splitPronunciations, getToneNumber, getToneColor } from '$lib/utils';
  import type { BankDict, BeastiaryDict } from '$lib/types';

  let chars = $state<BankDict>({});
  let words = $state<BeastiaryDict>({});
  let collapsedLevels = $state<Set<number>>(new Set());
  let loading = $state(true);

  const hskTargets: Record<number, number> = { 1: 300, 2: 300, 3: 600, 4: 1200, 5: 2500, 6: 5000 };
  const hskNumerals = ['一', '二', '三', '四', '五', '六'];

  onMount(async () => {
    try {
      const [cd, wd] = await Promise.all([api.getCharacters(), api.getWords()]);
      chars = cd; words = wd;
      bankDict.set(cd); beastiaryDict.set(wd);
    } catch (e) { console.error(e); }
    finally { loading = false; }
  });

  function toggleLevel(l: number) {
    if (collapsedLevels.has(l)) collapsedLevels.delete(l); else collapsedLevels.add(l);
    collapsedLevels = new Set(collapsedLevels);
  }

  function totalCount(level: number): number {
    let c = 0;
    for (const d of Object.values(chars)) { if (d.hsk === level) c++; }
    for (const d of Object.values(words)) { if (d.hsk === level) c++; }
    return c;
  }

  function getEntries(level: number): { text: string; isWord: boolean; pinyin: string; definition: string }[] {
    const entries: { text: string; isWord: boolean; pinyin: string; definition: string }[] = [];
    for (const [c, d] of Object.entries(chars)) {
      if (d.hsk === level) entries.push({ text: c, isWord: false, pinyin: d.pinyin, definition: d.definition });
    }
    for (const [w, d] of Object.entries(words)) {
      if (d.hsk === level) entries.push({ text: w, isWord: true, pinyin: d.pinyin, definition: d.definition });
    }
    entries.sort((a, b) => a.text.localeCompare(b.text, 'zh'));
    return entries;
  }
</script>

<div class="page">
  <h1 class="page-title">HSK Levels</h1>
  {#if loading}
    <p class="loading-text">Loading...</p>
  {:else}
    <div class="levels-list">
      {#each [1, 2, 3, 4, 5, 6] as level}
        {@const tc = totalCount(level)}
        {@const entries = getEntries(level)}
        {@const collapsed = collapsedLevels.has(level)}
        {@const target = hskTargets[level]}
        {@const pct = Math.min((tc / target) * 100, 100)}

        <div class="level-section" class:collapsed class:empty={tc === 0}>
          <button class="level-header" onclick={() => toggleLevel(level)}>
            <div class="level-header-left">
              <span class="level-hsk">HSK {hskNumerals[level - 1]}</span>
              <div class="level-stats">
                <div class="stat-row">
                  <div class="stat-bar"><div class="stat-fill" style="width:{pct}%"></div></div>
                  <span class="stat-count" class:zero={tc===0}>{tc}/{target}</span>
                  <span class="stat-label">entries</span>
                </div>
              </div>
            </div>
            <svg class="chevron" class:rotated={!collapsed} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </button>

          {#if !collapsed && entries.length > 0}
            <div class="word-list">
              {#each entries as entry}
                <button class="word-row" onclick={() => openDictionary(entry.text, entry.isWord)}>
                  <span class="word-char">{entry.text}</span>
                  <span class="word-pinyin-cell">
                    {#each splitPronunciations(entry.pinyin, entry.definition) as pron, pi}
                      {#if pi === 0}
                        {#each pron.pinyin.split(' ').filter(Boolean) as syl, si}
                          {#if si > 0}{' '}{/if}
                          <span class="wp-colored" style="color:{getToneColor(getToneNumber(syl))}">{numericToAccented(syl)}</span>
                          <span class="wp-num">({syl.toLowerCase()})</span>
                        {/each}
                      {/if}
                    {/each}
                  </span>
                  <span class="word-def-cell">
                    {#each splitPronunciations(entry.pinyin, entry.definition) as pron, pi}
                      {#if pi === 0}
                        <span class="w-meanings">{pron.definition.split('; ').filter(Boolean).join(' • ')}</span>
                        {#if splitPronunciations(entry.pinyin, entry.definition).length > 1}
                          <span class="w-more">+{splitPronunciations(entry.pinyin, entry.definition).length - 1} more</span>
                        {/if}
                      {/if}
                    {/each}
                  </span>
                </button>
              {/each}
            </div>
          {:else if !collapsed && entries.length === 0}
            <p class="empty-msg">0 entries</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .page { flex:1; min-height:0; padding:32px; display:flex; flex-direction:column; gap:20px; }
  .page-title { font-family:'Ma Shan Zheng',cursive; font-size:36px; color:#2d2d2d; margin:0; line-height:1; }
  .loading-text { font-size:14px; color:#888; font-family:'Inter',sans-serif; }
  .levels-list { display:flex; flex-direction:column; gap:8px; }
  .level-section { background:#fff; border:1px solid #e8e5e0; border-radius:2px; box-shadow:2px 3px 8px rgba(0,0,0,0.04); overflow:hidden; }
  .level-section.empty { opacity:0.5; }
  .level-header { display:flex; align-items:center; justify-content:space-between; width:100%; padding:14px 18px; background:none; border:none; cursor:pointer; text-align:left; }
  .level-header:hover { background:#faf8f5; }
  .level-header-left { display:flex; align-items:center; gap:20px; }
  .level-hsk { font-family:'Ma Shan Zheng',cursive; font-size:28px; color:#c41e3a; line-height:1; min-width:70px; }
  .level-stats { display:flex; flex-direction:column; gap:4px; }
  .stat-row { display:flex; align-items:center; gap:8px; font-family:'Inter',sans-serif; }
  .stat-label { font-size:11px; color:#bbb; text-transform:uppercase; letter-spacing:0.8px; min-width:65px; }
  .stat-bar { width:120px; height:6px; background:#f0ece5; border-radius:3px; overflow:hidden; }
  .stat-fill { height:100%; background:linear-gradient(90deg,#e87d7d,#f0a8a8); border-radius:3px; transition:width 0.5s; }
  .stat-count { font-size:12px; font-weight:600; color:#2d2d2d; min-width:50px; }
  .stat-count.zero { color:#ccc; font-weight:400; }
  .chevron { color:#ccc; transition:transform 0.2s; flex-shrink:0; }
  .chevron.rotated { transform:rotate(180deg); }
  .word-list { border-top:1px solid #f0ece5; }
  .word-row { display:grid; grid-template-columns:90px 160px 1fr; gap:18px; align-items:baseline; width:100%; padding:10px 18px; background:none; border:none; border-bottom:1px solid #f8f5f0; cursor:pointer; text-align:left; }
  .word-row:hover { background:#faf8f5; }
  .word-row:last-child { border-bottom:none; }
  .word-char { font-family:'Ma Shan Zheng',cursive; font-size:26px; color:#2d2d2d; line-height:1.2; }
  .word-pinyin-cell { font-family:'Inter',sans-serif; font-size:13px; line-height:1.4; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .word-def-cell { font-family:'Inter',sans-serif; font-size:13px; line-height:1.4; overflow:hidden; display:flex; align-items:baseline; gap:0; min-width:0; }
  .wp-colored { font-weight:600; font-size:13px; margin-right:1px; white-space:nowrap; }
  .wp-num { font-size:10px; color:#bbb; margin-right:5px; white-space:nowrap; }
  .w-meanings { color:#555; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .w-more { font-size:10px; color:#e87d7d; font-style:italic; margin-left:6px; flex-shrink:0; white-space:nowrap; }
  .empty-msg { padding:16px 18px; font-size:13px; color:#ccc; font-style:italic; font-family:'Inter',sans-serif; margin:0; border-top:1px solid #f0ece5; }
</style>
