'use client';

import dynamic from 'next/dynamic';
import { Navbar } from '@/components/layout';

const VerificationBanner = dynamic(
  () => import('@/components/auth').then((mod) => mod.VerificationBanner),
  {
    ssr: false,
    loading: () => null,
  },
);

const Footer = dynamic(
  () => import('@/components/layout').then((mod) => mod.Footer),
  {
    ssr: false,
    loading: () => (
      <footer className="h-24 bg-light dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800" />
    ),
  },
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-[70px] overflow-x-clip min-h-screen bg-light dark:bg-slate-950">
        <VerificationBanner />
        {children}
      </main>
      <Footer />
    </>
  );
}