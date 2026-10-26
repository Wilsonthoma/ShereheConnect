'use client';

import { Navbar, Footer } from '@/components/layout';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-[70px] overflow-x-clip min-h-screen bg-light dark:bg-slate-950 transition-colors">
        {children}
      </main>
      <Footer />
    </>
  );
}
