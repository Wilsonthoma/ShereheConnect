'use client';

import React from 'react';
import Link from 'next/link';

interface EventCardProps {
  id: string;
  title: string;
  category?: string;
  imageUrl?: string;
  venue?: string;
  county?: string;
  date?: string;
  price?: number;
  originalPrice?: number;
  isFeatured?: boolean;
  isSaved?: boolean;
  onSave?: (id: string) => void;
  onBook?: (id: string) => void;
  href?: string;
}

export function EventCard({
  id,
  title,
  category,
  imageUrl,
  venue,
  county,
  date,
  price,
  originalPrice,
  isFeatured = false,
  isSaved = false,
  onSave,
  onBook,
  href,
}: EventCardProps) {
  return (
    <div
      className="group relative flex flex-col h-[420px] sm:h-[440px] md:h-[460px] w-full overflow-hidden cursor-pointer
                 bg-[#1a1a2e] rounded-[20px]
                 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]
                 transition-all duration-[350ms] ease-out
                 hover:shadow-[0_25px_40px_-15px_rgba(0,0,0,0.35)]
                 hover:-translate-y-[5px]"
    >
      <div className="relative w-full h-[220px] sm:h-[240px] md:h-[260px] shrink-0 overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold to-orange" />
        )}

        <div
          className="absolute bottom-0 left-0 right-0 h-[60%] pointer-events-none z-[1]"
          style={{ background: 'linear-gradient(to top, rgba(236, 100, 8, 0.95) 0%, rgba(236, 100, 8, 0.8) 15%, rgba(236, 100, 8, 0.5) 35%, rgba(236, 100, 8, 0.2) 60%, transparent 100%)' }}
        />

        {isFeatured && (
          <span className="absolute top-3 left-3 md:top-4 md:left-4 z-[2] bg-gradient-to-br from-gold to-orange text-white px-3 py-1 md:px-[0.9rem] md:py-[0.3rem] rounded-[30px] text-[0.65rem] md:text-[0.7rem] font-bold">
            Featured
          </span>
        )}

        {onSave && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSave(id); }}
            className={`absolute top-3 right-3 md:top-4 md:right-4 z-10 flex items-center gap-1.5 md:gap-[0.4rem] px-2.5 py-1.5 md:px-[0.8rem] md:py-[0.4rem] rounded-[30px] text-[0.65rem] md:text-[0.7rem] font-medium text-white backdrop-blur-[8px] transition-all duration-300 ease-out ${isSaved ? 'bg-[#ef4444]' : 'bg-black/60 hover:bg-[#f59e0b]'}`}
          >
            <span>{isSaved ? '❤️' : '🤍'}</span>
            <span className="hidden sm:inline">Save</span>
          </button>
        )}

        <div className="absolute bottom-0 left-0 right-0 z-[2] px-3 md:px-4 pt-4 md:pt-5 pb-2 md:pb-3 text-white">
          {category && (
            <span className="inline-block px-2.5 py-0.5 md:px-3 md:py-1 mb-1.5 md:mb-2 bg-black/50 backdrop-blur-[8px] border border-white/20 rounded-[30px] text-[0.6rem] md:text-[0.7rem] font-bold uppercase text-white">
              {category}
            </span>
          )}
          <h3 className="text-[0.9rem] md:text-[1rem] font-bold leading-[1.3] text-white mb-1 md:mb-[6px] line-clamp-2">
            {title}
          </h3>
          <div className="flex flex-wrap gap-2 md:gap-[10px] text-[0.65rem] md:text-[0.7rem] opacity-90 text-white/90">
            {venue && <span className="flex items-center gap-1 truncate">📍 {venue}</span>}
            {county && <span className="flex items-center gap-1">🗺️ {county}</span>}
            {date && <span className="flex items-center gap-1">📅 {date}</span>}
          </div>
          {price !== undefined && (
            <div className="mt-1 flex items-baseline gap-2">
              <span className="inline-block px-2 py-0.5 md:px-[10px] md:py-[3px] bg-black/40 rounded-[30px] text-[0.75rem] md:text-[0.85rem] font-bold text-[#ffd045]">
                KES {price.toLocaleString()}
              </span>
              {originalPrice && (
                <span className="text-[0.6rem] md:text-[0.65rem] text-white/60 line-through ml-1">
                  KES {originalPrice.toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1" />

      {(href || onBook) && (
        <div className="flex gap-2 md:gap-3 px-3 md:px-4 pb-3 md:pb-4 pt-2 shrink-0">
          {href && (
            <Link href={href} className="flex-1 flex items-center justify-center px-3 py-2 md:px-[0.6rem] md:py-[0.45rem] rounded-[30px] text-[0.65rem] md:text-[0.7rem] font-medium text-white bg-white/12 border border-white/20 transition-all duration-300 ease-out hover:bg-white/25">
              View Details
            </Link>
          )}
          {onBook && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBook(id); }}
              className="flex-1 flex items-center justify-center px-3 py-2 md:px-[0.6rem] md:py-[0.45rem] rounded-[30px] text-[0.65rem] md:text-[0.7rem] font-medium text-white bg-gradient-to-br from-gold to-orange transition-all duration-300 ease-out hover:-translate-y-[2px] hover:shadow-[0_4px_10px_rgba(245,158,11,0.3)]"
            >
              Book Now
            </button>
          )}
        </div>
      )}
    </div>
  );
}
