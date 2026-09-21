/**
 * ShereheConnect — Responsive Breakpoints
 * Single source of truth for all screen size decisions.
 *
 * Usage in JS/TS:
 *   import { BREAKPOINTS } from '@/lib/breakpoints';
 *   if (window.innerWidth >= BREAKPOINTS.lg) { ... }
 *
 * Usage in Tailwind:
 *   className="md:flex lg:grid xl:gap-8"
 *   (Tailwind's default breakpoints match these values)
 *
 * Usage in CSS:
 *   @media (min-width: 1024px) { ... }
 */

export const BREAKPOINTS = {
  /** Small phones — iPhone SE, older Androids (portrait) */
  xs: 320,

  /** Standard phones — iPhone 14, Pixel 7 (portrait) */
  sm: 480,

  /** Large phones / small tablets (portrait) */
  md: 640,

  /** Tablets (portrait) — iPad Mini, Galaxy Tab */
  lg: 768,

  /** Tablets (landscape) / small laptops */
  xl: 1024,

  /** Standard desktops / laptops */
  '2xl': 1280,

  /** Large desktops / wide monitors */
  '3xl': 1536,

  /** Extra-wide displays, TVs */
  '4xl': 1920,

  /** Ultra-wide monitors, 4K TVs */
  '5xl': 2560,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

/** Media query strings for use with window.matchMedia() */
export const MEDIA_QUERIES = {
  xs: `(min-width: ${BREAKPOINTS.xs}px)`,
  sm: `(min-width: ${BREAKPOINTS.sm}px)`,
  md: `(min-width: ${BREAKPOINTS.md}px)`,
  lg: `(min-width: ${BREAKPOINTS.lg}px)`,
  xl: `(min-width: ${BREAKPOINTS.xl}px)`,
  '2xl': `(min-width: ${BREAKPOINTS['2xl']}px)`,
  '3xl': `(min-width: ${BREAKPOINTS['3xl']}px)`,
  '4xl': `(min-width: ${BREAKPOINTS['4xl']}px)`,
  '5xl': `(min-width: ${BREAKPOINTS['5xl']}px)`,
} as const;

/** Check if current viewport matches a breakpoint */
export function isAtLeast(breakpoint: BreakpointKey): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS[breakpoint];
}

/** Get current breakpoint name based on viewport width */
export function getCurrentBreakpoint(): BreakpointKey {
  if (typeof window === 'undefined') return 'xs';
  const width = window.innerWidth;

  if (width >= BREAKPOINTS['5xl']) return '5xl';
  if (width >= BREAKPOINTS['4xl']) return '4xl';
  if (width >= BREAKPOINTS['3xl']) return '3xl';
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

/** Check if the current device is mobile-sized */
export function isMobile(): boolean {
  return isAtLeast('xs') && !isAtLeast('lg');
}

/** Check if the current device is tablet-sized */
export function isTablet(): boolean {
  return isAtLeast('lg') && !isAtLeast('xl');
}

/** Check if the current device is desktop-sized */
export function isDesktop(): boolean {
  return isAtLeast('xl');
}

/** Check if the current device is TV or ultra-wide */
export function isTV(): boolean {
  return isAtLeast('4xl');
}

/** Check if the user prefers reduced motion */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Check if the device supports touch */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}
