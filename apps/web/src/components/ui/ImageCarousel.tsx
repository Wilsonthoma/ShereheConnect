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

  useEffect(() => {
    if (isPaused || images.length <= 1) return;
    const t = setInterval(next, interval);
    return () => clearInterval(t);
  }, [next, interval, isPaused, images.length]);

  return (
    <div
      className={`relative w-full h-full overflow-hidden rounded-3xl shadow-2xl ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {images.map((img, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === current ? 'opacity-100' : 'opacity-0'}`}
        >
          <img src={img.src} alt={img.alt} className="w-full h-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
          />
        ))}
      </div>
    </div>
  );
}
