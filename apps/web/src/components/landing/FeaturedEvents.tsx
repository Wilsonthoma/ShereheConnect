'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

// ============================================
// Event shape — matches what the backend returns.
// ============================================
export interface Event {
  id: string;
  title: string;
  category: string;
  venue: string;
  county: string;
  date: string;
  price: number;
  originalPrice?: number;
  isFeatured?: boolean;
  imageUrl?: string;
}

interface FeaturedEventsProps {
  events?: Event[];
}

export function FeaturedEvents({ events = [] }: FeaturedEventsProps) {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const total = events.length;

  // ============================================
  // SCROLL PROGRESS
  // ============================================
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    let rafId: number;
    let target = 0;
    let current = 0;
    let animating = false;

    const computeTarget = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 1.0;
      const end = vh * 0.2;
      const totalRange = start - end;
      const scrolled = start - rect.top;
      return Math.max(0, Math.min(1, scrolled / totalRange));
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
  // EARLY EXIT
  // ============================================
  if (total === 0) return null;

  // ============================================
  // HEADER REVEAL
  // ============================================
  const headerReveal = (() => {
    const start = 0.0;
    const end = 0.3;
    const local = Math.max(0, Math.min(1, (progress - start) / (end - start)));
    const eased = 1 - Math.pow(1 - local, 3);
    return {
      opacity: eased,
      transform: `translateY(${24 * (1 - eased)}px)`,
    };
  })();

  // ============================================
  // PER-CARD 3D CASCADE
  // ============================================
  const getCardState = (index: number) => {
    const STAGGER = Math.min(0.1, 0.5 / Math.max(1, total - 1));
    const DURATION = 0.32;

    const enterStart = 0.15 + index * STAGGER;
    const enterEnd = enterStart + DURATION;

    const local = Math.max(
      0,
      Math.min(1, (progress - enterStart) / (enterEnd - enterStart)),
    );
    const eased = 1 - Math.pow(1 - local, 3);

    const enterY = 60 * (1 - eased);
    const enterZ = -140 * (1 - eased);
    const enterRotateX = 12 * (1 - eased);
    const enterScale = 0.9 + 0.1 * eased;

    return {
      transform: `perspective(1200px) translate3d(0, ${enterY}px, ${enterZ}px) rotateX(${enterRotateX}deg) scale(${enterScale})`,
      opacity: eased,
      willChange: 'transform, opacity',
      transition:
        'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease',
    };
  };

  // ============================================
  // CTA BUTTON REVEAL
  // ============================================
  const ctaReveal = (() => {
    const start = 0.75;
    const end = 0.95;
    const local = Math.max(0, Math.min(1, (progress - start) / (end - start)));
    const eased = 1 - Math.pow(1 - local, 3);
    return {
      opacity: eased,
      transform: `translateY(${16 * (1 - eased)}px) scale(${0.96 + 0.04 * eased})`,
    };
  })();

  return (
    <section
      ref={sectionRef}
      className="relative py-16 md:py-24 lg:py-28 bg-light dark:bg-slate-950 overflow-hidden transition-colors"
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-25 transition-opacity duration-500"
        style={{
          background:
            'radial-gradient(circle at 15% 30%, rgba(245,158,11,0.10), transparent 40%), radial-gradient(circle at 85% 70%, rgba(59,130,246,0.08), transparent 40%)',
        }}
      />

      <div className="container-fluid relative max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-10 md:mb-14" style={headerReveal}>
          <h2 className="heading-display heading-md text-brand-gradient mb-3 md:mb-4">
            {t('featured.heading')}
          </h2>
          <p className="text-fluid-base text-gray dark:text-slate-400 max-w-2xl mx-auto transition-colors">
            {t('featured.subtitle')}
          </p>
        </div>

        {/* CARD GRID */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mb-10 md:mb-12"
          style={{ perspective: '1400px' }}
        >
          {events.map((event, i) => {
            const state = getCardState(i);

            return (
              <div
                key={event.id}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: state.transform,
                  opacity: state.opacity,
                  willChange: state.willChange,
                  transition: state.transition,
                }}
              >
                {/* ============================================
                    FEATURED EVENT CARD
                ============================================ */}
                <Link
                  href={`/events/${event.id}`}
                  className="
                    group relative block
                    rounded-xl overflow-hidden
                    border-2 border-amber-500/70 dark:border-amber-400/70
                    bg-white dark:bg-slate-900
                    transition-all duration-500
                    hover:-translate-y-1
                    hover:shadow-[0_20px_40px_-15px_rgba(245,158,11,0.35)]
                    hover:border-amber-500 dark:hover:border-amber-400
                  "
                >
                  {/* IMAGE */}
                  <div className="relative aspect-[4/5] overflow-hidden bg-slate-900">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="
                          absolute inset-0 w-full h-full object-cover
                          transition-transform duration-700 ease-out
                          group-hover:scale-105
                        "
                        loading="lazy"
                        draggable={false}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-slate-800" />
                    )}

                    {/* Dark gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    {/* CATEGORY TAG */}
                    {event.category && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-sm bg-brand-gradient text-white text-[0.6rem] font-bold uppercase tracking-wider shadow-md">
                        {event.category}
                      </div>
                    )}

                    {/* TITLE + META + CTA */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 text-white">
                      <h3 className="text-base sm:text-lg font-bold leading-tight mb-2 line-clamp-2 drop-shadow-md">
                        {event.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-[0.7rem] text-white/85 mb-3">
                        {event.venue && <span>{event.venue}</span>}
                        {event.county && <span>{event.county}</span>}
                        {event.date && <span>{event.date}</span>}
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        {event.price !== undefined && (
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm sm:text-base font-bold text-gold drop-shadow-md">
                              KES {event.price.toLocaleString()}
                            </span>
                            {event.originalPrice && (
                              <span className="text-xs text-white/60 line-through">
                                KES {event.originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}

                        <span
                          className="
                            inline-flex items-center gap-1.5
                            px-3 sm:px-4 py-2 rounded-sm
                            bg-brand-gradient text-white
                            text-[0.7rem] sm:text-xs font-semibold
                            transition-all shrink-0
                            group-hover:-translate-y-0.5
                            group-hover:shadow-lg group-hover:shadow-gold/40
                          "
                        >
                          <span>{t('featured.viewEvent')}</span>
                          <span className="text-[0.7rem]">→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center" style={ctaReveal}>
          <Link
            href="/events"
            className="
              inline-flex items-center justify-center
              px-6 py-3 rounded-md
              border-2 border-amber-500 dark:border-amber-400
              text-amber-600 dark:text-amber-400
              font-semibold
              transition-all
              hover:bg-amber-500 hover:text-white
              dark:hover:bg-amber-400 dark:hover:text-slate-950
            "
          >
            {t('featured.viewAll')} →
          </Link>
        </div>
      </div>
    </section>
  );
}