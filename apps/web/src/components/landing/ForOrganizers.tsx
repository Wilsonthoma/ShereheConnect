'use client';

import Link from 'next/link';
import { Button, ScrollFlipbook } from '../ui';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function ForOrganizers() {
  const { t } = useLanguage();

  const benefits = [
    t('org.benefit1'),
    t('org.benefit2'),
    t('org.benefit3'),
    t('org.benefit4'),
  ];

  const bookPages = [
    {
      src: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=1200',
      alt: 'Blankets & Wine concert crowd',
      title: 'Blankets & Wine 2026',
      category: 'Festival',
      venue: 'Ngong Race Course',
      date: '15 Mar 2026',
      price: 1500,
      href: '/events/blankets-and-wine-2026',
    },
    {
      src: 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=1200',
      alt: 'Nairobi Tech Summit audience',
      title: 'Nairobi Tech Summit',
      category: 'Conference',
      venue: 'KICC',
      date: '22 Apr 2026',
      price: 5000,
      href: '/events/nairobi-tech-summit',
    },
    {
      src: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1200',
      alt: 'Live music festival stage',
      title: 'Mombasa Cultural Festival',
      category: 'Arts & Culture',
      venue: 'Fort Jesus',
      date: '10 May 2026',
      price: 800,
      href: '/events/mombasa-cultural-festival',
    },
    {
      src: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1200',
      alt: 'Kisumu Music Night crowd',
      title: 'Kisumu Music Night',
      category: 'Entertainment',
      venue: 'Impala Grounds',
      date: '5 Jun 2026',
      price: 1200,
      href: '/events/kisumu-music-night',
    },
  ];

  return (
    <section className="relative bg-light dark:bg-slate-950 py-16 md:py-24 transition-colors overflow-x-clip">
      <div className="container-fluid">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-10 lg:gap-12 items-start">
          {/* Left: Text */}
          <div className="lg:sticky lg:top-28 order-2 lg:order-1">
            <h2 className="heading-display heading-md text-brand-gradient mb-6">
              {t('org.heading.line1')}
              <br />
              {t('org.heading.line2')}
            </h2>

            <p className="text-base text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              {t('org.subtitle')}
            </p>

            <ul className="space-y-3 mb-8">
              {benefits.map((b, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-slate-800 dark:text-slate-100"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-gradient mt-2 shrink-0" />
                  <span className="font-medium text-sm md:text-base">{b}</span>
                </li>
              ))}
            </ul>

            <Link href="/register">
              <Button variant="primary" size="lg">
                {t('org.cta')} →
              </Button>
            </Link>
          </div>

          {/* Right: Flipbook */}
          <div className="relative order-1 lg:order-2 min-w-0">
            <ScrollFlipbook images={bookPages} />
          </div>
        </div>
      </div>
    </section>
  );
}