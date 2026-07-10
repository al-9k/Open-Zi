<script lang="ts">
  import { currentPage, navigateTo, searchResults, openDictionary } from '$lib/stores';
  import { api } from '$lib/api';
  import type { Page } from '$lib/stores';
  import { numericToAccented } from '$lib/utils';

  let searchQuery = $state('');
  let searching = $state(false);

  const navItems: { page: Page; label: string; }[] = [
    { page: 'dashboard', label: 'Dashboard' },
    { page: 'my-decks', label: 'My Codex' },
    { page: 'my-decks2', label: 'My Decks' },
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
    } catch {
      searchResults.set({});
    } finally {
      searching = false;
    }
  }

  function handleSearchKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      doSearch();
    }
  }

  function clearSearch() {
    searchQuery = '';
  }

  function pronounceLogo() {
    const u = new SpeechSynthesisUtterance('Open字');
    u.lang = 'zh-CN';
    u.rate = 0.8;
    speechSynthesis.speak(u);
  }
</script>

<aside class="sidebar">
  <!-- Spiral binding holes -->
  <div class="spiral-binding">
    {#each Array(22) as _, i}
      <div class="spiral-hole" style="top: {20 + i * 32}px"></div>
    {/each}
  </div>

  <!-- Torn paper fringe edge -->
  <div class="torn-fringe"></div>

  <!-- Sidebar content -->
  <div class="sidebar-content">
    <!-- Search bar -->
    <div class="search-area">
      <div class="search-input-wrap">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="搜索..."
          onkeydown={handleSearchKeydown}
          class="search-input"
        />
        <button onclick={doSearch} class="search-btn" disabled={searching} aria-label="Search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </div>
      {#if searchQuery}
        <button onclick={() => { searchQuery = ''; }} class="clear-search">clear</button>
      {/if}
    </div>

    <!-- Navigation tab dividers -->
    <nav class="nav-tabs">
      {#each navItems.slice(0, 3) as item}
        <button
          class="nav-tab"
          class:active={$currentPage === item.page}
          style="background: {['#fff176','#81d4fa','#ce93d8'][navItems.indexOf(item)]}; box-shadow: 0 4px 0 {['#d4c940','#5aa8d4','#a870b4'][navItems.indexOf(item)]}, 0 6px 10px rgba(0,0,0,0.20);"
          onclick={() => {
            navigateTo(item.page);
          }}
        >
          {#if $currentPage === item.page}
            <span class="coral-dot"></span>
          {/if}
          <span class="nav-label">{item.label}</span>
        </button>
      {/each}
    </nav>

    <!-- Logo above Settings -->
    <div class="app-title">
      <span class="title-open">Open</span>
      <div class="title-seal" onclick={pronounceLogo} role="button" tabindex="0" title="Pronounce" onkeydown={(e) => e.key === 'Enter' && pronounceLogo()}>
        <span class="title-zi">字</span>
      </div>
    </div>

    <!-- Settings button (standalone, bottom) -->
    {#each navItems.slice(3) as item}
      <button
        class="nav-tab settings-tab"
        class:active={$currentPage === item.page}
        onclick={() => {
          navigateTo(item.page);
        }}
      >
        {#if $currentPage === item.page}
          <span class="coral-dot"></span>
        {/if}
        <span class="nav-label">{item.label}</span>
      </button>
    {/each}
  </div>
</aside>

<style>
  .sidebar {
    position: relative;
    width: 240px;
    min-width: 240px;
    height: 100vh;
    background-color: #4a8c63;
    background-image:
      radial-gradient(circle, #3a704f 0.6px, transparent 0.6px);
    background-size: 18px 18px;
    border-right: 1px solid #3a704f;
    display: flex;
    flex-shrink: 0;
    overflow: visible;
  }

  .sidebar::after {
    content: '';
    position: absolute;
    right: -6px;
    top: 0;
    bottom: 0;
    width: 6px;
    background: linear-gradient(to right, #3a704f, #1e2424);
    z-index: 1;
    pointer-events: none;
    opacity: 0.5;
  }

  /* Spiral binding down the left edge */
  .spiral-binding {
    position: absolute;
    left: 8px;
    top: 0;
    bottom: 0;
    width: 24px;
    z-index: 10;
    pointer-events: none;
  }

  .spiral-hole {
    position: absolute;
    left: 4px;
    width: 16px;
    height: 8px;
    background: #2a4a35;
    border-radius: 4px;
    box-shadow:
      inset 0 1px 2px rgba(0, 0, 0, 0.4),
      0 0 0 2px #4a7c59,
      0 0 0 3px #3d6b4a;
  }

  /* Torn paper fringe */
  .torn-fringe {
    position: absolute;
    left: 32px;
    top: 0;
    bottom: 0;
    width: 8px;
    background: linear-gradient(
      to right,
      rgba(74, 124, 89, 0.9),
      transparent
    );
    z-index: 5;
    pointer-events: none;
  }

  .torn-fringe::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      to bottom,
      transparent,
      transparent 12px,
      rgba(0,0,0,0.08) 12px,
      rgba(0,0,0,0.08) 12.5px
    );
    mask-image: linear-gradient(
      to right,
      rgba(0, 0, 0, 0.5),
      transparent
    );
  }

  .sidebar-content {
    flex: 1;
    padding: 24px 16px 24px 44px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
    z-index: 2;
  }

  /* App title */
  .app-title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 4px 0 2px;
    margin-top: 6px;
    margin-bottom: -10px;
  }

  .title-open {
    font-family: 'Inter', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: #ffffff;
    text-shadow: 0 2px 0 rgba(0,0,0,0.2);
  }

  .title-seal {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: #c41e3a;
    border-radius: 8px;
    box-shadow: 0 4px 0 #8b1525, 0 6px 10px rgba(0,0,0,0.25);
    cursor: pointer;
    transition: all 0.1s ease;
  }

  .title-seal:hover {
    filter: brightness(0.92);
  }

  .title-seal:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 #8b1525, 0 2px 4px rgba(0,0,0,0.10);
  }

  .title-zi {
    font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', 'SimKai', cursive;
    font-size: 24px;
    color: #ffffff;
    line-height: 1;
  }

  /* Search */
  .search-area {
    position: relative;
  }

  .search-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input {
    width: 100%;
    padding: 8px 36px 8px 12px;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 13px;
    color: #2d2d2d;
    background: #fefeff;
    border: 1px solid #b8d4d0;
    border-radius: 8px;
    outline: none;
    box-shadow: 0 3px 0 #b8d4d0, 0 4px 8px rgba(0,0,0,0.06);
    transition: border-color 0.15s;
  }

  .search-input::placeholder {
    color: #c4bfb5;
    font-style: italic;
  }

  .search-input:focus {
    border-color: #6bb5b0;
  }

  .search-btn {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    padding: 4px;
    color: #6bb5b0;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    border-radius: 3px;
  }

  .search-btn:hover {
    color: #4a8a85;
  }

  .clear-search {
    font-size: 11px;
    color: #2a4a38;
    margin-top: 4px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    padding: 0;
    font-weight: 500;
  }

  .clear-search:hover {
    color: #1a3025;
  }

  .nav-tabs {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 6px;
    flex: 1;
  }

  .nav-tab {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #444;
    background: none;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.1s ease;
    text-align: left;
    width: 100%;
    overflow: hidden;
  }

  .nav-tab:hover {
    filter: brightness(0.95);
  }

  .nav-tab:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.10) !important;
  }

  .nav-tab.active {
    font-weight: 600;
    color: #222;
  }

  .settings-tab {
    background: #3a6b4a;
    box-shadow: 0 4px 0 #2a5038, 0 6px 10px rgba(0,0,0,0.20);
    color: #d0e8d4;
    margin-top: auto;
  }

  .settings-tab.active {
    color: #fff;
  }

  .coral-dot {
    width: 6px;
    height: 6px;
    background: #c41e3a;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .nav-label {
    flex: 1;
  }
</style>
