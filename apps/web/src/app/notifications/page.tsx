import { ProtectedRoute } from '@/components/auth';
import { Navbar, Footer } from '@/components/layout';

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <main className="min-h-screen bg-light py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="heading-display heading-md text-brand-gradient mb-6">Notifications</h1>
          <p className="text-gray">Your notifications will appear here.</p>
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  );
}
