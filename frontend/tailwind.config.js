/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#050508',
        abyss: '#0A0B10',
        obsidian: '#0F1118',
        'slate-dark': '#141720',
        phantom: '#1E2233',
        nocturne: '#1A1D2E',

        toxic: {
          DEFAULT: '#22C55E',
          50: '#F0FDF4',
          100: '#DCFCE7',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#0F4014',
          800: '#0D2E10',
          900: '#0A1F0D',
        },
        viral: {
          DEFAULT: '#8B5CF6',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#5B21B6',
          900: '#12083A',
        },
      },

      fontFamily: {
        display: ['"Share Tech Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },

      boxShadow: {
        'glow-green': '0 0 20px rgba(34,197,94,0.25), 0 0 60px rgba(34,197,94,0.08)',
        'glow-purple': '0 0 20px rgba(139,92,246,0.25), 0 0 60px rgba(139,92,246,0.08)',
        'glow-red': '0 0 20px rgba(239,68,68,0.3), 0 0 60px rgba(239,68,68,0.10)',
        'glow-cyan': '0 0 20px rgba(34,211,238,0.25), 0 0 60px rgba(34,211,238,0.08)',
        glass: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glass-heavy': '0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)',
        card: '0 4px 24px rgba(0,0,0,0.5)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.7)',
      },

      backgroundImage: {
        'mesh-green':
          'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(34,197,94,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 90%, rgba(139,92,246,0.08) 0%, transparent 60%)',
        'mesh-threat':
          'radial-gradient(ellipse 70% 50% at 15% 15%, rgba(239,68,68,0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 70% at 85% 85%, rgba(245,158,11,0.08) 0%, transparent 60%)',
        scanline:
          'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34,197,94,0.015) 2px, rgba(34,197,94,0.015) 4px)',
        'grid-dark':
          'linear-gradient(rgba(34,197,94,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.04) 1px, transparent 1px)',
        terminal:
          'linear-gradient(135deg, #0F1118 0%, #141720 50%, #0F1118 100%)',
      },

      backgroundSize: {
        grid: '40px 40px',
      },

      borderColor: {
        DEFAULT: '#1E2233',
      },

      animation: {
        'pulse-green': 'pulseGreen 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-red': 'pulseRed 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        blink: 'blink 1s step-end infinite',
        type: 'typewriter 3s steps(40) forwards',
        scan: 'scan 3s linear infinite',
        glitch: 'glitch 0.5s steps(2) infinite',
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'spin-slow': 'spin 3s linear infinite',
        'matrix-fall': 'matrixFall 8s linear infinite',
      },

      keyframes: {
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(34,197,94,0.4)' },
          '50%': {
            boxShadow:
              '0 0 24px rgba(34,197,94,0.8), 0 0 48px rgba(34,197,94,0.3)',
          },
        },
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(239,68,68,0.4)' },
          '50%': {
            boxShadow:
              '0 0 24px rgba(239,68,68,0.9), 0 0 48px rgba(239,68,68,0.4)',
          },
        },
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '25%': { transform: 'translate(-2px, 1px)', filter: 'hue-rotate(90deg)' },
          '50%': { transform: 'translate(2px, -1px)', filter: 'hue-rotate(180deg)' },
          '75%': { transform: 'translate(-1px, 2px)' },
          '100%': { transform: 'translate(0)' },
        },
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        matrixFall: {
          '0%': { transform: 'translateY(-100%)', opacity: 0 },
          '5%': { opacity: 1 },
          '95%': { opacity: 0.3 },
          '100%': { transform: 'translateY(100vh)', opacity: 0 },
        },
      },

      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
