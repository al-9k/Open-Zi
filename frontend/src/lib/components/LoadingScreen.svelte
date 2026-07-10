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
    border: 3px solid #2a2a2a;
    padding: 28px 36px;
    box-shadow: 4px 4px 0 #1a1a1a;
    transform: rotate(-1deg);
  }

  .loading-char {
    font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', 'SimKai', cursive;
    font-size: 52px;
    color: #c41e3a;
    line-height: 1;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .loading-text {
    font-size: 13px;
    color: #5a5550;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    margin: 0;
    letter-spacing: 0.5px;
  }
</style>
