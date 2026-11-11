import { useCallback, useEffect, useState } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';
export const THEME_KEY = 'leadpilot-theme';

export function readTheme(): ThemeChoice {
  try { const v = localStorage.getItem(THEME_KEY); return v === 'light' || v === 'dark' ? v : 'system'; } catch { return 'system'; }
}

export function resolveTheme(choice: ThemeChoice, prefersDark: boolean): 'light' | 'dark' {
  return choice === 'system' ? (prefersDark ? 'dark' : 'light') : choice;
}

export function applyTheme(choice: ThemeChoice) {
  const dark = resolveTheme(choice, window.matchMedia('(prefers-color-scheme: dark)').matches) === 'dark';
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

/** Runs before hydration in <head> to avoid a flash of the wrong theme. */
export const themeBootScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');var d=t==='dark'||((t!=='light')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeChoice>('system');
  useEffect(() => { setThemeState(readTheme()); }, []);
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);
  const setTheme = useCallback((next: ThemeChoice) => {
    try { localStorage.setItem(THEME_KEY, next); } catch { /* storage unavailable */ }
    applyTheme(next);
    setThemeState(next);
  }, []);
  return { theme, setTheme };
}

/** Keeps "System" in sync with the device on every page, not just Settings. */
export function useSystemThemeListener() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => { if (readTheme() === 'system') applyTheme('system'); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
}
