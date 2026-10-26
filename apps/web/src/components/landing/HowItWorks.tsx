'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    {
      title: t('how.step1.title'),
      desc: t('how.step1.desc'),
    },
    {
      title: t('how.step2.title'),
      desc: t('how.step2.desc'),
    },
    {
      title: t('how.step3.title'),
      desc: t('how.step3.desc'),
    },
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const SCROLL_ROOM_VH = 150;

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
  // STEP REVEAL — smoother easing
  // ============================================
  const getStepState = (index: number) => {
    const STAGGER = 0.32;
    const DURATION = 0.35;

    const start = index * STAGGER;
    const end = start + DURATION;
    const t = Math.max(0, Math.min(1, (progress - start) / (end - start)));
    const eased = 1 - Math.pow(1 - t, 5);

    return {
      opacity: eased,
      transform: `translateY(${28 * (1 - eased)}px) scale(${0.95 + 0.05 * eased})`,
      transition: 'none',
    };
  };

  const SNAKE_END = 0.97;
  const pathProgress = Math.max(0, Math.min(1, progress / SNAKE_END));

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: `calc(100vh + ${SCROLL_ROOM_VH}vh)` }}
    >
      <section className="sticky top-0 h-screen h-[100dvh] flex items-center bg-light dark:bg-slate-950 overflow-hidden">
        <div className="container-fluid relative max-w-6xl mx-auto w-full">
          {/* HEADER */}
          <div className="text-center mb-10 md:mb-14">
            <h2 className="heading-display heading-md text-brand-gradient">
              {t('how.heading')}
            </h2>
          </div>

          {/* ---------- DESKTOP SNAKE ---------- */}
          <div className="hidden md:block relative">
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1000 320"
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
                  <stop offset="0%" stopColor="#f59e0b" />
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
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="#f97316" />
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
                d="M 100 90
                   C 220 -10, 320 -10, 400 90
                   S 620 200, 700 110
                   C 760 40, 860 40, 900 100"
                stroke="rgb(203,213,225)"
                strokeWidth="3"
                strokeDasharray="10 12"
                strokeLinecap="round"
                fill="none"
                className="dark:hidden"
              />

              {/* Base faded track — dark theme */}
              <path
                d="M 100 90
                   C 220 -10, 320 -10, 400 90
                   S 620 200, 700 110
                   C 760 40, 860 40, 900 100"
                stroke="rgb(51,65,85)"
                strokeWidth="3"
                strokeDasharray="10 12"
                strokeLinecap="round"
                fill="none"
                className="hidden dark:block"
              />

              {/* Progress-filled track — LIGHT */}
              <path
                d="M 100 90
                   C 220 -10, 320 -10, 400 90
                   S 620 200, 700 110
                   C 760 40, 860 40, 900 100"
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
                    'stroke-dashoffset 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />

              {/* Progress-filled track — DARK */}
              <path
                d="M 100 90
                   C 220 -10, 320 -10, 400 90
                   S 620 200, 700 110
                   C 760 40, 860 40, 900 100"
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
                    'stroke-dashoffset 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            </svg>

            <div className="relative grid grid-cols-3 gap-6 h-[320px]">
              {steps.map((step, i) => {
                const state = getStepState(i);
                const nodeTop =
                  i === 0 ? 'top-8' : i === 1 ? 'top-40' : 'top-10';

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
                    <div className="relative mb-6">
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
                          relative w-14 h-14 rounded-full
                          flex items-center justify-center
                          text-white font-bold text-lg
                          bg-gradient-to-br from-amber-500 to-orange-600
                          shadow-[0_10px_30px_-8px_rgba(234,88,12,0.6)]
                          dark:shadow-[0_10px_35px_-6px_rgba(251,146,60,0.75)]
                          ring-4 ring-light dark:ring-slate-950
                          transition-shadow duration-500
                        "
                      >
                        {i + 1}
                      </div>
                    </div>

                    <div className="text-center max-w-xs">
                      <h3 className="font-bold text-xl md:text-2xl text-dark dark:text-white mb-2 transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-fluid-sm text-gray dark:text-slate-400 leading-relaxed transition-colors">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---------- MOBILE VERTICAL ---------- */}
          <div className="md:hidden relative pl-14">
            <div
              className="absolute left-6 top-2 bottom-2 w-[3px] rounded-full overflow-hidden
                         bg-slate-200 dark:bg-slate-800
                         transition-colors duration-500"
            >
              <div
                className="w-full origin-top
                           bg-gradient-to-b from-amber-500 via-orange-500 to-orange-600
                           dark:from-amber-400 dark:via-orange-400 dark:to-orange-500
                           transition-colors duration-500"
                style={{
                  height: `${pathProgress * 100}%`,
                  transition:
                    'height 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
                  boxShadow: '0 0 12px rgba(249,115,22,0.55)',
                }}
              />
            </div>

            {steps.map((step, i) => {
              const state = getStepState(i);

              return (
                <div
                  key={i}
                  className="relative mb-10 last:mb-0"
                  style={{
                    opacity: state.opacity,
                    transform: state.transform,
                    willChange: 'transform, opacity',
                  }}
                >
                  <div
                    className="
                      absolute -left-14 top-0
                      w-12 h-12 rounded-full
                      flex items-center justify-center
                      text-white font-bold text-base
                      bg-gradient-to-br from-amber-500 to-orange-600
                      shadow-[0_8px_20px_-6px_rgba(234,88,12,0.55)]
                      dark:shadow-[0_8px_24px_-6px_rgba(251,146,60,0.7)]
                      ring-4 ring-light dark:ring-slate-950
                      transition-shadow duration-500
                    "
                  >
                    {i + 1}
                  </div>

                  <div>
                    <h3 className="font-bold text-xl text-dark dark:text-white mb-2 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-fluid-sm text-gray dark:text-slate-400 leading-relaxed transition-colors">
                      {step.desc}
                    </p>
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