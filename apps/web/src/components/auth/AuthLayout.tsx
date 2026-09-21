'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showBackButton?: boolean;
  backHref?: string;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  showBackButton = true,
  backHref = '/',
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen relative bg-dark-deep overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1600')",
        }}
      />
      <div className="absolute inset-0 z-[1] bg-black/70" />
      <div
        className="absolute inset-0 z-[2]"
        style={{
          background:
            'linear-gradient(135deg, rgba(236,100,8,0.25) 0%, rgba(245,158,11,0.1) 50%, rgba(236,100,8,0.25) 100%)',
        }}
      />

      <div className="relative z-[3] min-h-screen flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-md">
          <div className="relative bg-[#0f172a]/85 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5 sm:p-6">
            {showBackButton && (
              <Link
                href={backHref}
                className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center border border-white/15 bg-black/30 text-white/70 hover:text-gold hover:border-gold/50 transition-all"
                aria-label="Go back"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            )}

            {/* Logo */}
            <div className="flex justify-center mb-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-brand-gradient blur-xl opacity-50" />
                <div className="relative w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center shadow-lg">
                  <span
                    className="text-white text-xl font-bold"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    S
                  </span>
                </div>
              </div>
            </div>

            {/* Title */}
            <h1
              className="text-center text-2xl sm:text-3xl text-white mb-1 leading-tight"
              style={{
                fontFamily: 'var(--font-display)',
                paddingTop: '0.1em',
                paddingBottom: '0.1em',
              }}
            >
              {title}
            </h1>

            {/* Optional subtitle */}
            {subtitle && (
              <p className="text-center text-xs text-white/60 mb-4">{subtitle}</p>
            )}

            {/* Content */}
            <div className={!subtitle ? 'mt-4' : ''}>{children}</div>

            {footer && (
              <div className="mt-4 pt-4 border-t border-white/10 text-center text-xs text-white/60">
                {footer}
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/50 hover:text-gold transition-colors text-xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>ShereheConnect</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
