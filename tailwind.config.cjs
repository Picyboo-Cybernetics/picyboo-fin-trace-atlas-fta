/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          DEFAULT: '#0ea5e9',
          foreground: '#041824'
        },
        secondary: {
          50: '#fdf4ff',
          100: '#f8e1ff',
          200: '#f1bbff',
          300: '#e28eff',
          400: '#cc66ff',
          500: '#a855f7',
          600: '#7e22ce',
          700: '#6b21a8',
          800: '#581c87',
          900: '#3b0764',
          DEFAULT: '#a855f7',
          foreground: '#25033b'
        },
        risk: {
          low: '#0ea5e9',
          guarded: '#38bdf8',
          elevated: '#f59e0b',
          severe: '#f97316',
          critical: '#ef4444'
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          DEFAULT: '#10b981'
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5f5',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          foreground: '#0f172a'
        },
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#f5f7fb',
          muted: '#e7ebf4',
          dark: '#0f172a'
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      fontSize: {
        eyebrow: ['0.7rem', { letterSpacing: '0.22em', lineHeight: '1rem', fontWeight: '600' }],
        '2.5xl': ['1.75rem', { lineHeight: '2.15rem', fontWeight: '600' }]
      },
      boxShadow: {
        soft: '0 12px 40px -24px rgba(15, 23, 42, 0.45)',
        elevated: '0 24px 60px -30px rgba(15, 23, 42, 0.55)',
        inner: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.25)'
      },
      borderRadius: {
        xl: '1.25rem',
        '2xl': '1.75rem',
        '3xl': '2.5rem'
      }
    }
  },
  plugins: []
}
