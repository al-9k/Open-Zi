<script lang="ts">
  import { onMount } from 'svelte';
  import { stats as ss, bankDict, beastiaryDict, openDictionary, masteredChars } from '$lib/stores';
  import { api } from '$lib/api';
  import { numericToAccented, getToneNumber, getToneColor, splitPronunciations, computeCoverage } from '$lib/utils';
  import CharacterCard from '$lib/components/CharacterCard.svelte';
  import AddBar from '$lib/components/AddBar.svelte';
  import StrokeOrder from '$lib/components/StrokeOrder.svelte';
  import type { StatsData, DictionaryEntry } from '$lib/types';

  let stats = $state<StatsData | null>(null);
  let cotd = $state<DictionaryEntry | null>(null);
  let hv = $state<any>(null);
  let addText = $state(''); let addMsg = $state('');
  let loading = $state(true);

  let coverage = $derived.by(() => {
    const m = $masteredChars;
    const l: Record<string, { char_rank?: number | null }> = {};
    for (const [c, d] of Object.entries($bankDict)) if (m.has(c)) l[c] = d;
    return computeCoverage(l);
  });

  onMount(async () => {
    await Promise.all([loadStats(), loadCotd(), loadHV()]);
    loading = false;
  });

  async function loadHV() {
    try { const r = await fetch('http://localhost:8000/api/highest-value').then(r=>r.json()); if(r.character)hv=r; } catch(e){}
  }
  async function loadCotd() {
    try { const d = await api.getDictionary(); const s = new Date().toDateString().split('').reduce((a,c)=>a+c.charCodeAt(0),0); cotd = d[s % d.length]; } catch(e){}
  }
  async function loadStats() { try { const d = await api.getStats(); stats = d; ss.set(d); } catch(e){} }
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
    <p class="tx">Loading...</p>
  {:else}
    <div class="layout">

      <!-- LEFT -->
      <div class="left">
        <div style="display:flex;flex-direction:column;gap:0;">
        <h3 class="block-h" style="margin:0;">MY PROGRESS</h3>
        <div class="stats">
          <div class="stat"><span class="sn">{stats?.char_count??0}</span><span class="sl">caught</span></div>
          <div class="stat"><span class="sn">{stats?.word_count??0}</span><span class="sl">words</span></div>
          <div class="stat"><span class="sn">{stats?.dictionary_count??0}</span><span class="sl">total</span></div>
        </div>
        </div>

        <div class="block">
          <div class="hp-row"><span class="hp-label">COVERAGE</span><span class="hp-val">{coverage}%</span></div>
          <div class="hp-bar"><div class="hp-fill" style="width:{coverage}%"></div></div>
          <p class="hp-sub">Based on HanziCraft frequency data</p>
        </div>

        {#if hv}
          <div style="display:flex;flex-direction:column;gap:0;">
          <h3 class="block-h" style="color:#2a8a4a;margin:0;">NEXT BEST CATCH</h3>
          <div class="block nbc" onclick={()=>openDictionary(hv.character,false)}>
            <span class="nbc-char">{hv.character}</span>
            <div class="nbc-info">
              <div class="nbc-pin">
                {#each splitPronunciations(hv.pinyin,hv.definition) as pr,pi}{#if pi===0}{#each pr.pinyin.split(' ').filter(Boolean) as s,si}{#if si>0}{' '}{/if}<span style="color:{getToneColor(getToneNumber(s))}">{numericToAccented(s)}</span><span class="nbc-num">({s.toLowerCase()})</span>{/each}{/if}{/each}
              </div>
              <p class="nbc-def">+{hv.new_words} word{hv.new_words!==1?'s':''} &bull; +{hv.coverage_add}% coverage</p>
              <div class="nbc-tags">{#if hv.char_rank}<span class="nbc-r">#{hv.char_rank}</span>{/if}{#if hv.hsk}<span class="nbc-h">HSK {hv.hsk}</span>{/if}</div>
            </div>
            <span class="nbc-count">+{hv.new_words}</span>
          </div>
          </div>
        {/if}

        <div style="display:flex;flex-direction:column;gap:0;">
        <h3 class="block-h" style="margin:0;">QUICK ADD CHARACTERS</h3>
        <div class="block">
          <AddBar bind:value={addText} onsubmit={handleAdd} />
          {#if addMsg}<p class="add-msg">{addMsg}</p>{/if}
          <h3 class="block-h" style="margin-top:14px;">Recently Added</h3>
          <div class="recents">
            {#each recent() as e}{@const r = ((e.char.charCodeAt(0)*7)%3)-1}
              <CharacterCard character={e.char} hsk={e.hsk} frequencyRank={e.frequencyRank} inBank={true} rotate={r} onclick={()=>openDictionary(e.char,false)} />
            {/each}
          </div>
          {#if recent().length===0}<p class="empty">Add some characters!</p>{/if}
        </div>
        </div>
      </div>

      <!-- RIGHT -->
      {#if cotd}
        <div class="right">
          <h3 class="block-h">CHARACTER OF THE DAY</h3>
          <div class="block cotd-box" onclick={()=>openDictionary(cotd.character,false)}>
            <StrokeOrder character={cotd.character} autoplay={true} />
            <div class="cotd-body">
              <div class="cotd-pin">
                {#each splitPronunciations(cotd.pinyin,cotd.definition) as pr,pi}{#if pi===0}{#each pr.pinyin.split(' ').filter(Boolean) as s,si}{#if si>0}{' '}{/if}<span style="color:{getToneColor(getToneNumber(s))}">{numericToAccented(s)}</span><span class="cotd-num">({s.toLowerCase()})</span>{/each}{/if}{/each}
              </div>
              <p class="cotd-def">{#each splitPronunciations(cotd.pinyin,cotd.definition) as pr,pi}{#if pi===0}{pr.definition.split('; ').filter(Boolean).join(' • ')}{/if}{/each}</p>
              <div class="cotd-tags">{#if cotd.frequency_rank}<span class="cotd-r">#{cotd.frequency_rank}</span>{/if}{#if cotd.hsk}<span class="cotd-h">HSK {cotd.hsk}</span>{/if}</div>
            </div>
          </div>
        </div>
      {/if}

    </div>
  {/if}
</div>

<style>
  .page { flex:1; min-height:0; padding:28px; display:flex; }
  .tx { font-size:14px; color:#9a9590; font-family:'Inter',sans-serif; }
  .layout { flex:1; display:flex; gap:22px; min-height:0; }
  .left { flex:1; display:flex; flex-direction:column; gap:14px; min-width:0; overflow-y:auto; padding-right:8px; }
  .right { width:280px; flex-shrink:0; display:flex; flex-direction:column; gap:0; position:sticky; top:28px; align-self:flex-start; max-height:calc(100vh - 56px); }

  .stats { display:flex; gap:10px; }
  .stats>*{flex:1;}
  .stat { background:#fff; border:3px solid #2a2a2a; box-shadow:3px 3px 0 #1a1a1a; padding:20px; display:flex; flex-direction:column; gap:0; }
  .sn { font-family:'Inter',sans-serif; font-size:42px; font-weight:900; color:#c41e3a; line-height:1; }
  .sl { font-family:'Inter',sans-serif; font-size:11px; font-weight:700; color:#5a5550; text-transform:uppercase; letter-spacing:1.5px; }
  .block { background:#fff; border:3px solid #2a2a2a; box-shadow:3px 3px 0 #1a1a1a; padding:20px; }
  .block-h { font-family:'Inter',sans-serif; font-size:12px; font-weight:800; color:#c41e3a; text-transform:uppercase; letter-spacing:1px; margin:0; }
  .hp-row { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:6px; }
  .hp-label { font-size:11px; font-weight:800; color:#5a5550; letter-spacing:1px; font-family:'Inter',sans-serif; }
  .hp-val { font-size:24px; font-weight:900; color:#c41e3a; font-family:'Inter',sans-serif; }
  .hp-bar { height:12px; background:#e8e5e0; border:2px solid #1a1a1a; }
  .hp-fill { height:100%; background:#c41e3a; transition:width 0.6s; }
  .hp-sub { font-size:10px; color:#9a9590; font-family:'Inter',sans-serif; margin:6px 0 0; }

  .nbc { display:flex; gap:18px; align-items:center; cursor:pointer; border-color:#2a8a4a; box-shadow:3px 3px 0 #2a8a4a; }
  .nbc-char { font-family:'Kaiti SC','STKaiti','KaiTi','SimKai',cursive; font-size:56px; color:#1a1a1a; line-height:1; flex-shrink:0; }
  .nbc-info { flex:1; display:flex; flex-direction:column; gap:4px; min-width:0; }
  .nbc-pin { font-family:'Inter',sans-serif; font-size:14px; font-weight:700; display:flex; align-items:baseline; flex-wrap:wrap; }
  .nbc-num { font-size:10px; font-weight:400; color:#9a9590; margin-right:4px; }
  .nbc-def { font-size:13px; color:#5a5550; margin:0; font-family:'Inter',sans-serif; }
  .nbc-tags { display:flex; gap:10px; }
  .nbc-r { font-size:10px; color:#9a9590; font-family:'Inter',sans-serif; font-weight:600; }
  .nbc-h { font-size:10px; color:#c41e3a; font-family:'Inter',sans-serif; font-weight:700; }
  .nbc-count { font-family:'Inter',sans-serif; font-size:28px; font-weight:900; color:#2a8a4a; flex-shrink:0; }

  .cotd-box { cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:12px; overflow:hidden; border-color:#c41e3a; box-shadow:3px 3px 0 #c41e3a; }
  .cotd-body { width:100%; display:flex; flex-direction:column; gap:8px; }
  .cotd-pin { font-family:'Inter',sans-serif; font-size:14px; font-weight:700; display:flex; align-items:baseline; flex-wrap:wrap; }
  .cotd-num { font-size:10px; font-weight:400; color:#9a9590; margin-right:4px; }
  .cotd-def { font-family:'Inter',sans-serif; font-size:13px; color:#5a5550; line-height:1.5; margin:0; overflow:hidden; display:-webkit-box; -webkit-line-clamp:5; -webkit-box-orient:vertical; }
  .cotd-tags { display:flex; gap:10px; }
  .cotd-r { font-size:10px; color:#9a9590; font-family:'Inter',sans-serif; font-weight:600; }
  .cotd-h { font-size:10px; color:#c41e3a; font-family:'Inter',sans-serif; font-weight:700; }

  .add-msg { margin-top:10px; font-size:13px; color:#2a8a4a; font-family:'Inter',sans-serif; }
  .recents { display:flex; flex-wrap:wrap; gap:10px; }
  .empty { font-size:13px; color:#9a9590; font-style:italic; font-family:'Inter',sans-serif; }
</style>
