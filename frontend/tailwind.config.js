/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#FFFFFF',
        abyss: '#F9FAFB',
        obsidian: '#FFFFFF',
        'slate-dark': '#F3F4F6',
        phantom: '#E5E7EB',
        nocturne: '#F9FAFB',

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
        'glow-green': '0 0 20px rgba(34,197,94,0.15), 0 0 60px rgba(34,197,94,0.05)',
        'glow-purple': '0 0 20px rgba(139,92,246,0.15), 0 0 60px rgba(139,92,246,0.05)',
        'glow-red': '0 0 20px rgba(239,68,68,0.2), 0 0 60px rgba(239,68,68,0.08)',
        'glow-cyan': '0 0 20px rgba(34,211,238,0.15), 0 0 60px rgba(34,211,238,0.05)',
        glass: '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
        'glass-heavy': '0 8px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)',
        card: '0 2px 12px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 24px rgba(0,0,0,0.1)',
      },

      backgroundImage: {
        'mesh-green':
          'radial-gradient(ellipse 80% 60% at 20% 10%, rgba(34,197,94,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 90%, rgba(139,92,246,0.04) 0%, transparent 60%)',
        'mesh-threat':
          'radial-gradient(ellipse 70% 50% at 15% 15%, rgba(239,68,68,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 70% at 85% 85%, rgba(245,158,11,0.04) 0%, transparent 60%)',
      },

      backgroundSize: {
        grid: '40px 40px',
      },

      borderColor: {
        DEFAULT: '#E5E7EB',
      },

      animation: {
        'pulse-green': 'pulseGreen 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-red': 'pulseRed 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        blink: 'blink 1s step-end infinite',
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'spin-slow': 'spin 3s linear infinite',
      },

      keyframes: {
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(34,197,94,0.3)' },
          '50%': {
            boxShadow:
              '0 0 20px rgba(34,197,94,0.5), 0 0 40px rgba(34,197,94,0.2)',
          },
        },
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(239,68,68,0.3)' },
          '50%': {
            boxShadow:
              '0 0 20px rgba(239,68,68,0.6), 0 0 40px rgba(239,68,68,0.3)',
          },
        },
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      },

      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
