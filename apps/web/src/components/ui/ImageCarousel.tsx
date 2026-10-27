'use client';

import { useState, useEffect, useCallback } from 'react';

interface ImageCarouselProps {
  images: { src: string; alt: string }[];
  interval?: number;
  className?: string;
}

export function ImageCarousel({ images, interval = 4000, className = '' }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setCurrent((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (isPaused || images.length <= 1) return;
    const t = setInterval(next, interval);
    return () => clearInterval(t);
  }, [next, interval, isPaused, images.length]);

  if (!images.length) return null;
  const isSingle = images.length <= 1;

  return (
    <div
      className={`group relative w-full h-full overflow-hidden rounded-3xl shadow-2xl bg-slate-100 dark:bg-slate-800 ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Image gallery"
    >
      {/* Slides */}
      {images.map((img, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
          aria-hidden={i !== current}
        >
          <img
            src={img.src}
            alt={img.alt}
            className={`w-full h-full object-cover transition-transform duration-[6000ms] ease-linear ${
              i === current ? 'scale-105' : 'scale-100'
            }`}
            loading={i === 0 ? 'eager' : 'lazy'}
            draggable={false}
          />
        </div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none z-20" />

      {/* Counter pill — top-right */}
      {!isSingle && (
        <span className="absolute top-4 right-4 z-30 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold tabular-nums">
          {current + 1} / {images.length}
        </span>
      )}

      {/* Prev / Next — fade in on hover, amber on hover */}
      {!isSingle && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-slate-700 shadow-lg opacity-0 group-hover:opacity-100 hover:bg-[#f59e0b] hover:text-white hover:scale-110 transition-all duration-200"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-slate-700 shadow-lg opacity-0 group-hover:opacity-100 hover:bg-[#f59e0b] hover:text-white hover:scale-110 transition-all duration-200"
          >
            ›
          </button>
        </>
      )}

      {/* Dots — bottom center, active = amber gradient pill */}
      {!isSingle && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === current}
              className={`h-2 rounded-full transition-all duration-300 ease-out ${
                i === current
                  ? 'w-8 shadow-md'
                  : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
              style={
                i === current
                  ? { background: 'linear-gradient(135deg, #f59e0b, #ec6408)' }
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}