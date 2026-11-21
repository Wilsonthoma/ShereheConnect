'use client';

import { useEffect, useRef, useState } from 'react';

const BANNER_SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80',
    alt: 'Festival crowd',
  },
  {
    src: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1920&q=80',
    alt: 'Concert stage',
  },
  {
    src: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&q=80',
    alt: 'Live music',
  },
];

export default function BannerCarousel() {
  const [current, setCurrent] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (BANNER_SLIDES.length <= 1) return;
    const timer = window.setInterval(() => {
      if (!pausedRef.current && document.visibilityState === 'visible') {
        setCurrent((i) => (i + 1) % BANNER_SLIDES.length);
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className="relative w-full h-[160px] sm:h-[200px] md:h-[250px] overflow-hidden bg-slate-900"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
    >
      {BANNER_SLIDES.map((slide, i) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          loading={i === 0 ? 'eager' : 'lazy'}
          decoding="async"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
            i === current ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        />
      ))}

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {BANNER_SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current
                ? 'w-8 bg-gradient-to-r from-[#29ABE2] to-[#1A8CC4]'
                : 'w-2 bg-white/60 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  );
}