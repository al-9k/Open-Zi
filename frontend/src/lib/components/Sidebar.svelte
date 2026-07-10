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
          {#if $currentPage === item.page}<span class="active-dot"></span>{/if}
          <span>{item.label}</span>
        </button>
      {/each}
    </nav>

    <!-- Settings at bottom -->
    {#each navItems.slice(4) as item}
      <button class="nav-tab settings-tab" class:active={$currentPage === item.page} onclick={() => navigateTo(item.page)}>
        {#if $currentPage === item.page}<span class="active-dot"></span>{/if}
        <span>{item.label}</span>
      </button>
    {/each}
  </div>
</aside>

<style>
  .sidebar {
    width: 220px;
    min-width: 220px;
    height: 100vh;
    background: #3a3a3a;
    display: flex;
    flex-shrink: 0;
  }

  .sidebar-content {
    flex: 1;
    padding: 28px 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .app-title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 8px 0 12px;
  }

  .title-open {
    font-family: 'Inter', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.3px;
  }

  .title-seal {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    background: #c41e3a;
    cursor: pointer;
    transition: transform 0.1s;
  }

  .title-seal:hover { transform: scale(1.06); }
  .title-seal:active { transform: scale(0.97); }

  .title-zi {
    font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', 'SimKai', cursive;
    font-size: 22px;
    color: #ffffff;
    line-height: 1;
  }

  .search-area { position: relative; }

  .search-input-wrap { position: relative; display: flex; align-items: center; }

  .search-input {
    width: 100%;
    padding: 8px 34px 8px 12px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    color: #3a3a3a;
    background: #4a4a4a;
    border: 1px solid #555;
    border-radius: 0;
    outline: none;
    color: #e8e5e0;
  }

  .search-input::placeholder { color: #8a8680; }

  .search-input:focus { border-color: #c41e3a; background: #4f4f4f; }

  .search-btn {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    padding: 4px;
    color: #8a8680;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
  }

  .search-btn:hover { color: #c41e3a; }

  .clear-search {
    font-size: 11px;
    color: #8a8680;
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
    gap: 2px;
    flex: 1;
  }

  .nav-tab {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #b0aaa2;
    background: none;
    border: none;
    border-radius: 0;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: all 0.12s;
  }

  .nav-tab:hover { color: #e8e5e0; background: rgba(255,255,255,0.04); }

  .nav-tab.active { color: #ffffff; background: rgba(196,30,57,0.15); font-weight: 600; }

  .settings-tab {
    margin-top: auto;
    color: #8a8680;
  }

  .settings-tab.active { color: #e8e5e0; background: rgba(196,30,57,0.12); }

  .active-dot {
    width: 5px;
    height: 5px;
    background: #c41e3a;
    flex-shrink: 0;
  }
</style>
