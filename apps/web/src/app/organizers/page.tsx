'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import {
  Calendar,
  Users,
  TrendingUp,
  CreditCard,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function OrganizersPage() {
  const { t } = useLanguage();

  const tr = (key: string, fallback: string): string => {
    const value = t(key as any);
    return value === key ? fallback : value;
  };

  const benefits = [
    {
      icon: Calendar,
      title: tr('organizers.benefit1.title', 'Easy Event Creation'),
      desc: tr(
        'organizers.benefit1.desc',
        'Build and publish events in minutes.',
      ),
    },
    {
      icon: CreditCard,
      title: tr('organizers.benefit2.title', 'M-Pesa Payments'),
      desc: tr(
        'organizers.benefit2.desc',
        'Attendees pay directly to your account.',
      ),
    },
    {
      icon: TrendingUp,
      title: tr('organizers.benefit3.title', 'Real-Time Tracking'),
      desc: tr(
        'organizers.benefit3.desc',
        'See sales and attendees as they happen.',
      ),
    },
    {
      icon: Users,
      title: tr('organizers.benefit4.title', 'Attendee Management'),
      desc: tr(
        'organizers.benefit4.desc',
        'Message, export, and check-in attendees.',
      ),
    },
    {
      icon: BarChart3,
      title: tr('organizers.benefit5.title', 'Analytics'),
      desc: tr(
        'organizers.benefit5.desc',
        'Understand your audience and revenue.',
      ),
    },
    {
      icon: CheckCircle2,
      title: tr('organizers.benefit6.title', 'Verified Platform'),
      desc: tr(
        'organizers.benefit6.desc',
        'Every event reviewed before going live.',
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-light dark:bg-slate-950 transition-colors">
      {/* ============================================
          HERO — dark section with ambient glows
      ============================================ */}
      <section className="relative py-20 md:py-28 bg-dark-deep overflow-hidden">
        {/* Ambient glows — theme-tuned */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/10 dark:bg-gold/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange/10 dark:bg-orange/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative container-fluid text-center">
          <h1 className="heading-display heading-lg text-white mb-6">
            {tr('organizers.hero.line1', 'Host Events That')}
            <br />
            <span className="text-brand-gradient">
              {tr('organizers.hero.line2', 'People Remember')}
            </span>
          </h1>

          <p className="text-fluid-lg text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            {tr(
              'organizers.hero.subtitle',
              'ShereheConnect gives you everything you need to create, promote, and manage successful events across Kenya.',
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Link href="/register">
              <Button variant="primary" size="lg" fullWidth>
                {tr('organizers.hero.ctaPrimary', 'Start Organizing')}
              </Button>
            </Link>
            <Link href="/events">
              <Button variant="outline-light" size="lg" fullWidth>
                {tr('organizers.hero.ctaSecondary', 'Browse Events')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
          BENEFITS GRID
      ============================================ */}
      <section className="py-16 md:py-24 bg-light dark:bg-slate-950 transition-colors">
        <div className="container-fluid">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="heading-display heading-md text-brand-gradient mb-3 md:mb-4">
              {tr('organizers.benefits.heading', 'Everything You Need')}
            </h2>
            <p className="text-fluid-base text-gray dark:text-slate-400 max-w-2xl mx-auto transition-colors">
              {tr(
                'organizers.benefits.subtitle',
                'Powerful tools built for Kenyan event organizers.',
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={i}
                  className="
                    group
                    bg-white dark:bg-slate-900
                    rounded-2xl p-8
                    border border-slate-200/60 dark:border-slate-800
                    shadow-card
                    hover:shadow-card-hover hover:-translate-y-1
                    transition-all duration-300
                  "
                >
                  <div className="w-14 h-14 rounded-xl bg-brand-gradient flex items-center justify-center mb-5 shadow-md group-hover:scale-105 transition-transform">
                    <Icon
                      className="w-7 h-7 text-white"
                      strokeWidth={2}
                    />
                  </div>
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2 transition-colors">
                    {b.title}
                  </h3>
                  <p className="text-fluid-sm text-slate-500 dark:text-slate-400 leading-relaxed transition-colors">
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================
          FINAL CTA
      ============================================ */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-900 transition-colors">
        <div className="container-md text-center">
          <h2 className="heading-display heading-md text-slate-900 dark:text-white mb-6 transition-colors">
            {tr('organizers.cta.heading', 'Ready to get started?')}
          </h2>
          <p className="text-fluid-base text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto transition-colors">
            {tr(
              'organizers.cta.subtitle',
              'Create your organizer account today and start selling tickets.',
            )}
          </p>
          <Link href="/register">
            <Button variant="primary" size="lg">
              {tr('organizers.cta.button', 'Create Organizer Account')}
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}