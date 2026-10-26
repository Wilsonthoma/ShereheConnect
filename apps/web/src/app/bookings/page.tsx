'use client';

import { Navbar, Footer } from '@/components/layout';

export default function BookingsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-light dark:bg-slate-950 py-12">
        <div className="container-fluid">
          <h1 className="heading-display heading-md text-brand-gradient mb-6">
            My Bookings
          </h1>
          <p className="text-gray">Bookings page — coming soon.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
