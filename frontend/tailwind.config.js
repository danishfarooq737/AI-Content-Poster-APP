/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0F1115',
          surface: '#171A21',
          raised: '#1D212B',
        },
        border: {
          DEFAULT: '#262B35',
          subtle: '#1D212B',
        },
        accent: {
          pink: '#FF3D81',
          amber: '#FFB020',
        },
        success: '#2FD675',
        danger: '#FF5C5C',
        warning: '#FFB020',
        text: {
          primary: '#F5F6F8',
          secondary: '#9AA1AE',
          muted: '#5C6270',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'broadcast-gradient': 'linear-gradient(90deg, #FF3D81 0%, #FFB020 100%)',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,61,129,0.15), 0 8px 24px rgba(255,61,129,0.12)',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.5, transform: 'scale(1.3)' },
        },
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-dot': 'pulseDot 1.6s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out both',
      },
    },
  },
  plugins: [],
};
