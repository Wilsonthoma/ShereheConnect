'use client';

import { toast as sonnerToast } from 'sonner';

/**
 * Prevent toast spam by tracking recent messages.
 * If the same message fires within 3 seconds, we skip it.
 */
const recentToasts = new Map<string, number>();
const DEDUPE_WINDOW = 3000;

function isDuplicate(key: string): boolean {
  const now = Date.now();
  const last = recentToasts.get(key);
  if (last && now - last < DEDUPE_WINDOW) {
    return true;
  }
  recentToasts.set(key, now);
  // Cleanup old entries
  for (const [k, t] of recentToasts.entries()) {
    if (now - t > DEDUPE_WINDOW) recentToasts.delete(k);
  }
  return false;
}

export const toast = {
  success: (message: string, description?: string) => {
    if (isDuplicate(`success:${message}`)) return;
    sonnerToast.success(message, { description });
  },

  error: (message: string, description?: string) => {
    if (isDuplicate(`error:${message}`)) return;
    sonnerToast.error(message, { description });
  },

  info: (message: string, description?: string) => {
    if (isDuplicate(`info:${message}`)) return;
    sonnerToast.info(message, { description });
  },

  warning: (message: string, description?: string) => {
    if (isDuplicate(`warning:${message}`)) return;
    sonnerToast.warning(message, { description });
  },

  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string },
  ) => {
    return sonnerToast.promise(promise, messages);
  },

  dismiss: (id?: string | number) => {
    sonnerToast.dismiss(id);
  },
};
