'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '../ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function CTABand() {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  // ============================================
  // PINNED SCROLL-DRIVEN PROGRESS
  // ============================================
  const SCROLL_ROOM_VH = 120;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId: number;
    let target = 0;
    let current = 0;
    let animating = false;

    const computeTarget = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollable = rect.height - vh;
      if (scrollable <= 0) return 0;
      const scrolled = -rect.top;
      return Math.max(0, Math.min(1, scrolled / scrollable));
    };

    const tick = () => {
      const diff = target - current;
      if (Math.abs(diff) < 0.0003) {
        current = target;
        animating = false;
      } else {
        current += diff * 0.06;
        animating = true;
      }
      setProgress(current);
      if (animating) rafId = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = computeTarget();
      if (!animating) {
        animating = true;
        rafId = requestAnimationFrame(tick);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    target = computeTarget();
    current = target;
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // ============================================
  // SEQUENTIAL REVEAL PER ELEMENT
  // ============================================
  const getReveal = (
    start: number,
    duration = 0.3,
    axis: 'y' | 'scale' | 'none' = 'y',
  ) => {
    const end = start + duration;
    const local = Math.max(0, Math.min(1, (progress - start) / (end - start)));
    const eased = 1 - Math.pow(1 - local, 5);

    if (axis === 'y') {
      return {
        opacity: eased,
        transform: `translateY(${28 * (1 - eased)}px)`,
      };
    }
    if (axis === 'scale') {
      return {
        opacity: eased,
        transform: `scale(${0.94 + 0.06 * eased})`,
      };
    }
    return { opacity: eased };
  };

  const headingReveal = getReveal(0.0, 0.3, 'y');
  const subtextReveal = getReveal(0.2, 0.3, 'y');
  const buttonsReveal = getReveal(0.45, 0.35, 'scale');

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: `calc(100vh + ${SCROLL_ROOM_VH}vh)` }}
    >
      <section className="sticky top-0 h-screen h-[100dvh] flex items-center bg-light dark:bg-slate-950 overflow-hidden transition-colors">
        {/* Ambient glow — same as other sections */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-25 transition-opacity duration-500"
          style={{
            background:
              'radial-gradient(circle at 15% 30%, rgba(245,158,11,0.10), transparent 40%), radial-gradient(circle at 85% 70%, rgba(59,130,246,0.08), transparent 40%)',
          }}
        />

        <div className="container-fluid relative max-w-6xl mx-auto w-full text-center">
          {/* HEADING */}
          <h2
            className="heading-display heading-md mb-5 md:mb-6 text-dark dark:text-white transition-colors"
            style={headingReveal}
          >
            {t('cta.heading.line1')}
            <br />
            {t('cta.heading.line2a')}{' '}
            <span className="text-brand-gradient">
              {t('cta.heading.line2b')}
            </span>
            ?
          </h2>

          {/* SUBTEXT */}
          <p
            className="text-fluid-base mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed text-gray dark:text-slate-400 transition-colors"
            style={subtextReveal}
          >
            {t('cta.subtitle')}
          </p>

          {/* BUTTONS */}
          <div
            className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 justify-center"
            style={buttonsReveal}
          >
            <Link href="/register">
              <Button variant="primary" size="lg" fullWidth>
                {t('cta.getStarted')} →
              </Button>
            </Link>
            <Link href="/events">
              <Button variant="outline" size="lg" fullWidth>
                {t('cta.browse')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}