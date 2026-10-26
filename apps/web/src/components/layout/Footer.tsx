'use client';

import Link from 'next/link';
import {
  Calendar,
  Camera,
  Send,
  Briefcase,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  // ============================================
  // LOCAL FALLBACKS
  // In case footer keys aren't in translations.ts yet.
  // ============================================
  const tt = (key: string, fallback: string): string => {
    const value = t(key as any);
    return value === key ? fallback : value;
  };

  return (
    <footer className="relative bg-light dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="container-fluid py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-10 lg:gap-8">

          {/* ============================================
              Branding column — matches navbar style
          ============================================ */}
          <div className="sm:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
                <Calendar className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display text-xl text-slate-900 dark:text-white tracking-wide transition-colors">
                  ShereheConnect
                </span>
                <span className="text-[0.65rem] text-gold/90 dark:text-gold/80 font-medium tracking-wider uppercase mt-0.5">
                  {tt('footer.taglineShort', 'Discover Events')}
                </span>
              </div>
            </Link>

            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm leading-relaxed transition-colors">
              {tt(
                'footer.tagline',
                "Discover, book, and manage events across Kenya with confidence. From festivals to conferences — all in one place.",
              )}
            </p>

            <div className="flex gap-2.5">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-white/70 hover:text-white hover:bg-brand-gradient hover:border-transparent transition-all"
              >
                <Camera className="w-4 h-4" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-white/70 hover:text-white hover:bg-brand-gradient hover:border-transparent transition-all"
              >
                <Send className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-white/70 hover:text-white hover:bg-brand-gradient hover:border-transparent transition-all"
              >
                <Briefcase className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/254743042018"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-white/70 hover:text-white hover:bg-brand-gradient hover:border-transparent transition-all"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* ============================================
              Company
          ============================================ */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold mb-5">
              {tt('footer.company', 'Company')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-slate-500 dark:text-slate-400 hover:text-gold transition-colors"
                >
                  {tt('footer.about', 'About')}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-slate-500 dark:text-slate-400 hover:text-gold transition-colors"
                >
                  {tt('footer.contact', 'Contact')}
                </Link>
              </li>
              <li>
                <Link
                  href="/customer-stories"
                  className="text-slate-500 dark:text-slate-400 hover:text-gold transition-colors"
                >
                  {tt('footer.customerStories', 'Customer Stories')}
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-slate-500 dark:text-slate-400 hover:text-gold transition-colors"
                >
                  {tt('footer.careers', 'Careers')}
                </Link>
              </li>
            </ul>
          </div>

          {/* ============================================
              Events
          ============================================ */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold mb-5">
              {tt('footer.events', 'Events')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/events"
                  className="text-slate-500 dark:text-slate-400 hover:text-gold transition-colors"
                >
                  {tt('footer.browseEvents', 'Browse Events')}
                </Link>
              </li>
              <li>
                <Link
                  href="/my-tickets"
                  className="text-slate-500 dark:text-slate-400 hover:text-gold transition-colors"
                >
                  {tt('footer.myTickets', 'My Tickets')}
                </Link>
              </li>
              <li>
                <Link
                  href="/organizers"
                  className="text-slate-500 dark:text-slate-400 hover:text-gold transition-colors"
                >
                  {tt('footer.forOrganizers', 'For Organizers')}
                </Link>
              </li>
              <li>
                <Link
                  href="/wishlist"
                  className="text-slate-500 dark:text-slate-400 hover:text-gold transition-colors"
                >
                  {tt('footer.wishlist', 'Wishlist')}
                </Link>
              </li>
            </ul>
          </div>

          {/* ============================================
              Get in Touch
          ============================================ */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold mb-5">
              {tt('footer.getInTouch', 'Get in Touch')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="mailto:hello@shereheconnect.co.ke"
                  className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 hover:text-gold transition-colors"
                >
                  <Mail className="w-4 h-4 text-gold/70 shrink-0" />
                  <span className="break-all">hello@shereheconnect.co.ke</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+254743042018"
                  className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 hover:text-gold transition-colors"
                >
                  <Phone className="w-4 h-4 text-gold/70 shrink-0" />
                  <span>+254 743 042 018</span>
                </a>
              </li>
              <li>
                <a
                  href="https://maps.google.com/?q=Nairobi,Kenya"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 hover:text-gold transition-colors"
                >
                  <MapPin className="w-4 h-4 text-gold/70 shrink-0" />
                  <span>{tt('footer.location', 'Nairobi, Kenya')}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ============================================
            Bottom bar
        ============================================ */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center md:text-left">
            © {new Date().getFullYear()} ShereheConnect.{' '}
            {tt('footer.rights', 'All rights reserved.')}
          </p>
          <div className="flex gap-6 text-xs text-slate-400 dark:text-slate-500">
            <Link
              href="/terms"
              className="hover:text-gold transition-colors"
            >
              {tt('footer.terms', 'Terms')}
            </Link>
            <Link
              href="/privacy"
              className="hover:text-gold transition-colors"
            >
              {tt('footer.privacy', 'Privacy')}
            </Link>
            <Link
              href="/cookies"
              className="hover:text-gold transition-colors"
            >
              {tt('footer.cookies', 'Cookies')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}