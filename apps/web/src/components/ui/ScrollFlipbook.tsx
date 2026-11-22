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

const FALLBACKS: Record<string, string> = {
  'flipbook.viewEvent': 'View Event',
  'flipbook.hint': 'Scroll or drag to flip through',
  'flipbook.pricePrefix': 'KES',
};

export function ScrollFlipbook({
  images,
  vhPerPaper = 150,
  className = '',
}: ScrollFlipbookProps) {
  const { t } = useLanguage();

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

  const pinHeightVh = Math.max(120, total * vhPerPaper + 60);

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

    let rafId = 0;
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

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      const y =
        'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const deltaY = dragStartY - y;
      if (Math.abs(deltaY) < 4) return;

      const vh = window.innerHeight;
      const progressDelta = deltaY / (vh * 1.15);
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
    0.6,
    Math.min(1, 0.6 + ((viewportWidth - 375) / (1440 - 375)) * 0.4),
  );

  const ease = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const flipCurve = (t: number) => {
    if (t < 0.25) return ease(t / 0.25) * 0.15;
    if (t < 0.75) return 0.15 + ((t - 0.25) / 0.5) * 0.7;
    return 0.85 + ease((t - 0.75) / 0.25) * 0.15;
  };

  // Compact, balanced card sizing so the deck & hint fit cleanly inside the sticky frame
  const horizontalAllowance = viewportWidth >= 1024 ? 760 : 40;
  const verticalAllowance = 156;

  const availableWidth = Math.max(200, viewportWidth - horizontalAllowance);
  const availableHeight = Math.max(240, viewportHeight - verticalAllowance);

  const maxCardWidth = viewportWidth >= 1024 ? 360 : 390;

  let cardWidth = Math.min(maxCardWidth, availableWidth);
  const heightAtThisWidth = (cardWidth * 5) / 4;
  if (heightAtThisWidth > availableHeight) {
    cardWidth = (availableHeight * 4) / 5;
  }
  cardWidth = Math.max(180, cardWidth);
  const cardHeight = (cardWidth * 5) / 4;

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
      papersAbove * (3.5 * scaleFactor) + driftSign * 1.5 * scaleFactor;

    const stackedTranslateY = papersAbove * (2.5 * scaleFactor);
    const stackedScale = 1 - papersAbove * 0.008;

    const isTop = papersAbove === 0 && flyProgress < 0.05;
    const canHover = isTop && hoveredCard === index;
    const hoverLift = canHover ? -12 : 0;
    const hoverScaleBoost = canHover ? 1.02 : 1;
    const hoverTilt = canHover ? -1.5 : 0;

    const liftPhase = Math.min(1, flyProgress / 0.25);
    const flipPhase = Math.max(0, (flyProgress - 0.25) / 0.75);
    const easedFlip = ease(flipPhase);

    const spinDegrees = -180 * easedFlip;
    const liftZ = 85 * scaleFactor * liftPhase * (1 - easedFlip * 0.5);
    const liftY = -26 * scaleFactor * liftPhase * (1 - easedFlip);

    const endZ = -180 * scaleFactor - papersBelow * zStep;
    const flipZ = stackedZ + liftZ + (endZ - stackedZ) * easedFlip;

    const flipX = stackedTranslateX + (-22 * scaleFactor) * easedFlip;
    const flipY = stackedTranslateY + liftY + 36 * scaleFactor * easedFlip;

    const flipScale = stackedScale * (1 - 0.14 * easedFlip);

    const flipRotate =
      stackedRotate + (index % 2 === 0 ? -8 : 8) * easedFlip;

    const flipOpacity =
      flyProgress < 0.75 ? 1 : 1 - ((flyProgress - 0.75) / 0.25) * 0.55;

    const baseZ = (total - index) * 10;
    const flipBoost =
      flyProgress < 0.5
        ? Math.floor(flyProgress * 2 * 400)
        : Math.floor((1 - flyProgress) * 2 * 400) - 500;
    const zIndex = baseZ + flipBoost;

    const flightLift = Math.sin(flyProgress * Math.PI);
    const flipShadow =
      flyProgress > 0.05 && flyProgress < 0.95
        ? `0 ${20 + 45 * flightLift}px ${
            38 + 75 * flightLift
          }px rgba(0,0,0,${0.28 + 0.35 * flightLift})`
        : canHover
          ? '0 20px 38px rgba(0,0,0,0.26)'
          : '0 8px 20px rgba(0,0,0,0.16)';

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
  const rotateXTilt = 20 + 5 * scaleFactor;

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ height: `${pinHeightVh}vh` }}
    >
      <div
        className="sticky top-0 flex items-center justify-center"
        style={{
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
                transform: `rotateX(${rotateXTilt}deg) rotateZ(-3.5deg)`,
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
                        borderRadius: '12px',
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
                          borderRadius: '12px',
                        }}
                      >
                        {/* Main card sheet */}
                        <div
                          className="
                            relative w-full h-full rounded-xl
                            bg-white dark:bg-slate-900
                            border border-orange-500/75 dark:border-orange-400/70
                            p-2
                            transition-colors duration-300
                          "
                          style={{
                            transformStyle: 'preserve-3d',
                          }}
                        >
                          {/* Subtle left binding spine */}
                          <div
                            aria-hidden="true"
                            className="
                              pointer-events-none absolute top-2 bottom-2 left-2 w-1.5 rounded-l-md z-20
                              bg-gradient-to-b from-orange-500/80 via-orange-600/70 to-orange-700/80
                            "
                          />

                          <div className="relative w-full h-full rounded-lg overflow-hidden bg-slate-900">
                            <img
                              src={image.src}
                              alt={image.alt}
                              className="absolute inset-0 w-full h-full object-cover"
                              loading={index === 0 ? 'eager' : 'lazy'}
                              draggable={false}
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />

                            {image.category && (
                              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-brand-gradient text-white text-[0.6rem] font-bold uppercase tracking-wider shadow-md">
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
                                  <span className="text-sm sm:text-base font-bold text-orange-400 drop-shadow-md">
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
                                  className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md bg-brand-gradient text-white text-[0.7rem] sm:text-xs font-semibold transition-all shrink-0 ${
                                    isTop && flyProgress < 0.05
                                      ? 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/40 cursor-pointer'
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

                        {/* Under-sheet depth shadow */}
                        <div
                          aria-hidden="true"
                          className="absolute -inset-[2px] rounded-xl -z-10"
                          style={{
                            transform: 'translateZ(-5px)',
                            background:
                              'linear-gradient(135deg, rgba(249,115,22,0.28), rgba(234,88,12,0.16))',
                            filter: 'blur(2px)',
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
            className="mt-3 sm:mt-4 h-9 flex flex-col items-center justify-center gap-0.5 transition-opacity duration-500 pointer-events-none"
            style={{ opacity: progress < 0.02 ? 1 : 0 }}
          >
            <span className="text-[0.7rem] font-medium text-slate-500 dark:text-slate-400">
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