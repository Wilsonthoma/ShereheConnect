import { ProtectedRoute } from '@/components/auth';
import { Navbar, Footer } from '@/components/layout';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <main className="min-h-screen bg-light py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="heading-display heading-md text-brand-gradient mb-6">Dashboard</h1>
          <p className="text-gray">Your dashboard will appear here.</p>
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  );
}
