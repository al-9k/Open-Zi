<script lang="ts">
  let { text }: { text: string } = $props();
  let speaking = $state(false);

  function speak() {
    if (speaking) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 0.8;
    u.onstart = () => (speaking = true);
    u.onend = () => (speaking = false);
    u.onerror = () => (speaking = false);
    speechSynthesis.speak(u);
  }
</script>

<button class="speak-btn" class:active={speaking} onclick={speak} aria-label="Pronounce" title="Pronounce">
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
  </svg>
</button>

<style>
  .speak-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    color: #bbb;
    border-radius: 50%;
    flex-shrink: 0;
    transition: color 0.15s;
    vertical-align: middle;
  }
  .speak-btn:hover { color: #e87d7d; }
  .speak-btn.active { color: #e87d7d; }
</style>
