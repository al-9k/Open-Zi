<div class="loading-screen">
  <div class="loading-card">
    <span class="loading-char">字</span>
    <p class="loading-text">Loading...</p>
  </div>
</div>

<style>
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
</style>
