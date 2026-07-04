<script lang="ts">
  import { currentPage, navigateTo, searchResults, openDictionary } from '$lib/stores';
  import { api } from '$lib/api';
  import type { Page } from '$lib/stores';
  import { numericToAccented } from '$lib/utils';

  let searchQuery = $state('');
  let searching = $state(false);

  const navItems: { page: Page; label: string }[] = [
    { page: 'dashboard', label: 'Dashboard' },
    { page: 'my-bank', label: 'My Bank' },
    { page: 'my-decks', label: 'My Codex' },
    { page: 'settings', label: 'Settings' },
  ];

  async function doSearch() {
    const q = searchQuery.trim();
    if (!q) {
      searchResults.set(null);
      return;
    }
    searching = true;
    try {
      const results = await api.search(q);
      searchResults.set(results);
    } catch {
      searchResults.set(null);
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
    searchResults.set(null);
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
    <!-- App title -->
    <div class="app-title">
      <span class="title-char">开</span>
      <span class="title-char">字</span>
    </div>

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
        <button onclick={clearSearch} class="clear-search">clear</button>
      {/if}

      <!-- Search Results -->
      {#if $searchResults}
        <div class="search-results">
          {#each Object.entries($searchResults) as [text, item]}
            <button
              class="search-result-item"
              onclick={() => openDictionary(text, item.type === 'w')}
            >
              <span class="search-result-char">{text}</span>
              <span class="search-result-pinyin">
                {numericToAccented(item.pinyin.split(';')[0].trim())}
              </span>
            </button>
          {/each}
          {#if Object.keys($searchResults).length === 0}
            <p class="no-results">No results</p>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Navigation tab dividers -->
    <nav class="nav-tabs">
      {#each navItems as item}
        <button
          class="nav-tab"
          class:active={$currentPage === item.page}
          onclick={() => {
            navigateTo(item.page);
            clearSearch();
          }}
        >
          {#if $currentPage === item.page}
            <span class="coral-dot"></span>
          {/if}
          <span class="nav-label">{item.label}</span>
        </button>
      {/each}
    </nav>
  </div>
</aside>

<style>
  .sidebar {
    position: relative;
    width: 240px;
    min-width: 240px;
    height: 100vh;
    background-color: #4a7c59;
    background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
    background-size: 200px 200px;
    border-right: 1px solid #3d6b4a;
    display: flex;
    flex-shrink: 0;
    overflow: visible;
  }

  .sidebar::after {
    content: '';
    position: absolute;
    right: -8px;
    top: 0;
    bottom: 0;
    width: 8px;
    background: linear-gradient(to right, #3d6b4a, #1a1a1c);
    z-index: 1;
    pointer-events: none;
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
    gap: 4px;
    margin-bottom: 4px;
  }

  .title-char {
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 36px;
    color: #e8f0e8;
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
    padding: 8px 32px 8px 10px;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 13px;
    color: #e0d8cc;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 4px;
    outline: none;
    transition: border-color 0.2s;
  }

  .search-input::placeholder {
    color: #c4bfb5;
    font-style: italic;
  }

  .search-input:focus {
    border-color: #e87d7d;
  }

  .search-btn {
    position: absolute;
    right: 4px;
    padding: 4px;
    color: #888888;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    border-radius: 3px;
  }

  .search-btn:hover {
    color: #e87d7d;
    background: rgba(232, 125, 125, 0.1);
  }

  .clear-search {
    font-size: 10px;
    color: #bbbbbb;
    margin-top: 4px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    padding: 0;
  }

  .clear-search:hover {
    color: #e87d7d;
  }

  /* Search results dropdown */
  .search-results {
    margin-top: 6px;
    max-height: 240px;
    overflow-y: auto;
    background: rgba(255,255,255,0.95);
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 3px;
    box-shadow: 2px 3px 8px rgba(0, 0, 0, 0.15);
  }

  .search-result-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 10px;
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    border-bottom: 1px solid #f0ece5;
  }

  .search-result-item:hover {
    background: #faf7f2;
  }

  .search-result-char {
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 22px;
    color: #2d2d2d;
    min-width: 36px;
  }

  .search-result-pinyin {
    font-size: 11px;
    color: #888888;
  }

  .no-results {
    padding: 12px;
    font-size: 12px;
    color: #bbbbbb;
    text-align: center;
    margin: 0;
  }

  /* Navigation tabs */
  .nav-tabs {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 8px;
    margin-right: -16px;
  }

  .nav-tab {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px 10px 12px;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #444;
    background: none;
    border: none;
    cursor: pointer;
    border-radius: 0;
    transition: all 0.15s ease;
    text-align: left;
    width: calc(100% + 7px);
    margin-right: -7px;
    border-left: 4px solid transparent;
  }

  .nav-tab:nth-child(1) { background: #ffe082; border-left-color: #d4a830; }
  .nav-tab:nth-child(2) { background: #f8bbd0; border-left-color: #d4889e; }
  .nav-tab:nth-child(3) { background: #eeeeee; border-left-color: #bbb; }
  .nav-tab:nth-child(4) { background: #cec0e8; border-left-color: #a898c8; }
  .nav-tab:nth-child(2) { background: #f8bbd0; border-left-color: #d4889e; }
  .nav-tab:nth-child(3) { background: #eeeeee; border-left-color: #bbb; }
  .nav-tab:nth-child(4) { background: #cec0e8; border-left-color: #a898c8; }

  .nav-tab:hover {
    filter: brightness(0.96);
    transform: translateX(4px);
  }

  .nav-tab.active {
    font-weight: 600;
    box-shadow: 2px 2px 6px rgba(0,0,0,0.15);
    transform: translateX(6px);
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
