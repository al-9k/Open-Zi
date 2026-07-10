<script lang="ts">
  import { onMount } from 'svelte';
  import { stats as ss, bankDict, beastiaryDict, openDictionary, masteredChars } from '$lib/stores';
  import { api } from '$lib/api';
  import { numericToAccented, getToneNumber, getToneColor, splitPronunciations, computeCoverage } from '$lib/utils';
  import CharacterCard from '$lib/components/CharacterCard.svelte';
  import AddBar from '$lib/components/AddBar.svelte';
  import type { StatsData, DictionaryEntry } from '$lib/types';

  let stats = $state<StatsData | null>(null);
  let cotd = $state<DictionaryEntry | null>(null);
  let addText = $state(''); let addMsg = $state('');
  let loading = $state(true);
  let hv = $state<any>(null);

  let coverage = $derived.by(() => {
    const m = $masteredChars;
    const l: Record<string, { char_rank?: number | null }> = {};
    for (const [c, d] of Object.entries($bankDict)) if (m.has(c)) l[c] = d;
    return computeCoverage(l);
  });

  onMount(async () => {
    await Promise.all([loadStats(), loadCotd(), (async()=>{try{const r=await fetch('http://localhost:8000/api/highest-value').then(r=>r.json());if(r.character)hv=r;}catch(e){}})()]);
    loading = false;
  });

  async function loadCotd() {
    try { const d = await api.getDictionary(); const s = new Date().toDateString().split('').reduce((a,c)=>a+c.charCodeAt(0),0); cotd = d[s % d.length]; } catch(e){}
  }
  async function loadStats() {
    try { const d = await api.getStats(); stats = d; ss.set(d); } catch(e){}
  }
  async function handleAdd() {
    const t = addText.trim(); if(!t)return;
    try {
      const r = await api.addCharacters(t);
      const p: string[] = [];
      if(r.added.length)p.push('Added: '+r.added.join(''));
      if(r.existed.length)p.push('Already in bank: '+r.existed.join(''));
      addMsg = p.join(' | '); addText = '';
      await loadStats();
      const [c,w] = await Promise.all([api.getCharacters(),api.getWords()]);
      bankDict.set(c);beastiaryDict.set(w);
    } catch(e){ addMsg = 'Failed'; }
  }
  function recent() {
    if(!stats?.char_timeline)return[];
    const e:{char:string;date:string}[]=[];
    for(const[d,cs]of Object.entries(stats.char_timeline))for(const c of cs)e.push({char:c,date:d});
    e.sort((a,b)=>b.date.localeCompare(a.date));
    return e.slice(0,10).map(x=>({char:x.char,hsk:$bankDict[x.char]?.hsk??null,frequencyRank:$bankDict[x.char]?.frequency_rank??null}));
  }
</script>

<div class="page">
  {#if loading}
    <slot name="loading"><p class="tx">Loading...</p></slot>
  {:else}
    <!-- Stats -->
    <div class="stats">
      <div class="stat"><span class="sn">{stats?.char_count??0}</span><span class="sl">caught</span></div>
      <div class="stat"><span class="sn">{stats?.word_count??0}</span><span class="sl">words</span></div>
      <div class="stat"><span class="sn">{stats?.dictionary_count??0}</span><span class="sl">total</span></div>
    </div>

    <!-- Coverage HP bar -->
    <div class="block">
      <div class="hp-row">
        <span class="hp-label">COVERAGE</span>
        <span class="hp-val">{coverage}%</span>
      </div>
      <div class="hp-bar"><div class="hp-fill" style="width:{coverage}%"></div></div>
      <p class="hp-sub">Based on HanziCraft frequency data</p>
    </div>

    <!-- Character of the Day -->
    {#if cotd}
      <div class="block cotd-block" onclick={()=>openDictionary(cotd.character,false)} role="button" tabindex="0" onkeydown={(e)=>e.key==='Enter'&&openDictionary(cotd.character,false)}>
        <span class="cotd-char">{cotd.character}</span>
        <div class="cotd-info">
          <div class="cotd-pin">
            {#each splitPronunciations(cotd.pinyin,cotd.definition) as pr,pi}
              {#if pi===0}
                {#each pr.pinyin.split(' ').filter(Boolean) as s,si}
                  {#if si>0}{' '}{/if}
                  <span style="color:{getToneColor(getToneNumber(s))}">{numericToAccented(s)}</span>
                  <span class="cotd-num">({s.toLowerCase()})</span>
                {/each}
              {/if}
            {/each}
          </div>
          <p class="cotd-def">
            {#each splitPronunciations(cotd.pinyin,cotd.definition) as pr,pi}
              {#if pi===0}{pr.definition.split('; ').filter(Boolean).join(' • ')}{/if}
            {/each}
          </p>
          <div class="cotd-tags">
            {#if cotd.frequency_rank}<span class="cotd-r">#{cotd.frequency_rank}</span>{/if}
            {#if cotd.hsk}<span class="cotd-h">HSK {cotd.hsk}</span>{/if}
          </div>
        </div>
      </div>
    {/if}

    {#if hv}
      <div class="block cotd-block" style="border-color:#2a8a4a;box-shadow:3px 3px 0 #2a8a4a;" onclick={()=>openDictionary(hv.character,false)}>
        <span class="cotd-char">{hv.character}</span>
        <div class="cotd-info">
          <div class="cotd-pin">
            {#each splitPronunciations(hv.pinyin,hv.definition) as pr,pi}
              {#if pi===0}
                {#each pr.pinyin.split(' ').filter(Boolean) as s,si}
                  {#if si>0}{' '}{/if}
                  <span style="color:{getToneColor(getToneNumber(s))}">{numericToAccented(s)}</span>
                  <span class="cotd-num">({s.toLowerCase()})</span>
                {/each}
              {/if}
            {/each}
          </div>
          <p class="cotd-def">+{hv.new_words} word{hv.new_words!==1?'s':''} &bull; +{hv.coverage_add}% coverage</p>
          <div class="cotd-tags">
            {#if hv.char_rank}<span class="cotd-r">#{hv.char_rank}</span>{/if}
            {#if hv.hsk}<span class="cotd-h">HSK {hv.hsk}</span>{/if}
          </div>
        </div>
      </div>
    {/if}

    <div class="block">      <AddBar bind:value={addText} onsubmit={handleAdd} />
      {#if addMsg}<p class="add-msg">{addMsg}</p>{/if}
    </div>

    <div class="block">
      <h3 class="block-h">Recently Added</h3>
      <div class="recents">
        {#each recent() as e}
          {@const r = ((e.char.charCodeAt(0)*7)%3)-1}
          <CharacterCard character={e.char} hsk={e.hsk} frequencyRank={e.frequencyRank} inBank={true} rotate={r} onclick={()=>openDictionary(e.char,false)} />
        {/each}
      </div>
      {#if recent().length===0}<p class="empty">Catch some characters!</p>{/if}
    </div>
  {/if}
</div>

<style>
  .page { flex:1; min-height:0; padding:28px; display:flex; flex-direction:column; gap:18px; }
  .tx { font-size:14px; color:#9a9590; font-family:'Inter',sans-serif; }

  .stats { display:flex; gap:10px; }
  .stats>* { flex:1; }
  .stat { background:#ffffff; border:3px solid #2a2a2a; box-shadow:3px 3px 0 #1a1a1a; padding:20px; display:flex; flex-direction:column; gap:0; }
  .sn { font-family:'Inter',sans-serif; font-size:42px; font-weight:900; color:#c41e3a; line-height:1; }
  .sl { font-family:'Inter',sans-serif; font-size:11px; font-weight:700; color:#5a5550; text-transform:uppercase; letter-spacing:1.5px; }

  .block { background:#ffffff; border:3px solid #2a2a2a; box-shadow:3px 3px 0 #1a1a1a; padding:20px; }
  .block-h { font-family:'Inter',sans-serif; font-size:12px; font-weight:800; color:#c41e3a; text-transform:uppercase; letter-spacing:1px; margin:0 0 14px; }

  .hp-row { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:6px; }
  .hp-label { font-family:'Inter',sans-serif; font-size:11px; font-weight:800; color:#5a5550; letter-spacing:1px; }
  .hp-val { font-family:'Inter',sans-serif; font-size:24px; font-weight:900; color:#c41e3a; }
  .hp-bar { height:12px; background:#e8e5e0; border:2px solid #1a1a1a; }
  .hp-fill { height:100%; background:#c41e3a; transition:width 0.6s; }
  .hp-sub { font-size:10px; color:#9a9590; font-family:'Inter',sans-serif; margin:6px 0 0; }

  .cotd-block { display:flex; gap:20px; align-items:flex-start; cursor:pointer; border:3px solid #c41e3a; box-shadow:3px 3px 0 #c41e3a; }
  .cotd-char { font-family:'Kaiti SC','STKaiti','KaiTi','SimKai',cursive; font-size:84px; color:#1a1a1a; line-height:1; flex-shrink:0; }
  .cotd-info { display:flex; flex-direction:column; gap:6px; padding-top:6px; min-width:0; }
  .cotd-pin { font-family:'Inter',sans-serif; font-size:16px; font-weight:700; display:flex; align-items:baseline; flex-wrap:wrap; }
  .cotd-num { font-size:10px; font-weight:400; color:#9a9590; margin-right:4px; }
  .cotd-def { font-family:'Inter',sans-serif; font-size:13px; color:#5a5550; line-height:1.5; margin:0; }
  .cotd-tags { display:flex; gap:10px; }
  .cotd-r { font-size:10px; color:#9a9590; font-family:'Inter',sans-serif; font-weight:600; }
  .cotd-h { font-size:10px; color:#c41e3a; font-family:'Inter',sans-serif; font-weight:700; }

  .add-msg { margin-top:10px; font-size:12px; color:#2a8a4a; font-family:'Inter',sans-serif; }

  .recents { display:flex; flex-wrap:wrap; gap:10px; }
  .empty { font-size:13px; color:#9a9590; font-style:italic; font-family:'Inter',sans-serif; }
</style>
