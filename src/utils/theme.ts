// ===== THEME MANAGEMENT =====
// Universal format from inficy-gateway: Dark, Light, and System modes with localStorage persistence

import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'system';

export const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('inficy_theme') as Theme | null;
  return saved || 'dark';
};

export const applyTheme = (theme: Theme): boolean => {
  if (typeof window === 'undefined') return true;
  const isDark =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : theme === 'dark';

  document.documentElement.classList.toggle('dark', isDark);
  try {
    localStorage.setItem('inficy_theme', theme);
  } catch {}
  return isDark;
};

// Initialize immediately upon module load
if (typeof window !== 'undefined') {
  applyTheme(getInitialTheme());
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const initial = getInitialTheme();
    return initial === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : initial === 'dark';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    const darkApplied = applyTheme(newTheme);
    setIsDark(darkApplied);
  };

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        document.documentElement.classList.toggle('dark', e.matches);
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return { theme, setTheme, cycleTheme, isDark };
}
