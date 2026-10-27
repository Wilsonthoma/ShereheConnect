'use client';

import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';

type EventImageVariant = 'card' | 'thumbnail' | 'thumb-sm' | 'hero' | 'banner';

interface EventImageProps {
  src?: string | null;
  alt: string;
  variant?: EventImageVariant;
  className?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function resolveImageUrl(src?: string | null): string | null {
  if (!src) return null;
  const trimmed = src.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `${API_URL}${trimmed}`;
  return `${API_URL}/${trimmed.replace(/^\/+/, '')}`;
}

export function EventImage({
  src,
  alt,
  variant = 'card',
  className = '',
}: EventImageProps) {
  const wrapperClass = {
    // Card image — 4:3 aspect, strictly capped
    card: 'relative w-full aspect-[4/3] max-h-[220px] overflow-hidden',
    // Fixed 80×80 thumbnail — never grows
    thumbnail: 'relative w-20 h-20 shrink-0 overflow-hidden rounded-lg',
    // Even smaller — 56×56 for compact lists
    'thumb-sm': 'relative w-14 h-14 shrink-0 overflow-hidden rounded-md',
    // Detail hero — 4:3 capped
    hero: 'relative w-full aspect-[4/3] max-h-[360px] md:max-h-[440px] overflow-hidden',
    // Banner — 16:9 capped
    banner: 'relative w-full aspect-[16/9] max-h-[280px] md:max-h-[360px] overflow-hidden',
  }[variant];

  const url = resolveImageUrl(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!url || failed) {
    return (
      <div
        className={`${wrapperClass} bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center ${className}`}
      >
        <Calendar
          className={variant === 'thumb-sm' ? 'w-5 h-5 text-white/70' : 'w-8 h-8 text-white/70'}
          strokeWidth={1.5}
        />
      </div>
    );
  }

  return (
    <div className={`${wrapperClass} bg-slate-100 dark:bg-slate-800 ${className}`}>
      <img
        src={url}
        alt={alt}
        loading="eager"
        draggable={false}
        onError={() => setFailed(true)}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}