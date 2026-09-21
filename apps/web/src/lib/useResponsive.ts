'use client';

import { useState, useEffect } from 'react';
import { getCurrentBreakpoint, BreakpointKey } from './breakpoints';

/**
 * React hook that returns the current breakpoint and device type.
 * Re-renders on viewport resize.
 *
 * Usage:
 *   const { breakpoint, isMobile, isTablet, isDesktop, isTV } = useResponsive();
 */
export function useResponsive() {
  const [breakpoint, setBreakpoint] = useState<BreakpointKey>('xs');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => setBreakpoint(getCurrentBreakpoint());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const order: BreakpointKey[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
  const index = order.indexOf(breakpoint);

  return {
    breakpoint,
    isMobile: index >= 0 && index < 4,        // xs, sm, md
    isTablet: index >= 3 && index < 5,        // md, lg
    isDesktop: index >= 5 && index < 7,       // xl, 2xl
    isTV: index >= 7,                          // 3xl, 4xl, 5xl
    mounted,
  };
}
