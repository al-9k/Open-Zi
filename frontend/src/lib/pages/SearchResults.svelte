<script lang="ts">
  import { onMount } from 'svelte';
  import { searchResults, openDictionary, navigateTo } from '$lib/stores';
  import { numericToAccented, splitPronunciations, getToneNumber, getToneColor } from '$lib/utils';

  let results = $state<Record<string, import('$lib/types').SearchResultItem>>({});

  $effect(() => {
    results = $searchResults || {};
  });
</script>

<div class="page">
  {#if Object.keys(results).length > 0}
    <div class="results-list">
      {#each Object.entries(results) as [text, item]}
        <button class="result-row" onclick={() => openDictionary(text, item.type === 'w')}>
          <span class="r-char">{text}</span>
          <span class="r-meta">
            {#each splitPronunciations(item.pinyin, item.definition) as pron, pi}
              {#if pi === 0}
                {#each pron.pinyin.split(' ').filter(Boolean) as syl, si}
                  {#if si > 0}{' '}{/if}
                  <span class="rp-colored" style="color:{getToneColor(getToneNumber(syl))}">{numericToAccented(syl)}</span>
                  <span class="rp-num">({syl.toLowerCase()})</span>
                {/each}
                <span class="rp-dash">—</span>
                <span class="rp-def">{pron.definition.split('; ').filter(Boolean).join(' • ')}</span>
                {#if splitPronunciations(item.pinyin, item.definition).length > 1}
                  <span class="rp-more">+{splitPronunciations(item.pinyin, item.definition).length - 1} more</span>
                {/if}
              {/if}
            {/each}
          </span>
          <span class="r-type">{item.type === 'c' ? 'char' : 'word'}</span>
          {#if item.hsk}
            <span class="r-hsk">HSK {item.hsk}</span>
          {/if}
        </button>
      {/each}
    </div>
  {:else}
    <p class="empty">No results</p>
  {/if}
</div>

<style>
  .page { flex:1; min-height:0; padding:28px; display:flex; flex-direction:column; gap:16px; }
  .results-list { display:flex; flex-direction:column; background:#ffffff; border:3px solid #2a2a2a; box-shadow:3px 3px 0 #1a1a1a; overflow:hidden; }
  .result-row { display:grid; grid-template-columns:120px 1fr 50px 55px; gap:10px; align-items:baseline; padding:10px 16px; background:none; border:none; border-bottom:2px solid #2a2a2a; cursor:pointer; text-align:left; width:100%; }
  .result-row:hover { background:rgba(196,30,57,0.05); }
  .result-row:last-child { border-bottom:none; }
  .r-char { font-family:'Kaiti SC','STKaiti','KaiTi','SimKai',cursive; font-size:26px; color:#1a1a1a; line-height:1.2; }
  .r-meta { font-family:'Inter',sans-serif; font-size:13px; line-height:1.4; display:flex; align-items:baseline; flex-wrap:wrap; gap:0; min-width:0; }
  .rp-colored { font-weight:600; font-size:13px; margin-right:1px; white-space:nowrap; }
  .rp-num { font-size:10px; color:#9a9590; margin-right:5px; white-space:nowrap; }
  .rp-dash { color:#9a9590; margin:0 4px; flex-shrink:0; }
  .rp-def { color:#5a5550; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .rp-more { font-size:10px; color:#c41e3a; font-style:italic; margin-left:4px; flex-shrink:0; white-space:nowrap; }
  .r-type { font-size:10px; color:#9a9590; font-family:'Inter',sans-serif; text-align:right; text-transform:uppercase; font-weight:700; }
  .r-hsk { font-size:10px; color:#c41e3a; font-family:'Kaiti SC','STKaiti','KaiTi','SimKai',cursive; text-align:right; }
  .empty { font-size:14px; color:#9a9590; font-style:italic; font-family:'Inter',sans-serif; padding:20px 0; }
</style>