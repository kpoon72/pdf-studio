import { useEffect } from 'react';
import { usePDFStore } from '../store/pdfStore';
import type { Theme } from '../types';

export function useTheme() {
  const { theme, setTheme } = usePDFStore();

  useEffect(() => {
    const saved = localStorage.getItem('pdf-studio-theme') as Theme | null;
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return { theme, toggleTheme, setTheme };
}
