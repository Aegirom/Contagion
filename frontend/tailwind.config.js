/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {

      // ─── Surfaces ─────────────────────────────────────────────
      // Deep blue-slate darks. Not pure black — has a midnight undertone
      // that makes the UI feel rich rather than flat.
      colors: {
        base:    '#06080F',   // page background — near-black with blue cast
        surface: '#0B0E1A',   // sidebar, topbar
        card:    '#0F1220',   // card / panel background
        raised:  '#141828',   // hover state, elevated cards
        border:  '#1E2440',   // default border
        divide:  '#151A2E',   // subtle dividers within cards

        // ─── Text hierarchy ───────────────────────────────────────
        // Using slate for text — cooler tone matches the blue surfaces.
        // Don't need to add these; Tailwind's slate scale works fine.
        // text-slate-50   #F8FAFC  — headings
        // text-slate-300  #CBD5E1  — body
        // text-slate-500  #64748B  — secondary / labels
        // text-slate-700  #334155  — muted / disabled

        // ─── Primary accent — precision blue ─────────────────────
        // Single dominant accent. Used for: active states, links,
        // primary buttons, key data points. Not overused.
        azure: {
          DEFAULT: '#3B82F6',
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',   // lighter, for text on dark
          500: '#3B82F6',   // default
          600: '#2563EB',   // pressed / darker
          700: '#1D4ED8',
          900: '#0D1B3E',   // very subtle bg tint
          950: '#080F24',   // near-surface bg
        },

        // ─── Secondary accent — indigo ────────────────────────────
        // Used for: rank/XP, secondary badges, charts.
        // Pairs naturally with azure without clashing.
        indigo: {
          DEFAULT: '#6366F1',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          900: '#1E1B4B',
          950: '#0D0B2A',
        },

        // ─── Status / severity (semantic only) ───────────────────
        // These appear ONLY in badges and status indicators.
        // Never use as a primary UI accent.
        ok:      '#22C55E',   // success / completed
        warn:    '#F59E0B',   // warning / medium
        danger:  '#EF4444',   // critical / failed
        info:    '#22D3EE',   // info / analyzing

        // ─── Legacy aliases (keep for backwards compat) ───────────
        // Remove these as you migrate component by component.
        void:       '#06080F',
        abyss:      '#0B0E1A',
        obsidian:   '#0F1220',
        'slate-dark': '#141828',
        phantom:    '#1E2440',
      },

      // ─── Typography ───────────────────────────────────────────
      // Share Tech Mono: structural labels, nav, monospace displays
      // DM Sans: body text, descriptions, prose
      // JetBrains Mono: code, hashes, IDs, tabular data
      fontFamily: {
        display: ['"Share Tech Mono"', 'monospace'],
        body:    ['"DM Sans"', 'sans-serif'],
        code:    ['"JetBrains Mono"', 'monospace'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },

      // ─── Shadows / Glows ──────────────────────────────────────
      boxShadow: {
        'glow-blue':   '0 0 20px rgba(59,130,246,0.2),  0 0 60px rgba(59,130,246,0.06)',
        'glow-indigo': '0 0 20px rgba(99,102,241,0.2),  0 0 60px rgba(99,102,241,0.06)',
        'glow-ok':     '0 0 20px rgba(34,197,94,0.2),   0 0 60px rgba(34,197,94,0.06)',
        'glow-danger': '0 0 20px rgba(239,68,68,0.25),  0 0 60px rgba(239,68,68,0.08)',
        card:          '0 4px 24px rgba(0,0,0,0.5)',
        'card-hover':  '0 8px 40px rgba(0,0,0,0.7)',
        glass:         '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
      },

      // ─── Backgrounds ──────────────────────────────────────────
      backgroundImage: {
        // Ambient page background — blue orb top-left, indigo bottom-right
        'mesh-page':
          'radial-gradient(ellipse 70% 50% at 0% 0%, rgba(59,130,246,0.07) 0%, transparent 60%), ' +
          'radial-gradient(ellipse 60% 60% at 100% 100%, rgba(99,102,241,0.05) 0%, transparent 60%)',

        // Subtle grid overlay for depth
        'grid-fine':
          'linear-gradient(rgba(59,130,246,0.025) 1px, transparent 1px), ' +
          'linear-gradient(90deg, rgba(59,130,246,0.025) 1px, transparent 1px)',

        // Scanline texture (optional, use on hero areas)
        scanline:
          'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59,130,246,0.012) 2px, rgba(59,130,246,0.012) 4px)',

        terminal:
          'linear-gradient(135deg, #0F1220 0%, #141828 50%, #0F1220 100%)',
      },

      backgroundSize: {
        grid: '48px 48px',
      },

      // ─── Border defaults ──────────────────────────────────────
      borderColor: {
        DEFAULT: '#1E2440',
      },

      // ─── Animations ───────────────────────────────────────────
      animation: {
        'pulse-blue':   'pulseBlue 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-ok':     'pulseOk 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-danger': 'pulseDanger 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        blink:          'blink 1s step-end infinite',
        'fade-up':      'fadeUp 0.5s ease forwards',
        'fade-in':      'fadeIn 0.3s ease forwards',
        'scale-in':     'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        scan:           'scan 4s linear infinite',
      },

      keyframes: {
        pulseBlue: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(59,130,246,0.3)' },
          '50%':      { boxShadow: '0 0 20px rgba(59,130,246,0.7), 0 0 40px rgba(59,130,246,0.2)' },
        },
        pulseOk: {
          '0%, 100%': { boxShadow: '0 0 6px rgba(34,197,94,0.3)' },
          '50%':      { boxShadow: '0 0 16px rgba(34,197,94,0.7)' },
        },
        pulseDanger: {
          '0%, 100%': { boxShadow: '0 0 6px rgba(239,68,68,0.3)' },
          '50%':      { boxShadow: '0 0 20px rgba(239,68,68,0.8)' },
        },
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%':      { opacity: 0 },
        },
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        scaleIn: {
          from: { opacity: 0, transform: 'scale(0.96)' },
          to:   { opacity: 1, transform: 'scale(1)' },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },

      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
