<script lang="ts">
  import { currentPage, navigateTo, searchResults } from '$lib/stores';
  import { api } from '$lib/api';
  import type { Page } from '$lib/stores';

  let searchQuery = $state('');
  let searching = $state(false);

  const navItems: { page: Page; label: string }[] = [
    { page: 'dashboard', label: 'Dashboard' },
    { page: 'my-decks', label: 'Codex' },
    { page: 'my-decks2', label: 'Decks' },
    { page: 'personal-dict', label: 'Dictionary' },
    { page: 'settings', label: 'Settings' },
  ];

  async function doSearch() {
    const q = searchQuery.trim();
    if (!q) return;
    searching = true;
    try {
      const results = await api.search(q);
      searchResults.set(results);
      navigateTo('search-results');
    } catch { searchResults.set({}); }
    finally { searching = false; }
  }
</script>

<aside class="sidebar">
  <div class="sidebar-stripe"></div>
  <div class="sidebar-content">
    <!-- Logo -->
    <div class="app-title">
      <span class="title-open">Open</span>
      <div class="title-seal" onclick={() => {
        const u = new SpeechSynthesisUtterance('Open字');
        u.lang = 'zh-CN'; u.rate = 0.8;
        speechSynthesis.speak(u);
      }} role="button" tabindex="0" title="Pronounce" onkeydown={(e) => e.key === 'Enter' && speechSynthesis.speak(new SpeechSynthesisUtterance('Open字'))}>
        <span class="title-zi">字</span>
      </div>
    </div>

    <!-- Search -->
    <div class="search-area">
      <div class="search-input-wrap">
        <input type="text" bind:value={searchQuery} placeholder="搜索..." onkeydown={(e) => e.key === 'Enter' && doSearch()} class="search-input" />
        <button onclick={doSearch} class="search-btn" disabled={searching} aria-label="Search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </div>
      {#if searchQuery}
        <button onclick={() => { searchQuery = ''; }} class="clear-search">clear</button>
      {/if}
    </div>

    <!-- Navigation -->
    <nav class="nav-tabs">
      {#each navItems.slice(0, 4) as item}
        <button class="nav-tab" class:active={$currentPage === item.page} onclick={() => navigateTo(item.page)}>
          <span class="nav-label">{item.label}</span>
          {#if $currentPage === item.page}<span class="active-mark"></span>{/if}
        </button>
      {/each}
    </nav>

    <!-- Settings at bottom -->
    {#each navItems.slice(4) as item}
      <button class="nav-tab settings-tab" class:active={$currentPage === item.page} onclick={() => navigateTo(item.page)}>
        <span class="nav-label">{item.label}</span>
        {#if $currentPage === item.page}<span class="active-mark"></span>{/if}
      </button>
    {/each}
  </div>
</aside>

<style>
  .sidebar {
    position: relative;
    width: 220px;
    min-width: 220px;
    height: 100vh;
    background: #2a2a2a;
    display: flex;
    flex-shrink: 0;
  }

  .sidebar-stripe {
    position: absolute;
    top: 0; bottom: 0;
    right: 0;
    width: 3px;
    background: #c41e3a;
  }

  .sidebar-content {
    flex: 1;
    padding: 32px 18px 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .app-title {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  .title-open {
    font-family: 'Inter', sans-serif;
    font-size: 26px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.5px;
  }

  .title-seal {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    background: #c41e3a;
    cursor: pointer;
    transition: transform 0.1s;
    margin-left: auto;
  }

  .title-seal:hover { transform: scale(1.06); }
  .title-seal:active { transform: scale(0.96); }

  .title-zi {
    font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', 'SimKai', cursive;
    font-size: 24px;
    color: #ffffff;
    line-height: 1;
  }

  .search-area { position: relative; }

  .search-input-wrap { position: relative; display: flex; align-items: center; }

  .search-input {
    width: 100%;
    padding: 9px 34px 9px 12px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    outline: none;
    color: #e0dcd6;
  }

  .search-input::placeholder { color: #6a6560; }
  .search-input:focus { border-color: #c41e3a; background: rgba(255,255,255,0.09); }

  .search-btn {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    padding: 4px;
    color: #6a6560;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
  }

  .search-btn:hover { color: #c41e3a; }

  .clear-search {
    font-size: 11px;
    color: #6a6560;
    margin-top: 4px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    padding: 0;
  }

  .clear-search:hover { color: #c41e3a; }

  .nav-tabs {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1;
  }

  .nav-tab {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #9a9590;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: all 0.15s;
    position: relative;
  }

  .nav-tab:hover { color: #e0dcd6; }

  .nav-tab.active {
    color: #ffffff;
    font-weight: 600;
    background: rgba(196,30,57,0.12);
  }

  .settings-tab { margin-top: auto; color: #8a8680; }

  .active-mark {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    background: #c41e3a;
  }

  .nav-label { flex: 1; }
</style>
