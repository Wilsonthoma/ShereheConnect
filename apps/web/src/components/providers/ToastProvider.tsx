'use client';

import { Toaster } from 'sonner';
import { useTheme } from '@/lib/theme';

export function ToastProvider() {
  const { resolved } = useTheme();

  return (
    <Toaster
      position="top-right"
      theme={resolved}
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        style: {
          fontFamily: 'var(--font-sans)',
          fontSize: '0.875rem',
        },
        className: 'font-sans',
      }}
    />
  );
}
