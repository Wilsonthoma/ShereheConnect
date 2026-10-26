'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export function ThemeToggle() {
  const { resolved, toggleTheme, mounted } = useTheme();

  // Placeholder while hydrating — matches final dimensions exactly
  if (!mounted) {
    return (
      <div
        className="w-[68px] h-[34px] rounded-full
                   bg-slate-200 dark:bg-slate-800
                   border border-slate-300 dark:border-white/5"
        aria-hidden="true"
      />
    );
  }

  const isDark = resolved === 'dark';

  return (
    <button
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="
        relative inline-flex items-center
        w-[68px] h-[34px] rounded-full
        bg-slate-200 dark:bg-slate-800
        border border-slate-300 dark:border-white/5
        hover:border-gold/40
        transition-all duration-300
        shrink-0 p-[3px]
      "
    >
      {/* Sun icon (left slot) */}
      <span
        className={`relative z-10 flex items-center justify-center
                    w-[28px] h-[28px] rounded-full
                    transition-colors duration-300
                    ${!isDark ? 'text-amber-600' : 'text-slate-500'}`}
      >
        <Sun className="w-[15px] h-[15px]" strokeWidth={2.5} />
      </span>

      {/* Moon icon (right slot) */}
      <span
        className={`relative z-10 flex items-center justify-center
                    w-[28px] h-[28px] rounded-full
                    transition-colors duration-300
                    ml-auto
                    ${isDark ? 'text-slate-100' : 'text-slate-500'}`}
      >
        <Moon className="w-[15px] h-[15px]" strokeWidth={2.5} />
      </span>

      {/* Sliding highlight circle */}
      <span
        className={`
          absolute top-[3px] left-[3px]
          w-[28px] h-[28px] rounded-full
          shadow-md
          transition-transform duration-300 ease-out
          bg-white dark:bg-slate-700
          ${isDark ? 'translate-x-[34px]' : 'translate-x-0'}
        `}
        aria-hidden="true"
      />
    </button>
  );
}