<script lang="ts">
  let { text, pinyin }: { text: string; pinyin?: string } = $props();
  let speaking = $state(false);

  async function speak() {
    if (speaking) return;
    speaking = true;
    try {
      const query = pinyin || text;
      const res = await fetch(`http://localhost:8000/api/speak?text=${encodeURIComponent(query)}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { speaking = false; URL.revokeObjectURL(url); };
      audio.onerror = () => { speaking = false; URL.revokeObjectURL(url); };
      audio.play();
    } catch { speaking = false; }
  }
</script>

<button class="speak-btn" class:active={speaking} onclick={speak} aria-label="Pronounce" title={pinyin || text}>
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
  </svg>
</button>

<style>
  .speak-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 20px; height: 20px; padding: 0; background: none; border: none;
    cursor: pointer; color: #9a9590; border-radius: 50%; flex-shrink: 0;
    transition: color 0.15s; vertical-align: middle;
  }
  .speak-btn:hover { color: #c41e3a; }
  .speak-btn.active { color: #c41e3a; }
</style>
