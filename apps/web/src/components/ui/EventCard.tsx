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
      className="group relative flex flex-col h-full w-full overflow-hidden cursor-pointer
                 bg-white rounded-2xl border border-slate-100
                 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]
                 transition-all duration-300 ease-out
                 hover:shadow-[0_0_0_2px_#f59e0b,0_12px_20px_-8px_rgba(0,0,0,0.08)]
                 hover:border-[#f59e0b] hover:-translate-y-1.5"
    >
      {/* ===== IMAGE (card-image-container) ===== */}
      <div className="relative w-full h-[240px] sm:h-[240px] md:h-[260px] shrink-0 overflow-hidden z-[1]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#f59e0b] to-[#ec6408]" />
        )}

        {/* Bottom gradient fade (card-image-container::after) */}
        <div
          className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none z-[5]"
          style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, #ffffff 100%)' }}
        />

        {/* Featured badge (featured-badge) */}
        {isFeatured && (
          <span
            className="absolute top-3 left-3 z-20 text-white px-2.5 py-1 rounded-md text-[0.65rem] font-bold uppercase tracking-wide shadow"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ec6408)' }}
          >
            Featured
          </span>
        )}

        {/* Wishlist button (wishlist-btn) */}
        {onSave && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSave(id); }}
            className={`absolute top-3 right-3 z-[100] flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.7rem] font-semibold backdrop-blur-sm transition-all duration-200 ${
              isSaved ? 'bg-[#ef4444] text-white' : 'bg-black/60 text-white hover:bg-[#ef4444]'
            }`}
          >
            <span>{isSaved ? '❤️' : '🤍'}</span>
            <span className="text-white">Save</span>
          </button>
        )}
      </div>

      {/* ===== CONTENT (card-content) ===== */}
      <div className="flex flex-col flex-grow px-4 pt-3 pb-2 bg-white relative z-10">
        {/* Category (card-category) */}
        {category && (
          <span className="self-start inline-block px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#d97706] text-[0.65rem] font-semibold uppercase tracking-wide mb-2">
            {category}
          </span>
        )}

        {/* Title (card-title) */}
        <h3 className="text-base font-bold text-slate-800 leading-snug mb-1.5 line-clamp-2 transition-colors duration-200 group-hover:text-[#ec6408]">
          {href ? <Link href={href}>{title}</Link> : title}
        </h3>

        {/* Meta (card-meta) */}
        <div className="flex flex-col gap-1 mb-2 text-[0.7rem] text-slate-500">
          {venue && (
            <span className="flex items-center gap-1.5">
              <span className="text-[#f59e0b] shrink-0">📍</span>
              <span className="truncate">{venue}</span>
            </span>
          )}
          {county && (
            <span className="flex items-center gap-1.5">
              <span className="text-[#f59e0b] shrink-0">🗺️</span>
              <span className="truncate">{county}</span>
            </span>
          )}
          {date && (
            <span className="flex items-center gap-1.5">
              <span className="text-[#f59e0b] shrink-0">📅</span>
              <span className="truncate">{date}</span>
            </span>
          )}
        </div>

        {/* Price (card-price / original-price) */}
        {price !== undefined && (
          <div className="mt-auto flex items-baseline gap-1.5">
            <span className="text-base font-extrabold text-[#ec6408]">
              KES {price.toLocaleString()}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-[0.7rem] text-slate-400 line-through font-normal">
                KES {originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ===== ACTIONS (card-actions) ===== */}
      {(href || onBook) && (
        <div className="flex gap-2 px-4 pt-2 pb-3 bg-white border-t border-slate-100 relative z-[100]">
          {href && (
            <Link
              href={href}
              className="flex-1 flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[0.7rem] font-semibold hover:bg-slate-200 hover:text-slate-800 hover:-translate-y-px transition-all duration-200"
            >
              View Details
            </Link>
          )}
          {onBook && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBook(id); }}
              className="flex-1 flex items-center justify-center px-2.5 py-1.5 rounded-lg text-white text-[0.7rem] font-semibold shadow-sm shadow-orange-500/15 hover:shadow-md hover:shadow-orange-500/25 hover:-translate-y-px transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ec6408)' }}
            >
              Book Now
            </button>
          )}
        </div>
      )}
    </div>
  );
}