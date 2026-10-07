import { useCallback, useState } from 'react';

type Theme = 'light' | 'dark';
const KEY = 'docmind-theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  );

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Storage may be unavailable (private mode); the theme still applies for this session.
    }
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme]);

  return { theme, setTheme, toggle };
}
