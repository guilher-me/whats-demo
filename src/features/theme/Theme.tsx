import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react';
import { useT } from '../../i18n';

type Theme = 'light' | 'dark';

const THEME_KEY = 'whatsdemo-theme';
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
});

function initialTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(initialTheme);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', 'only ' + theme);
  }, [theme]);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // The current session still uses the selected theme.
    }
  };

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function ThemeSwitch({ disabled }: { disabled?: boolean }) {
  const { theme, toggle } = useContext(ThemeContext);
  const t = useT();
  const dark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-switch"
      role="switch"
      aria-label={t('app.darkMode')}
      aria-checked={dark}
      disabled={disabled}
      onClick={toggle}
    >
      <span className="theme-switch-track" aria-hidden="true">
        {dark ? (
          <svg viewBox="0 0 24 24" fill="currentColor" focusable="false">
            <path d="M10.5 3a8.8 8.8 0 0 0 10.2 12.2A9 9 0 1 1 10.5 3Z" />
            <path d="m17.8 3 .9 2.6 2.8.1-2.2 1.8.7 2.6-2.2-1.5-2.3 1.5.8-2.6L14 5.7l2.8-.1Z" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            focusable="false"
          >
            <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
            <path
              strokeLinecap="round"
              d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"
            />
          </svg>
        )}
      </span>
    </button>
  );
}
