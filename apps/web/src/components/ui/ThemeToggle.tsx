'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export function ThemeToggle() {
  const { resolved, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return <div className="w-10 h-10" aria-hidden="true" />;
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} mode`}
      className="w-10 h-10 rounded-full flex items-center justify-center
                 text-slate-500 hover:text-gold hover:bg-black/5
                 dark:text-slate-400 dark:hover:text-gold dark:hover:bg-white/5
                 transition-all"
    >
      {resolved === 'dark' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
