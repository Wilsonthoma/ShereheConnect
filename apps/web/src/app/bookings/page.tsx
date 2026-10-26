import { ProtectedRoute } from '@/components/auth';
import { Navbar, Footer } from '@/components/layout';
import { BookingsContent } from '@/components/bookings/BookingsContent';

export default function BookingsPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <main className="min-h-screen bg-light dark:bg-slate-950 py-16 px-4 transition-colors">
        <div className="max-w-7xl mx-auto">
          <BookingsContent />
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  );
}