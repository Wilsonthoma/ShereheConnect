'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const DISCOVER_IMAGE_URL =
  'https://images.unsplash.com/photo-1771904867058-d0e87989cd5c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D';

const BOOKING_IMAGE_URL =
  'https://images.unsplash.com/photo-1649433391719-2e784576d044?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D';

const ATTEND_IMAGE_URL =
  'https://images.unsplash.com/photo-1702725450813-c695293ca867?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D';

export function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    {
      title: t('how.step1.title'),
      desc: t('how.step1.desc'),
      imageUrl: DISCOVER_IMAGE_URL,
      imageAlt: 'Discover events on Sherehe Connect',
    },
    {
      title: t('how.step2.title'),
      desc: t('how.step2.desc'),
      imageUrl: BOOKING_IMAGE_URL,
      imageAlt: 'Book tickets quickly on mobile',
    },
    {
      title: t('how.step3.title'),
      desc: t('how.step3.desc'),
      imageUrl: ATTEND_IMAGE_URL,
      imageAlt: 'Attend and enjoy the live event',
    },
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const SCROLL_ROOM_VH = 165;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId = 0;
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
      if (Math.abs(diff) < 0.0005) {
        current = target;
        animating = false;
      } else {
        current += diff * 0.14;
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
  // STEP REVEAL — smoother easing
  // ============================================
  const getStepState = (index: number) => {
    const STAGGER = 0.28;
    const DURATION = 0.34;

    const start = index * STAGGER;
    const end = start + DURATION;
    const tVal = Math.max(0, Math.min(1, (progress - start) / (end - start)));
    const eased = 1 - Math.pow(1 - tVal, 5);

    return {
      opacity: eased,
      transform: `translateY(${24 * (1 - eased)}px) scale(${0.96 + 0.04 * eased})`,
      transition: 'none',
    };
  };

  const SNAKE_END = 0.94;
  const pathProgress = Math.max(0, Math.min(1, progress / SNAKE_END));

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: `calc(100vh + ${SCROLL_ROOM_VH}vh)` }}
    >
      <section className="sticky top-0 h-screen h-[100dvh] flex items-center bg-white dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden transition-colors duration-300 border-t border-slate-200/70 dark:border-slate-800/70">
        {/* Subtle theme-matched ambient accent */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-100"
          style={{
            background:
              'radial-gradient(ellipse 45% 40% at 50% 45%, rgba(249, 115, 22, 0.08), rgba(249, 115, 22, 0) 70%)',
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 sm:py-10">
          {/* HEADER */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="heading-display text-3xl sm:text-4xl lg:text-5xl text-brand-gradient leading-[1.12] tracking-tight">
              {t('how.heading')}
            </h2>
          </div>

          {/* ---------- DESKTOP SNAKE ---------- */}
          <div className="hidden md:block relative">
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1000 380"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="snakeGradLight"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="50%" stopColor="#ea580c" />
                  <stop offset="100%" stopColor="#c2410c" />
                </linearGradient>

                <linearGradient
                  id="snakeGradDark"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#fb923c" />
                  <stop offset="50%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>

                <filter
                  id="snakeGlow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <filter
                  id="snakeGlowDark"
                  x="-30%"
                  y="-30%"
                  width="160%"
                  height="160%"
                >
                  <feGaussianBlur stdDeviation="7" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Base faded track — light theme */}
              <path
                d="M 100 95
                   C 220 -10, 320 -10, 400 95
                   S 620 220, 700 120
                   C 760 45, 860 45, 900 105"
                stroke="rgb(203,213,225)"
                strokeWidth="3"
                strokeDasharray="10 12"
                strokeLinecap="round"
                fill="none"
                className="dark:hidden"
              />

              {/* Base faded track — dark theme */}
              <path
                d="M 100 95
                   C 220 -10, 320 -10, 400 95
                   S 620 220, 700 120
                   C 760 45, 860 45, 900 105"
                stroke="rgb(51,65,85)"
                strokeWidth="3"
                strokeDasharray="10 12"
                strokeLinecap="round"
                fill="none"
                className="hidden dark:block"
              />

              {/* Progress-filled track — LIGHT */}
              <path
                d="M 100 95
                   C 220 -10, 320 -10, 400 95
                   S 620 220, 700 120
                   C 760 45, 860 45, 900 105"
                stroke="url(#snakeGradLight)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                filter="url(#snakeGlow)"
                className="dark:hidden"
                style={{
                  strokeDasharray: 1400,
                  strokeDashoffset: 1400 * (1 - pathProgress),
                  transition:
                    'stroke-dashoffset 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />

              {/* Progress-filled track — DARK */}
              <path
                d="M 100 95
                   C 220 -10, 320 -10, 400 95
                   S 620 220, 700 120
                   C 760 45, 860 45, 900 105"
                stroke="url(#snakeGradDark)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
                filter="url(#snakeGlowDark)"
                className="hidden dark:block"
                style={{
                  strokeDasharray: 1400,
                  strokeDashoffset: 1400 * (1 - pathProgress),
                  transition:
                    'stroke-dashoffset 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            </svg>

            <div className="relative grid grid-cols-3 gap-6 lg:gap-8 min-h-[380px]">
              {steps.map((step, i) => {
                const state = getStepState(i);
                const nodeTop =
                  i === 0 ? 'top-4' : i === 1 ? 'top-28' : 'top-6';

                return (
                  <div
                    key={i}
                    className={`relative flex flex-col items-center ${nodeTop}`}
                    style={{
                      opacity: state.opacity,
                      transform: state.transform,
                      willChange: 'transform, opacity',
                    }}
                  >
                    <div className="relative mb-4">
                      <div
                        className="
                          absolute inset-0 rounded-full
                          blur-md opacity-70
                          animate-pulse
                          bg-orange-500 dark:bg-orange-400
                        "
                      />
                      <div
                        className="
                          relative w-12 h-12 rounded-full
                          flex items-center justify-center
                          text-white font-bold text-base
                          bg-gradient-to-br from-orange-500 to-orange-700
                          shadow-[0_10px_30px_-8px_rgba(234,88,12,0.6)]
                          dark:shadow-[0_10px_35px_-6px_rgba(249,115,22,0.75)]
                          ring-4 ring-white dark:ring-slate-950
                          transition-all duration-500
                        "
                      >
                        {i + 1}
                      </div>
                    </div>

                    <div className="w-full max-w-[240px] rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800/90 bg-slate-50/90 dark:bg-slate-900/70 shadow-sm dark:shadow-none mb-4">
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                        <img
                          src={step.imageUrl}
                          alt={step.imageAlt}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          draggable={false}
                        />
                      </div>
                    </div>

                    <div className="text-center max-w-xs px-2">
                      <h3 className="font-bold text-lg lg:text-xl text-slate-900 dark:text-white mb-1.5 transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---------- MOBILE VERTICAL ---------- */}
          <div className="md:hidden relative pl-14 sm:pl-16">
            <div
              className="absolute left-6 sm:left-7 top-2 bottom-2 w-[3px] rounded-full overflow-hidden
                         bg-slate-200 dark:bg-slate-800
                         transition-colors duration-500"
            >
              <div
                className="w-full origin-top
                           bg-gradient-to-b from-orange-500 via-orange-600 to-orange-700
                           dark:from-orange-400 dark:via-orange-500 dark:to-orange-600
                           transition-colors duration-500"
                style={{
                  height: `${pathProgress * 100}%`,
                  transition:
                    'height 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                  boxShadow: '0 0 12px rgba(249,115,22,0.55)',
                }}
              />
            </div>

            {steps.map((step, i) => {
              const state = getStepState(i);

              return (
                <div
                  key={i}
                  className="relative mb-7 sm:mb-9 last:mb-0"
                  style={{
                    opacity: state.opacity,
                    transform: state.transform,
                    willChange: 'transform, opacity',
                  }}
                >
                  <div
                    className="
                      absolute -left-14 sm:-left-16 top-0
                      w-11 h-11 rounded-full
                      flex items-center justify-center
                      text-white font-bold text-sm
                      bg-gradient-to-br from-orange-500 to-orange-700
                      shadow-[0_8px_20px_-6px_rgba(234,88,12,0.55)]
                      dark:shadow-[0_8px_24px_-6px_rgba(249,115,22,0.7)]
                      ring-4 ring-white dark:ring-slate-950
                      transition-all duration-500
                    "
                  >
                    {i + 1}
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-24 sm:w-28 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                      <img
                        src={step.imageUrl}
                        alt={step.imageAlt}
                        className="w-full aspect-[4/3] object-cover"
                        loading="lazy"
                        draggable={false}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-1 transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}