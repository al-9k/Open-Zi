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
  <div class="sidebar-content">
    <!-- Logo -->
    <div class="logo-wrap">
      <span class="logo-open">Open</span>
      <div class="logo-seal" onclick={() => {
        const u = new SpeechSynthesisUtterance('Open字');
        u.lang = 'zh-CN'; u.rate = 0.8;
        speechSynthesis.speak(u);
      }} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && speechSynthesis.speak(new SpeechSynthesisUtterance('Open字'))}>
        <span class="logo-zi">字</span>
      </div>
    </div>

    <div class="motto">Gotta learn 'em all</div>

    <!-- Search -->
    <div class="search-area">
      <input type="text" bind:value={searchQuery} placeholder="搜索..." onkeydown={(e) => e.key === 'Enter' && doSearch()} class="search-input" />
      <button onclick={doSearch} class="search-btn" disabled={searching}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
      {#if searchQuery}
        <button onclick={() => { searchQuery = ''; }} class="clear-search">clear</button>
      {/if}
    </div>

    <nav class="nav-tabs">
      {#each navItems.slice(0, 4) as item}
        <button class="nav-tab" class:active={$currentPage === item.page} onclick={() => navigateTo(item.page)}>
          {item.label}
        </button>
      {/each}
    </nav>

    {#each navItems.slice(4) as item}
      <button class="nav-tab settings-tab" class:active={$currentPage === item.page} onclick={() => navigateTo(item.page)}>
        {item.label}
      </button>
    {/each}
  </div>
</aside>

<style>
  .sidebar {
    width: 200px;
    min-width: 200px;
    height: 100%;
    background: #1a1a1a;
    display: flex;
    flex-shrink: 0;
    border-right: 2px solid #c41e3a;
  }

  .sidebar-content {
    flex: 1;
    padding: 24px 14px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .logo-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding-bottom: 14px;
    border-bottom: 2px solid #c41e3a;
  }

  .logo-open {
    font-family: 'Inter', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.3px;
  }

  .logo-seal {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px; height: 34px;
    background: #c41e3a;
    cursor: pointer;
    transition: transform 0.1s;
    border: 2px solid #ffffff;
  }

  .logo-seal:hover { transform: scale(1.08); }
  .logo-seal:active { transform: scale(0.95); }

  .logo-zi {
    font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', 'SimKai', cursive;
    font-size: 22px; color: #ffffff; line-height: 1;
  }

  .motto {
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    font-weight: 800;
    color: #c41e3a;
    letter-spacing: 3px;
    text-align: center;
  }

  .search-area { position: relative; }
  .search-input {
    width: 100%;
    padding: 8px 34px 8px 10px;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    background: #2a2a2a;
    border: 2px solid #3a3a3a;
    outline: none;
    color: #e0dcd6;
  }
  .search-input:focus { border-color: #c41e3a; }
  .search-input::placeholder { color: #5a5550; }

  .search-btn {
    position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
    padding: 3px; color: #5a5550; background: none; border: none; cursor: pointer;
  }
  .search-btn:hover { color: #c41e3a; }

  .clear-search {
    font-size: 10px; color: #5a5550; margin-top: 3px;
    background: none; border: none; cursor: pointer; font-family: 'Inter', sans-serif; padding: 0;
  }
  .clear-search:hover { color: #c41e3a; }

  .nav-tabs { display: flex; flex-direction: column; gap: 4px; flex: 1; }

  .nav-tab {
    padding: 9px 12px;
    font-family: 'Inter', sans-serif;
    font-size: 12px; font-weight: 600;
    color: #8a8580;
    background: none;
    border: 2px solid transparent;
    cursor: pointer;
    text-align: left; width: 100%;
    transition: all 0.1s;
  }

  .nav-tab:hover { color: #ffffff; }
  .nav-tab.active { color: #ffffff; border-color: #c41e3a; background: rgba(220,10,45,0.1); }

  .settings-tab { margin-top: auto; }
</style>
