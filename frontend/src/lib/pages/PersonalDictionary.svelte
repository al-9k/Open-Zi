<script lang="ts">
  import LoadingScreen from '$lib/components/LoadingScreen.svelte';
  import { onMount } from 'svelte';
  import { bankDict, beastiaryDict, openDictionary } from '$lib/stores';
  import { api } from '$lib/api';
  import { numericToAccented, getToneNumber, getToneColor, splitPronunciations } from '$lib/utils';
  import type { DictionaryEntry } from '$lib/types';

  let loading = $state(true);
  let sortMode = $state<'all' | 'hsk'>('all');
  let dictChars = $state<DictionaryEntry[]>([]);
  const hskNumerals = ['一', '二', '三', '四', '五', '六'];

  interface Entry {
    text: string; type: 'c' | 'w'; pinyin: string; definition: string;
    hsk: number | null; frequencyRank: number | null;
  }
  let allEntries = $state<Entry[]>([]);
  let expandedChar = $state<string | null>(null);

  onMount(async () => {
    try {
      const [chars, words, dict] = await Promise.all([api.getCharacters(), api.getWords(), api.getDictionary()]);
      bankDict.set(chars); beastiaryDict.set(words); dictChars = dict;
      buildEntries(chars, words);
    } catch (e) { console.error(e); }
    finally { loading = false; }
  });

  function buildEntries(chars: Record<string, any>, words: Record<string, any>) {
    const e: Entry[] = [];
    for (const [c, d] of Object.entries(chars))
      e.push({ text: c, type: 'c', pinyin: d.pinyin, definition: d.definition, hsk: d.hsk, frequencyRank: d.frequency_rank });
    for (const [w, d] of Object.entries(words))
      e.push({ text: w, type: 'w', pinyin: d.pinyin, definition: d.definition, hsk: d.hsk, frequencyRank: d.frequency_rank });
    if (sortMode === 'hsk') e.sort((a, b) => (a.hsk ?? 99) - (b.hsk ?? 99) || a.text.localeCompare(b.text, 'zh'));
    else e.sort((a, b) => a.text.localeCompare(b.text, 'zh'));
    allEntries = e;
  }

  function hskProgress(level: number) {
    let learned = 0, total = 0;
    for (const [, d] of Object.entries($bankDict)) { if (d.hsk === level) { total++; learned++; } }
    for (const [, d] of Object.entries($beastiaryDict)) { if (d.hsk === level) { total++; learned++; } }
    for (const e of dictChars) { if (e.hsk === level) total++; }
    return { learned, total };
  }

  function getWordsForChar(char: string) { return allEntries.filter(e => e.type === 'w' && e.text.includes(char)); }
</script>

<div class="page">
  {#if loading}<LoadingScreen />{:else}
    <div class="hsk-summary">
      {#each [1,2,3,4,5,6] as lv}
        {@const p = hskProgress(lv)}
        <div class="hsk-item">
          <span class="hsk-label">{hskNumerals[lv-1]}</span>
          <div class="hsk-bar"><div class="hsk-fill" style="width:{p.total>0?(p.learned/p.total)*100:0}%"></div></div>
          <span class="hsk-count">{p.learned}/{p.total}</span>
        </div>
      {/each}
    </div>
    <div class="sort-row">
      <span class="sort-label">Sort:</span>
      <button class="sort-btn" class:active={sortMode==='all'} onclick={()=>{sortMode='all';buildEntries($bankDict,$beastiaryDict)}}>All</button>
      <button class="sort-btn" class:active={sortMode==='hsk'} onclick={()=>{sortMode='hsk';buildEntries($bankDict,$beastiaryDict)}}>HSK</button>
    </div>
    {#if allEntries.length===0}
      <p class="empty">Add characters to build your dictionary.</p>
    {:else}
      <div class="entries-list">
        {#each allEntries as entry}
          <div class="entry-group">
            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
            <div class="entry-row" class:is-char={entry.type==='c'} onclick={()=>{entry.type==='c'?expandedChar=expandedChar===entry.text?null:entry.text:openDictionary(entry.text,true)}}>
              <span class="e-text">{entry.text}</span>
              <span class="e-type">{entry.type==='c'?'字':'词'}</span>
              <span class="e-pinyin">
                {#each splitPronunciations(entry.pinyin,entry.definition) as pron, pi}
                  {#if pi===0}
                    {#each pron.pinyin.split(' ').filter(Boolean) as syl, si}
                      {#if si>0}{' '}{/if}
                      <span style="color:{getToneColor(getToneNumber(syl))}">{numericToAccented(syl)}</span>
                    {/each}
                  {/if}
                {/each}
              </span>
              <span class="e-def">
                {#each splitPronunciations(entry.pinyin,entry.definition) as pron, pi}
                  {#if pi===0}{pron.definition.split('; ').filter(Boolean).join(' • ')}{/if}
                {/each}
                {#if splitPronunciations(entry.pinyin,entry.definition).length>1}
                  <span class="e-more">+{splitPronunciations(entry.pinyin,entry.definition).length-1} more</span>
                {/if}
              </span>
              {#if entry.hsk}<span class="e-hsk">HSK {entry.hsk}</span>{/if}
            </div>
            {#if entry.type==='c' && expandedChar===entry.text}
              <div class="unlocked-words">
                {#each getWordsForChar(entry.text) as word}
                  <button class="uw-row" onclick={(e)=>{e.stopPropagation();openDictionary(word.text,true)}}>
                    <span class="uw-text">{word.text}</span><span class="uw-arrow">→ unlocked</span>
                  </button>
                {/each}
                {#if getWordsForChar(entry.text).length===0}
                  <span class="uw-empty">No words unlocked yet</span>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .page { flex:1; min-height:0; padding:32px; display:flex; flex-direction:column; gap:16px; }
  .lt { font-size:14px; color:#888; font-family:'Inter',sans-serif; }
  .hsk-summary { position:relative; display:flex; gap:12px; background:#fefeff; background-image:radial-gradient(circle,#c8d4e4 0.8px,transparent 0.8px); background-size:20px 20px; border:none; border-radius:2px; padding:14px 18px; box-shadow:0 1px 0 rgba(0,0,0,0.04),2px 3px 12px rgba(0,0,0,0.25); flex-shrink:0; }
  .hsk-item { display:flex; align-items:center; gap:6px; font-family:'Inter',sans-serif; flex:1; min-width:0; }
  .hsk-label { font-family:'Kaiti SC','STKaiti','KaiTi','SimKai',cursive; font-size:18px; color:#c41e3a; line-height:1; flex-shrink:0; }
  .hsk-bar { flex:1; height:5px; background:#f0ece5; border-radius:3px; overflow:hidden; }
  .hsk-fill { height:100%; background:linear-gradient(90deg,#e87d7d,#f0a8a8); border-radius:3px; transition:width 0.5s; }
  .hsk-count { font-size:11px; font-weight:600; color:#2d2d2d; }
  .sort-row { display:flex; align-items:center; gap:6px; flex-shrink:0; }
  .sort-label { font-size:11px; color:#bbb; font-weight:600; text-transform:uppercase; letter-spacing:1px; font-family:'Inter',sans-serif; margin-right:4px; }
  .sort-btn { padding:3px 12px; font-size:12px; color:#888; background:none; border:1px solid #e8e3da; border-radius:3px; cursor:pointer; font-family:'Inter',sans-serif; }
  .sort-btn.active { background:#e87d7d; color:#fff; border-color:#e87d7d; }
  .sort-btn:hover:not(.active) { background:#faf8f5; }
  .entries-list { background:#fefeff; background-image:radial-gradient(circle,#c8d4e4 0.8px,transparent 0.8px); background-size:20px 20px; border:none; border-radius:2px; box-shadow:0 1px 0 rgba(0,0,0,0.04),2px 3px 12px rgba(0,0,0,0.25); overflow:hidden; flex:1; overflow-y:auto; min-height:0; }
  .entry-group { border-bottom:1px solid #f0ece5; }
  .entry-group:last-child { border-bottom:none; }
  .entry-row { display:grid; grid-template-columns:100px 32px 140px 1fr 55px; gap:12px; align-items:baseline; padding:10px 16px; cursor:pointer; transition:background 0.1s; }
  .entry-row:hover { background:#faf8f5; }
  .e-text { font-family:'Kaiti SC','STKaiti','KaiTi','SimKai',cursive; font-size:26px; color:#2d2d2d; line-height:1.2; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .e-type { font-size:10px; color:#bbb; font-family:'Inter',sans-serif; text-transform:uppercase; }
  .e-pinyin { font-family:'Inter',sans-serif; font-size:13px; line-height:1.4; display:flex; flex-wrap:wrap; align-items:baseline; gap:0; min-width:0; }
  .e-def { font-family:'Inter',sans-serif; font-size:13px; color:#555; line-height:1.4; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }
  .e-more { font-size:10px; color:#e87d7d; font-style:italic; margin-left:4px; flex-shrink:0; }
  .e-hsk { font-size:10px; color:#c41e3a; font-family:'Kaiti SC','STKaiti','KaiTi','SimKai',cursive; text-align:right; }
  .unlocked-words { padding:4px 16px 10px 148px; display:flex; flex-direction:column; gap:3px; background:#faf8f5; border-top:1px solid #f0ece5; }
  .uw-row { display:flex; align-items:center; gap:8px; padding:4px 8px; background:none; border:none; cursor:pointer; border-radius:3px; text-align:left; width:fit-content; }
  .uw-row:hover { background:#f0ece5; }
  .uw-text { font-family:'Kaiti SC','STKaiti','KaiTi','SimKai',cursive; font-size:20px; color:#2d2d2d; }
  .uw-arrow { font-size:11px; color:#6bb5b0; font-family:'Inter',sans-serif; font-style:italic; }
  .uw-empty { font-size:12px; color:#bbb; font-style:italic; font-family:'Inter',sans-serif; }
  .empty { font-size:13px; color:#bbb; font-style:italic; font-family:'Inter',sans-serif; }
</style>
