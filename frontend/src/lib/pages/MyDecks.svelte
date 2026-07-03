<script lang="ts">
  import { api } from '$lib/api';
  import Button3D from '$lib/components/Button3D.svelte';

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
  <div class="coming-soon">
    <div class="stamp-area">
      <div class="deck-stack">
        <div class="deck-card card-1"></div>
        <div class="deck-card card-2"></div>
        <div class="deck-card card-3"></div>
      </div>
      <h1 class="cs-title">My Decks</h1>
      <p class="cs-subtitle">Coming soon</p>
      <p class="cs-desc">Custom flashcard decks, spaced repetition, and study sessions are on the way.</p>
    </div>

    <div class="export-area">
      <p class="export-label">In the meantime, export your bank to Anki:</p>
      <Button3D size="md" variant="teal" onclick={handleExport}>
        Export to Anki
      </Button3D>
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
    align-items: center;
    justify-content: center;
  }

  .coming-soon {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
    text-align: center;
  }

  .stamp-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  /* Stacked card illusion */
  .deck-stack {
    position: relative;
    width: 120px;
    height: 160px;
    margin-bottom: 20px;
  }

  .deck-card {
    position: absolute;
    width: 120px;
    height: 160px;
    background: #faf7f2;
    border: 1px solid #e8e3da;
    border-radius: 2px;
    box-shadow: 2px 3px 8px rgba(0, 0, 0, 0.08);
  }

  .card-1 {
    transform: rotate(-3deg);
    z-index: 3;
  }

  .card-2 {
    transform: rotate(1deg) translateY(4px);
    z-index: 2;
    background: #f7f4ee;
  }

  .card-3 {
    transform: rotate(4deg) translateY(8px);
    z-index: 1;
    background: #f5f0e8;
  }

  .cs-title {
    font-family: 'Ma Shan Zheng', cursive;
    font-size: 42px;
    color: #2d2d2d;
    margin: 0;
    line-height: 1;
  }

  .cs-subtitle {
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #c41e3a;
    margin: 0;
    transform: rotate(-1deg);
    text-shadow: 0 1px 0 rgba(200, 30, 50, 0.1);
  }

  .cs-desc {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #888888;
    margin: 8px 0 0;
    max-width: 320px;
    line-height: 1.6;
  }

  .export-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .export-label {
    font-size: 13px;
    color: #888888;
    font-family: 'Inter', sans-serif;
  }
</style>
