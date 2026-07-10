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
  import PersonalDictionary from '$lib/pages/PersonalDictionary.svelte';
  import LoadingScreen from '$lib/components/LoadingScreen.svelte';

  let initialized = $state(false);

  onMount(async () => {
    try { await api.load(); } catch {}
    try { await api.refresh(); } catch {}
    try {
      const [chars, words, statsData] = await Promise.all([
        api.getCharacters(), api.getWords(), api.getStats(),
      ]);
      bankDict.set(chars); beastiaryDict.set(words); stats.set(statsData);
    } catch (e) { console.error(e); }
    initialized = true;
  });
</script>

<div class="desk">
  <Sidebar />
  <main class="main-area ruler-scroll">
    {#if !initialized}
      <LoadingScreen />
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
    {:else if $currentPage === 'personal-dict'}
      <PersonalDictionary />
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
    background-color: #faf8f6;
  }

  .main-area {
    flex: 1;
    min-width: 0;
    display: flex;
    overflow-y: auto;
  }
</style>
