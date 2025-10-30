import { useCallback, useEffect, useMemo, useState } from 'react'
import { clsx } from 'clsx'

const STORAGE_KEY = 'fta:theme-preference'

type ThemeMode = 'light' | 'dark'

const applyThemeToDocument = (next: ThemeMode) => {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = next
}

function useThemeMode() {
  const getStoredPreference = () => {
    if (typeof window === 'undefined') return null
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? (stored as ThemeMode) : null
  }

  const resolveSystemPreference = () => {
    if (typeof window === 'undefined') return null
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = getStoredPreference()
    if (stored) {
      applyThemeToDocument(stored)
      return stored
    }
    const system = resolveSystemPreference()
    const initial: ThemeMode = system ?? 'dark'
    applyThemeToDocument(initial)
    return initial
  })

  const [source, setSource] = useState<'manual' | 'system'>(() => (getStoredPreference() ? 'manual' : 'system'))

  useEffect(() => {
    applyThemeToDocument(mode)
  }, [mode])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (source === 'manual') {
      window.localStorage.setItem(STORAGE_KEY, mode)
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [mode, source])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const syncWithSystem = (matches: boolean) => {
      if (source === 'system') {
        setMode(matches ? 'dark' : 'light')
      }
    }

    syncWithSystem(media.matches)

    const handler = (event: MediaQueryListEvent) => {
      syncWithSystem(event.matches)
    }

    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [source])

  const toggle = useCallback(() => {
    setSource('manual')
    setMode((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return useMemo(
    () => ({
      mode,
      toggle
    }),
    [mode, toggle]
  )
}

const navigation = [
  { label: 'About', href: '#about' },
  { label: 'Atlas', href: '#atlas' },
  { label: 'Insights', href: '#insights' },
  { label: 'Signals', href: '#signals' }
]

export function Header() {
  const { mode, toggle } = useThemeMode()
  const isDark = mode === 'dark'

  return (
    <header className="app-header">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <a href="#top" className="flex items-center gap-3 no-underline text-accent">
          <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl brand-token">
            <span className="relative z-10 text-lg font-bold uppercase tracking-wider text-accent-strong">FTA</span>
          </span>
          <div className="flex flex-col">
            <span className="font-display text-lg font-semibold tracking-tight">FinTrace Atlas</span>
            <span className="text-xs uppercase tracking-[0.3em] text-muted">Regtech intelligence</span>
          </div>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          {navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="group relative inline-flex items-center nav-link transition focus-visible:outline-none"
            >
              {item.label}
              <span className="absolute -bottom-2 left-0 hidden h-0.5 w-full bg-[var(--accent)] md:group-hover:inline-flex" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            className={clsx('theme-toggle shadow-soft', isDark && 'text-accent-strong')}
            aria-pressed={isDark}
          >
            <span className="sr-only">Toggle dark mode</span>
            <ThemeIcon dark={isDark} />
            <span>{isDark ? 'Dark' : 'Light'} mode</span>
          </button>
        </div>
      </div>
    </header>
  )
}

function ThemeIcon({ dark }: { dark: boolean }) {
  return dark ? (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2m-3.07-7.07-1.42 1.42m-11.3 11.3-1.42 1.42" />
    </svg>
  )
}
