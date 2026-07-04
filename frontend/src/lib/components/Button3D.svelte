<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    variant = 'coral',
    size = 'md',
    onclick,
    disabled = false,
    children,
  }: {
    variant?: 'coral' | 'teal' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    onclick?: () => void;
    disabled?: boolean;
    children: Snippet;
  } = $props();

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-7 py-3 text-lg',
  };

  const variantClasses = {
    coral:
      'bg-coral text-white border-[#c05555] shadow-[0_4px_0_#c05555,0_6px_14px_rgba(0,0,0,0.35)] active:shadow-[0_1px_0_#c05555,0_2px_4px_rgba(0,0,0,0.20)] active:translate-y-[3px]',
    teal: 'bg-teal text-white border-[#4a8a85] shadow-[0_4px_0_#4a8a85,0_6px_14px_rgba(0,0,0,0.35)] active:shadow-[0_1px_0_#4a8a85,0_2px_4px_rgba(0,0,0,0.20)] active:translate-y-[3px]',
    ghost:
      'bg-white/15 text-white/80 border border-white/20 hover:bg-white/25 shadow-none active:shadow-none',
  };
</script>

<button
  {onclick}
  {disabled}
  class="btn-3d {sizeClasses[size]} {variantClasses[variant]}"
  class:opacity-50={disabled}
  class:cursor-not-allowed={disabled}
  type="button"
>
  <span class="btn-shine"></span>
  {@render children()}
</button>

<style>
  .btn-3d {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 600;
    border-radius: 8px;
    border-width: 0;
    cursor: pointer;
    transition: all 0.1s ease;
    user-select: none;
    letter-spacing: 0.3px;
    overflow: hidden;
  }

  .btn-shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.18) 0%,
      transparent 45%,
      rgba(0, 0, 0, 0.06) 100%
    );
    border-radius: 8px;
    pointer-events: none;
  }

  .btn-3d:active:not(:disabled) {
    transform: translateY(3px);
  }
</style>
