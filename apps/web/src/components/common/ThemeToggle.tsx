import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const readInitialTheme = (): Theme => {
  if (typeof document !== 'undefined') {
    const current = document.documentElement.dataset.theme
    if (current === 'light' || current === 'dark') {
      return current
    }
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme
  try {
    window.localStorage.setItem('theme', theme)
  } catch {
    /* localStorage 사용 불가(프라이빗 모드 등)는 조용히 무시한다. */
  }
}

const SunIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
)

const MoonIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>(readInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const isDark = theme === 'dark'
  const nextTheme: Theme = isDark ? 'light' : 'dark'
  const label = isDark ? '라이트 모드로 전환' : '다크 모드로 전환'

  const handleToggle = () => {
    applyTheme(nextTheme)
    setTheme(nextTheme)
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={handleToggle}
      aria-label={label}
      title={label}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

export { ThemeToggle }
