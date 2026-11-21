import dynamic from 'next/dynamic';
import { Navbar } from '@/components/layout';
import { Hero } from '@/components/landing';

const FeaturedEvents = dynamic(
  () => import('@/components/landing').then((mod) => mod.FeaturedEvents),
  {
    loading: () => (
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="h-8 w-56 rounded bg-slate-200 dark:bg-slate-800 animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      </section>
    ),
  },
);

const HowItWorks = dynamic(
  () => import('@/components/landing').then((mod) => mod.HowItWorks),
  {
    loading: () => (
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </section>
    ),
  },
);

const ForOrganizers = dynamic(
  () => import('@/components/landing').then((mod) => mod.ForOrganizers),
  {
    loading: () => (
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </section>
    ),
  },
);

const WhyShereheConnect = dynamic(
  () => import('@/components/landing').then((mod) => mod.WhyShereheConnect),
  {
    loading: () => (
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </section>
    ),
  },
);

const CTABand = dynamic(
  () => import('@/components/landing').then((mod) => mod.CTABand),
  {
    loading: () => (
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <div className="h-36 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </section>
    ),
  },
);

const Footer = dynamic(
  () => import('@/components/layout').then((mod) => mod.Footer),
  {
    loading: () => (
      <footer className="h-24 bg-light dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800" />
    ),
  },
);

export default function Home() {
  return (
    <main className="min-h-screen bg-light dark:bg-slate-950 transition-colors">
      <Navbar />
      <Hero />
      <FeaturedEvents />
      <HowItWorks />
      <ForOrganizers />
      <WhyShereheConnect />
      <CTABand />
      <Footer />
    </main>
  );
}