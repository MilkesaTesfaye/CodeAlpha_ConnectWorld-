import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

type ThemeOption = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  /** The user's selected theme preference */
  theme: ThemeOption;
  /** The actually applied theme (light/dark) after resolving 'system' */
  resolvedTheme: ResolvedTheme;
  /** Set the user's theme preference */
  setTheme: (theme: ThemeOption) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getStoredTheme(): ThemeOption {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem('theme') as ThemeOption) || 'system';
  }
  return 'system';
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function resolveTheme(theme: ThemeOption): ResolvedTheme {
  if (theme === 'system') return getSystemTheme();
  return theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeOption>(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(getStoredTheme()));

  const applyTheme = useCallback((t: ThemeOption) => {
    const resolved = resolveTheme(t);
    setResolvedTheme(resolved);
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
  }, []);

  const setTheme = useCallback((t: ThemeOption) => {
    setThemeState(t);
    localStorage.setItem('theme', t);
    applyTheme(t);
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Listen for OS color scheme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      applyTheme('system');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
