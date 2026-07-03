/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{svelte,ts}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#faf8f5',
          warm: '#faf7f2',
          dark: '#f5f0e8',
        },
        ink: {
          DEFAULT: '#2d2d2d',
          grey: '#888888',
          light: '#bbbbbb',
        },
        coral: {
          DEFAULT: '#e87d7d',
          light: '#f0a8a8',
          dark: '#c41e3a',
        },
        teal: {
          DEFAULT: '#6bb5b0',
          light: '#8ecfcb',
        },
        crimson: '#c41e3a',
        border: '#e8e5e0',
        card: '#ffffff',
      },
      fontFamily: {
        chinese: ['"Ma Shan Zheng"', 'cursive', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '2px 3px 8px rgba(0, 0, 0, 0.10), 1px 1px 3px rgba(0, 0, 0, 0.06)',
        'card-hover':
          '3px 5px 14px rgba(0, 0, 0, 0.14), 1px 2px 4px rgba(0, 0, 0, 0.08)',
        'btn-3d':
          '0 4px 0 #c96a6a, 0 6px 10px rgba(0, 0, 0, 0.15)',
        'btn-3d-press':
          '0 1px 0 #c96a6a, 0 2px 4px rgba(0, 0, 0, 0.10)',
        clipboard: '3px 4px 10px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        card: '2px',
      },
      backgroundImage: {
        'dot-grid':
          'radial-gradient(circle, #e8e3da 1px, transparent 1px)',
        'paper-texture':
          "url(\"data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        'lift-up': {
          '0%': { transform: 'translateY(0) rotate(var(--card-rotate, 0deg))' },
          '100%': { transform: 'translateY(-4px) rotate(var(--card-rotate, 0deg))' },
        },
      },
      animation: {
        'lift-up': 'lift-up 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
};
