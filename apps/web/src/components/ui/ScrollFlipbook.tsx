'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface FlipbookImage {
  src: string;
  alt: string;
  title: string;
  category?: string;
  venue?: string;
  date?: string;
  price?: number;
  href: string;
}

interface ScrollFlipbookProps {
  images: FlipbookImage[];
  vhPerPaper?: number;
  className?: string;
}

// ============================================
// LOCAL FALLBACKS
// If the key isn't in translations.ts yet, these
// are used so the component still renders correctly.
// Add these keys to translations.ts to localize.
// ============================================
const FALLBACKS: Record<string, string> = {
  'flipbook.viewEvent': 'View Event',
  'flipbook.hint': 'Scroll or drag to flip through',
  'flipbook.pricePrefix': 'KES',
};

export function ScrollFlipbook({
  images,
  vhPerPaper = 180,
  className = '',
}: ScrollFlipbookProps) {
  const { t } = useLanguage();

  /**
   * Translate wrapper with fallback — if the key isn't
   * defined in the dictionary, use the local fallback.
   */
  const tt = (key: string): string => {
    const translated = t(key as any);
    if (translated === key && FALLBACKS[key]) return FALLBACKS[key];
    return translated;
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [viewportWidth, setViewportWidth] = useState(1440);
  const [viewportHeight, setViewportHeight] = useState(900);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartProgress, setDragStartProgress] = useState(0);
  const total = images.length;

  const pinHeightVh = total * vhPerPaper + 100;

  useEffect(() => {
    const update = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId: number;
    let targetProgress = 0;
    let currentProgress = 0;
    let isAnimating = false;

    const computeTarget = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollable = rect.height - vh;
      if (scrollable <= 0) return 0;
      const scrolled = -rect.top;
      return Math.max(0, Math.min(1, scrolled / scrollable));
    };

    const tick = () => {
      const diff = targetProgress - currentProgress;
      if (Math.abs(diff) < 0.0002) {
        currentProgress = targetProgress;
        isAnimating = false;
      } else {
        currentProgress += diff * 0.06;
        isAnimating = true;
      }
      setProgress(currentProgress);
      if (isAnimating) rafId = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      targetProgress = computeTarget();
      if (!isAnimating) {
        isAnimating = true;
        rafId = requestAnimationFrame(tick);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    targetProgress = computeTarget();
    currentProgress = targetProgress;
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [total]);

  // Drag interaction
  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      const y = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const deltaY = dragStartY - y;
      if (Math.abs(deltaY) < 4) return;

      const vh = window.innerHeight;
      const progressDelta = deltaY / (vh * 1.2);
      const newProgress = Math.max(
        0,
        Math.min(1, dragStartProgress + progressDelta),
      );

      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      window.scrollTo({
        top: window.scrollY + rect.top + newProgress * scrollable,
        behavior: 'auto',
      });
    };

    const onUp = () => setIsDragging(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDragging, dragStartY, dragStartProgress]);

  const handleDragStart = (clientY: number, target: EventTarget | null) => {
    if (target instanceof HTMLElement) {
      const interactive = target.closest('a, button, [role="button"]');
      if (interactive) return;
    }
    setIsDragging(true);
    setDragStartY(clientY);
    setDragStartProgress(progress);
  };

  const scaleFactor = Math.max(
    0.55,
    Math.min(1, 0.55 + ((viewportWidth - 375) / (1440 - 375)) * 0.45),
  );

  const ease = (t: number) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const flipCurve = (t: number) => {
    if (t < 0.25) return ease(t / 0.25) * 0.15;
    if (t < 0.75) return 0.15 + ((t - 0.25) / 0.5) * 0.7;
    return 0.85 + ease((t - 0.75) / 0.25) * 0.15;
  };

  // ============================================
  // RESPONSIVE CARD SIZING
  // ============================================
  const SIDE_PADDING = 24;
  const HINT_AND_GAPS = 96;
  const EXTRA_TOP_BREATHING = 80;

  const availableWidth = viewportWidth - SIDE_PADDING;
  const availableHeight = viewportHeight - HINT_AND_GAPS - EXTRA_TOP_BREATHING;

  const maxCardWidth = viewportWidth >= 1024 ? 380 : 440;

  let cardWidth = Math.min(maxCardWidth, availableWidth);
  const heightAtThisWidth = (cardWidth * 5) / 4;
  if (heightAtThisWidth > availableHeight) {
    cardWidth = (availableHeight * 4) / 5;
  }
  cardWidth = Math.max(160, cardWidth);
  const cardHeight = (cardWidth * 5) / 4;

  /* ============================================
     FLIPBOOK RENDER LOGIC
  ============================================ */
  const getPaperState = (index: number) => {
    const flySlot = index;
    const timelinePosition = progress * total;

    const rawFlyProgress = Math.max(
      0,
      Math.min(1, timelinePosition - flySlot),
    );
    const flyProgress = flipCurve(rawFlyProgress);

    let papersAbove = 0;
    for (let j = 0; j < index; j++) {
      if (timelinePosition < j + 1) papersAbove++;
    }

    let papersBelow = 0;
    for (let j = 0; j < index; j++) {
      if (timelinePosition >= j + 1) papersBelow++;
    }

    const zStep = 14 * scaleFactor;
    const stackedZ = papersAbove * zStep;

    const rotateStep = 2.2 * scaleFactor;
    const stackedRotate =
      papersAbove * rotateStep - (total - 1) * (rotateStep / 2);

    const driftSign = index % 2 === 0 ? 1 : -1;
    const stackedTranslateX =
      papersAbove * (3 * scaleFactor) + driftSign * 1.5 * scaleFactor;

    const stackedTranslateY = papersAbove * (2.5 * scaleFactor);
    const stackedScale = 1 - papersAbove * 0.006;

    const isTop = papersAbove === 0 && flyProgress < 0.05;
    const canHover = isTop && hoveredCard === index;
    const hoverLift = canHover ? -14 : 0;
    const hoverScaleBoost = canHover ? 1.025 : 1;
    const hoverTilt = canHover ? -1.5 : 0;

    const liftPhase = Math.min(1, flyProgress / 0.25);
    const flipPhase = Math.max(0, (flyProgress - 0.25) / 0.75);
    const easedFlip = ease(flipPhase);

    const spinDegrees = -180 * easedFlip;
    const liftZ = 90 * scaleFactor * liftPhase * (1 - easedFlip * 0.5);
    const liftY = -30 * scaleFactor * liftPhase * (1 - easedFlip);

    const endZ = -180 * scaleFactor - papersBelow * zStep;
    const flipZ = stackedZ + liftZ + (endZ - stackedZ) * easedFlip;

    const flipX = stackedTranslateX + (-22 * scaleFactor) * easedFlip;
    const flipY = stackedTranslateY + liftY + 40 * scaleFactor * easedFlip;

    const flipScale = stackedScale * (1 - 0.14 * easedFlip);

    const flipRotate =
      stackedRotate + (index % 2 === 0 ? -8 : 8) * easedFlip;

    const flipOpacity =
      flyProgress < 0.75
        ? 1
        : 1 - ((flyProgress - 0.75) / 0.25) * 0.55;

    const baseZ = (total - index) * 10;
    const flipBoost =
      flyProgress < 0.5
        ? Math.floor(flyProgress * 2 * 400)
        : Math.floor((1 - flyProgress) * 2 * 400) - 500;
    const zIndex = baseZ + flipBoost;

    const flightLift = Math.sin(flyProgress * Math.PI);
    const flipShadow =
      flyProgress > 0.05 && flyProgress < 0.95
        ? `0 ${20 + 50 * flightLift}px ${
            40 + 80 * flightLift
          }px rgba(0,0,0,${0.3 + 0.4 * flightLift})`
        : canHover
        ? '0 20px 40px rgba(0,0,0,0.28)'
        : '0 8px 20px rgba(0,0,0,0.18)';

    return {
      transform: `translate3d(${flipX}px, ${flipY + hoverLift}px, ${flipZ}px) rotateY(${spinDegrees}deg) rotate(${
        flipRotate + hoverTilt
      }deg) scale(${flipScale * hoverScaleBoost})`,
      opacity: flipOpacity,
      zIndex,
      boxShadow: flipShadow,
      transformOrigin: 'left center',
      pointerEvents:
        flyProgress > 0.15 ? ('none' as const) : ('auto' as const),
      transition: canHover
        ? 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease'
        : 'none',
      isTop,
      flyProgress,
      canHover,
    };
  };

  const perspectiveValue = 1200 + 600 * scaleFactor;
  const rotateXTilt = 22 + 6 * scaleFactor;

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ height: `${pinHeightVh}vh` }}
    >
      <div
        className="sticky flex items-center justify-center"
        style={{
          top: 0,
          height: '100vh',
          height: '100dvh',
        }}
      >
        <div className="w-full h-full flex flex-col items-center justify-center px-3 sm:px-6">
          <div
            className="relative cursor-grab active:cursor-grabbing select-none"
            style={{
              width: `${cardWidth}px`,
              height: `${cardHeight}px`,
              perspective: `${perspectiveValue}px`,
              perspectiveOrigin: '35% 40%',
            }}
            onMouseDown={(e) => handleDragStart(e.clientY, e.target)}
            onTouchStart={(e) =>
              handleDragStart(e.touches[0].clientY, e.target)
            }
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateX(${rotateXTilt}deg) rotateZ(-4deg)`,
              }}
            >
              {[...images]
                .map((_, i) => i)
                .sort((a, b) => b - a)
                .map((index) => {
                  const image = images[index];
                  const state = getPaperState(index);
                  const { isTop, flyProgress } = state;

                  return (
                    <div
                      key={index}
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: state.transform,
                        opacity: state.opacity,
                        zIndex: state.zIndex,
                        boxShadow: state.boxShadow,
                        transformOrigin: state.transformOrigin,
                        pointerEvents: state.pointerEvents,
                        transition: state.transition,
                        willChange: 'transform, opacity',
                        backfaceVisibility: 'hidden',
                        borderRadius: '10px',
                      }}
                      onMouseEnter={() =>
                        isTop && flyProgress < 0.05 && setHoveredCard(index)
                      }
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <div
                        className="relative w-full h-full"
                        style={{
                          transformStyle: 'preserve-3d',
                          borderRadius: '10px',
                        }}
                      >
                        {/* Main paper body — orange brand border */}
                        <div
                          className="
                            absolute inset-0 rounded-md
                            bg-white dark:bg-slate-800
                            border-2 border-amber-500 dark:border-amber-400
                            p-2
                            transition-colors duration-500
                          "
                          style={{
                            borderRadius: '10px',
                            transformStyle: 'preserve-3d',
                            boxShadow:
                              '0 8px 24px -10px rgba(245,158,11,0.35), 0 4px 12px -4px rgba(0,0,0,0.15)',
                          }}
                        >
                          <div
                            className="relative w-full h-full rounded-sm overflow-hidden bg-slate-900"
                            style={{ borderRadius: '6px' }}
                          >
                            <img
                              src={image.src}
                              alt={image.alt}
                              className="absolute inset-0 w-full h-full object-cover"
                              loading={index === 0 ? 'eager' : 'lazy'}
                              draggable={false}
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />

                            {image.category && (
                              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-sm bg-brand-gradient text-white text-[0.6rem] font-bold uppercase tracking-wider shadow-md">
                                {image.category}
                              </div>
                            )}

                            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 text-white">
                              <h3 className="text-base sm:text-lg font-bold leading-tight mb-2 line-clamp-2 drop-shadow-md">
                                {image.title}
                              </h3>

                              <div className="flex flex-wrap items-center gap-3 text-[0.7rem] text-white/85 mb-3">
                                {image.venue && <span>{image.venue}</span>}
                                {image.date && <span>{image.date}</span>}
                              </div>

                              <div className="flex items-center justify-between gap-3">
                                {image.price !== undefined && (
                                  <span className="text-sm sm:text-base font-bold text-gold drop-shadow-md">
                                    {tt('flipbook.pricePrefix')}{' '}
                                    {image.price.toLocaleString()}
                                  </span>
                                )}

                                <Link
                                  href={image.href}
                                  onClick={(e) => {
                                    if (!isTop || flyProgress > 0.05) {
                                      e.preventDefault();
                                    }
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                  className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-sm bg-brand-gradient text-white text-[0.7rem] sm:text-xs font-semibold transition-all shrink-0 ${
                                    isTop && flyProgress < 0.05
                                      ? 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40 cursor-pointer'
                                      : 'opacity-50 pointer-events-none'
                                  }`}
                                >
                                  <span>{tt('flipbook.viewEvent')}</span>
                                  <span className="text-[0.7rem]">→</span>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Under-paper shadow */}
                        <div
                          className="absolute -inset-[3px] rounded-md -z-10"
                          style={{
                            transform: 'translateZ(-6px)',
                            background:
                              'linear-gradient(135deg, rgba(245,158,11,0.35), rgba(234,88,12,0.20))',
                            borderRadius: '12px',
                            filter: 'blur(1.5px)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* HINT */}
          <div
            className="mt-4 md:mt-6 h-10 flex flex-col items-center justify-center gap-1 transition-opacity duration-500 pointer-events-none"
            style={{ opacity: progress < 0.02 ? 1 : 0 }}
          >
            <span className="text-[0.7rem] font-medium text-slate-400 dark:text-slate-500">
              {tt('flipbook.hint')}
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-xs animate-bounce">
              ▼
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}