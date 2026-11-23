'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n/LanguageContext';

// Replace with the exact Mombasa image URL from Hero if different
const MOMBASA_HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=900&q=80&auto=format&fit=crop';

const MPESA_NATIVE_IMAGE_URL =
  'https://images.unsplash.com/photo-1758519288905-38b7b00c1023?w=900&q=80&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D';

const SECURE_PAYMENT_IMAGE_URL =
  'https://images.unsplash.com/photo-1758519291442-6a34815b0ae3?w=900&q=80&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D';

export function WhyShereheConnect() {
  const { t } = useLanguage();

  const reasons = [
    {
      title: t('why.reason1.title'),
      desc: t('why.reason1.desc'),
      image: MOMBASA_HERO_IMAGE_URL,
      imageAlt: 'Mombasa coastal event scene',
    },
    {
      title: t('why.reason2.title'),
      desc: t('why.reason2.desc'),
      image: MPESA_NATIVE_IMAGE_URL,
      imageAlt: 'Native M-Pesa mobile payment experience',
    },
    {
      title: t('why.reason3.title'),
      desc: t('why.reason3.desc'),
      image: SECURE_PAYMENT_IMAGE_URL,
      imageAlt: 'Secure digital payment confirmation',
    },
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  // ============================================
  // PINNED SCROLL-DRIVEN PROGRESS
  // ============================================
  const SCROLL_ROOM_VH = 155;

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
        current += diff * 0.15;
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
  // HEADER REVEAL
  // ============================================
  const getHeaderReveal = () => {
    const start = 0.0;
    const end = 0.22;
    const local = Math.max(0, Math.min(1, (progress - start) / (end - start)));
    const eased = 1 - Math.pow(1 - local, 5);
    return {
      opacity: eased,
      transform: `translateY(${24 * (1 - eased)}px)`,
    };
  };

  // ============================================
  // PER-CARD 3D CASCADE + MAGNETIC TILT
  // ============================================
  const getCardState = (index: number) => {
    const STAGGER = 0.14;
    const DURATION = 0.28;

    const enterStart = 0.16 + index * STAGGER;
    const enterEnd = enterStart + DURATION;

    const enterT = Math.max(
      0,
      Math.min(1, (progress - enterStart) / (enterEnd - enterStart)),
    );
    const enterEased = 1 - Math.pow(1 - enterT, 5);

    const leanDir = index % 2 === 0 ? 1 : -1;

    const enterY = 72 * (1 - enterEased);
    const enterRotateY = leanDir * 18 * (1 - enterEased);
    const enterRotateX = 12 * (1 - enterEased);
    const enterZ = -160 * (1 - enterEased);
    const enterScale = 0.88 + 0.12 * enterEased;

    const isHovered = hovered === index;
    const tiltX = isHovered ? (0.5 - mouse.y) * 10 : 0;
    const tiltY = isHovered ? (mouse.x - 0.5) * 10 : 0;

    const translateY = enterY;
    const translateZ = enterZ;
    const rotateY = enterRotateY + tiltY;
    const rotateX = enterRotateX + tiltX;
    const scale = enterScale * (isHovered ? 1.02 : 1);
    const opacity = enterEased;

    return {
      transform: `perspective(1200px) translate3d(0, ${translateY}px, ${translateZ}px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(${scale})`,
      opacity,
      willChange: 'transform, opacity',
      transition: isHovered
        ? 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease'
        : 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease',
    };
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    index: number,
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMouse({ x, y });
    setHovered(index);
  };

  const headerReveal = getHeaderReveal();

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: `calc(100vh + ${SCROLL_ROOM_VH}vh)` }}
    >
      <section className="sticky top-0 h-screen h-[100dvh] flex items-center bg-gradient-to-b from-slate-50 via-sky-50/60 to-white dark:from-slate-950 dark:via-[#14161b] dark:to-[#111318] text-slate-900 dark:text-white overflow-hidden transition-colors duration-300 border-t border-slate-200/70 dark:border-white/10">
        {/* Ambient glow — uniform across light & dark themes */}
        <div
          className="pointer-events-none absolute inset-0 opacity-50 dark:opacity-30 transition-opacity duration-500"
          style={{
            background:
              'radial-gradient(circle at 15% 30%, rgba(249,115,22,0.10), transparent 40%), radial-gradient(circle at 85% 70%, rgba(56,189,248,0.10), transparent 40%)',
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 sm:py-10">
          {/* HEADER */}
          <div className="text-center mb-7 sm:mb-10 md:mb-12" style={headerReveal}>
            <h2 className="heading-display text-3xl sm:text-4xl lg:text-5xl text-brand-gradient mb-3 md:mb-4 leading-[1.12] tracking-tight">
              {t('why.heading')}
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto transition-colors">
              {t('why.subtitle')}
            </p>
          </div>

          {/* CARDS — 3 columns on desktop */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-5xl mx-auto"
            style={{ perspective: '1400px' }}
          >
            {reasons.map((r, i) => {
              const state = getCardState(i);
              const isHovered = hovered === i;

              return (
                <div
                  key={i}
                  className="relative min-w-0"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: state.transform,
                    opacity: state.opacity,
                    willChange: state.willChange,
                    transition: state.transition,
                  }}
                  onMouseMove={(e) => handleMouseMove(e, i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Card surface */}
                  <div
                    className="
                      group relative rounded-2xl
                      overflow-hidden
                      border border-slate-200/80 dark:border-white/10
                      bg-slate-900 dark:bg-[#14161b]
                      shadow-[0_10px_40px_-12px_rgba(15,23,42,0.18)]
                      dark:shadow-[0_10px_40px_-12px_rgba(0,0,0,0.65)]
                      transition-colors duration-300
                    "
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* IMAGE BACKGROUND */}
                    <div className="absolute inset-0">
                      <div
                        className="absolute inset-0 transition-transform duration-700 ease-out"
                        style={{
                          transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                        }}
                      >
                        <Image
                          src={r.image}
                          alt={r.imageAlt}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                          unoptimized
                        />
                      </div>

                      {/* SMOOTH BOTTOM GRADIENT BLEND */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `
                            linear-gradient(
                              to bottom,
                              rgba(15,23,42,0.35) 0%,
                              rgba(15,23,42,0.20) 25%,
                              rgba(15,23,42,0.45) 45%,
                              rgba(15,23,42,0.82) 62%,
                              rgba(15,23,42,0.96) 78%,
                              rgba(15,23,42,1) 100%
                            )
                          `,
                        }}
                      />

                      {/* Top veil */}
                      <div
                        className="absolute inset-x-0 top-0 h-1/3"
                        style={{
                          background:
                            'linear-gradient(to bottom, rgba(15,23,42,0.35), transparent)',
                        }}
                      />
                    </div>

                    {/* CARD CONTENT */}
                    <div className="relative p-5 sm:p-6 md:p-7 pt-24 sm:pt-36 md:pt-48 flex flex-col min-h-[210px] sm:min-h-[300px] md:min-h-[360px]">
                      <div className="mt-auto">
                        <h3 className="font-bold text-lg md:text-xl text-white mb-1.5 sm:mb-2 transition-colors">
                          {r.title}
                        </h3>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-200/90 transition-colors">
                          {r.desc}
                        </p>
                      </div>
                    </div>

                    {/* Subtle hover ring */}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-500"
                      style={{
                        opacity: isHovered ? 1 : 0,
                        boxShadow:
                          'inset 0 0 0 1px rgba(255,255,255,0.25), inset 0 -40px 60px -20px rgba(249,115,22,0.18)',
                      }}
                    />
                  </div>

                  {/* Floating shadow under the card */}
                  <div
                    className="
                      pointer-events-none
                      hidden sm:block
                      absolute -bottom-3 left-1/2 -translate-x-1/2
                      h-3 rounded-full
                      bg-slate-900/15 dark:bg-black/50
                      blur-xl
                      transition-all duration-500
                    "
                    style={{
                      width: isHovered ? '60%' : '75%',
                      opacity: isHovered ? 0.9 : 0.7,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}