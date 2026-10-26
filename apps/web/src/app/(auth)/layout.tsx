'use client';

import { useEffect } from 'react';
import { useTheme } from '@/lib/theme';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { resolved, setTheme } = useTheme();

  // Ensure auth pages strictly follow system theme, overriding any localStorage preference
  useEffect(() => {
    setTheme('system');
  }, [setTheme]);

  return (
    <div className="min-h-screen bg-light dark:bg-slate-950 transition-colors">
      {children}
    </div>
  );
}
