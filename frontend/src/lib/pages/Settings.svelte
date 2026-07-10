<script lang="ts">
  import { api } from '$lib/api';
  import { bankDict, beastiaryDict, stats as statsStore } from '$lib/stores';
  import Button3D from '$lib/components/Button3D.svelte';

  let saveMsg = $state('');
  let loadMsg = $state('');
  let refreshMsg = $state('');

  async function handleRefresh() {
    try {
      await api.refresh();
      const [chars, words, stats] = await Promise.all([
        api.getCharacters(),
        api.getWords(),
        api.getStats(),
      ]);
      bankDict.set(chars);
      beastiaryDict.set(words);
      statsStore.set(stats);
      refreshMsg = 'Dictionary refreshed!';
      setTimeout(() => (refreshMsg = ''), 2000);
    } catch (e) {
      console.error('Refresh failed:', e);
      refreshMsg = 'Refresh failed';
    }
  }

  async function handleSave() {
    try {
      await api.save();
      saveMsg = 'Saved!';
      setTimeout(() => (saveMsg = ''), 2000);
    } catch (e) {
      console.error('Save failed:', e);
      saveMsg = 'Save failed';
    }
  }

  async function handleLoad() {
    try {
      await api.load();
      await api.refresh();
      loadMsg = 'Loaded! Reloading data...';
      // Refresh all data
      const [chars, words, stats] = await Promise.all([
        api.getCharacters(),
        api.getWords(),
        api.getStats(),
      ]);
      bankDict.set(chars);
      beastiaryDict.set(words);
      statsStore.set(stats);
      setTimeout(() => (loadMsg = ''), 2000);
    } catch (e) {
      console.error('Load failed:', e);
      loadMsg = 'Load failed';
    }
  }

  async function handleExport() {
    try {
      const csv = await api.exportAnki();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'openzi-export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      console.error('Export failed');
    }
  }
</script>

<div class="page">

  <div class="section">
    <h2 class="section-title">Data</h2>
    <div class="btn-row">
      <Button3D size="md" variant="coral" onclick={handleSave}>Save</Button3D>
      <Button3D size="md" variant="teal" onclick={handleLoad}>Load</Button3D>
      <Button3D size="md" variant="coral" onclick={handleRefresh}>Refresh Dictionary</Button3D>
      <Button3D size="md" variant="teal" onclick={handleExport}>Export to Anki</Button3D>
    </div>
    {#if saveMsg}
      <p class="msg success">{saveMsg}</p>
    {/if}
    {#if loadMsg}
      <p class="msg info">{loadMsg}</p>
    {/if}
    {#if refreshMsg}
      <p class="msg success">{refreshMsg}</p>
    {/if}
  </div>

  <div class="section">
    <h2 class="section-title">About</h2>
    <div class="about-content">
      <div class="about-logo">
        <span class="about-zi">字</span>
      </div>
      <div class="about-info">
        <p class="about-name">OpenZi</p>
        <p class="about-ver">Version 1.0.0</p>
        <p class="about-desc">A Chinese vocabulary learning companion.</p>
        <p class="about-desc">Built with Tauri + Svelte + Tailwind.</p>
      </div>
    </div>
  </div>
</div>

<style>
  .page {
    flex: 1;
    min-height: 0;
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .section {
    position: relative;
    background: #fefeff;
    background-image: radial-gradient(circle, #c8d4e4 0.8px, transparent 0.8px);
    background-size: 20px 20px;
    border: none;
    border-radius: 2px;
    padding: 20px;
    box-shadow:
      2px 3px 10px rgba(0, 0, 0, 0.25),
      4px 6px 18px rgba(0, 0, 0, 0.10);
  }

  .section-title {
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #888888;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    margin: 0 0 16px;
  }

  .btn-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .msg {
    margin-top: 12px;
    font-size: 13px;
    font-family: 'Inter', sans-serif;
  }

  .msg.success {
    color: #6bb5b0;
  }

  .msg.info {
    color: #888888;
  }

  .about-content {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .about-logo {
    width: 56px;
    height: 56px;
    background: #faf7f2;
    border: 1px solid #e8e3da;
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .about-zi {
    font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', 'SimKai', cursive;
    font-size: 34px;
    color: #c41e3a;
    line-height: 1;
  }

  .about-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .about-name {
    font-family: 'Inter', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: #2d2d2d;
    margin: 0;
  }

  .about-ver {
    font-size: 12px;
    color: #888888;
    font-family: 'Inter', sans-serif;
    margin: 0;
  }

  .about-desc {
    font-size: 13px;
    color: #555555;
    font-family: 'Inter', sans-serif;
    margin: 2px 0 0;
  }
</style>
