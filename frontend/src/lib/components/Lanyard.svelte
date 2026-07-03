<script lang="ts">
  let { color = '#c41e3a' }: { color?: string } = $props();
</script>

<!-- The lanyard/bookmark tab hanging off the top-left edge of a flashcard -->
<div class="lanyard" style="--lanyard-color: {color}">
  <div class="lanyard-strip"></div>
  <div class="lanyard-hole"></div>
</div>

<style>
  .lanyard {
    position: absolute;
    top: -2px;
    left: -2px;
    z-index: 10;
    width: 18px;
    height: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .lanyard-strip {
    width: 14px;
    height: 36px;
    background: linear-gradient(
      135deg,
      var(--lanyard-color) 0%,
      color-mix(in srgb, var(--lanyard-color) 80%, white) 30%,
      var(--lanyard-color) 50%,
      color-mix(in srgb, var(--lanyard-color) 60%, black) 80%,
      var(--lanyard-color) 100%
    );
    border-radius: 2px 2px 0 0;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      0 1px 2px rgba(0, 0, 0, 0.2);
    position: relative;
  }

  .lanyard-strip::after {
    content: '';
    position: absolute;
    top: 1px;
    left: 2px;
    right: 2px;
    height: 4px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 1px;
  }

  .lanyard-hole {
    width: 6px;
    height: 6px;
    background: #faf8f5;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.15);
    margin-top: -1px;
    box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.1);
  }
</style>
