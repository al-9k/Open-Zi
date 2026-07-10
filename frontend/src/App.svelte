<script lang="ts">
  import { onMount } from 'svelte';
  import { currentPage, bankDict, beastiaryDict, stats } from '$lib/stores';
  import { api } from '$lib/api';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Dashboard from '$lib/pages/Dashboard.svelte';
  import DictionaryEntry from '$lib/pages/DictionaryEntry.svelte';
  import MyBank from '$lib/pages/MyBank.svelte';
  import MyDecks from '$lib/pages/MyDecks.svelte';
  import Decks from '$lib/pages/Decks.svelte';
  import SearchResults from '$lib/pages/SearchResults.svelte';
  import Settings from '$lib/pages/Settings.svelte';

  let initialized = $state(false);

  onMount(async () => {
    try { await api.load(); } catch {}
    try { await api.refresh(); } catch {}
    try {
      const [chars, words, statsData] = await Promise.all([
        api.getCharacters(), api.getWords(), api.getStats(),
      ]);
      bankDict.set(chars);
      beastiaryDict.set(words);
      stats.set(statsData);
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
    initialized = true;
  });
</script>

<div class="desk">
  <Sidebar />
  <main class="main-area ruler-scroll">
    {#if !initialized}
      <div class="loading-screen">
        <div class="loading-card">
          <span class="loading-char">字</span>
          <p class="loading-text">Loading...</p>
        </div>
      </div>
    {:else if $currentPage === 'dashboard'}
      <Dashboard />
    {:else if $currentPage === 'dictionary'}
      <DictionaryEntry />
    {:else if $currentPage === 'my-bank'}
      <MyBank />
    {:else if $currentPage === 'my-decks'}
      <MyDecks />
    {:else if $currentPage === 'my-decks2'}
      <Decks />
    {:else if $currentPage === 'search-results'}
      <SearchResults />
    {:else if $currentPage === 'settings'}
      <Settings />
    {/if}
  </main>
</div>

<style>
  .desk {
    display: flex;
    flex: 1;
    background-color: #1e2424;
    background-image:
      url("data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
    background-size: 300px 300px;
  }

  .main-area {
    flex: 1;
    min-width: 0;
    display: flex;
    overflow-y: auto;
  }

  .loading-screen {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loading-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    background: #ffffff;
    border: 1px solid #e8e5e0;
    border-radius: 2px;
    padding: 32px 40px;
    box-shadow: 2px 3px 8px rgba(0, 0, 0, 0.08);
    transform: rotate(-1deg);
  }

  .loading-char {
    font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', 'SimKai', cursive;
    font-size: 48px;
    color: #c41e3a;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .loading-text {
    font-size: 12px;
    color: #888888;
    font-family: 'Inter', sans-serif;
    margin: 0;
  }

  .stub-page {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #888;
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    font-style: italic;
  }
</style>
