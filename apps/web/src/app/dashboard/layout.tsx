'use client';

import { Navbar, Footer } from '@/components/layout';
import { VerificationBanner } from '@/components/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <VerificationBanner />
      {children}
      <Footer />
    </>
  );
}
