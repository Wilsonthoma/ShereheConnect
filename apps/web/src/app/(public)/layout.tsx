'use client';

import { Navbar, Footer } from '@/components/layout';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, isLoggedIn } from '@/lib/auth';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) return;
    const user = getUser();
    if (user?.role === 'ADMIN') router.replace('/admin/dashboard');
    if (user?.role === 'ORGANIZER') router.replace('/organizer/dashboard');
  }, [router]);

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
