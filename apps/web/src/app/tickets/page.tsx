import { ProtectedRoute } from '@/components/auth';
import { TicketsContent } from '@/components/tickets/TicketsContent';

export default function TicketsPage() {
  return (
    <ProtectedRoute>
      <section className="min-h-screen bg-light dark:bg-slate-950 py-16 px-4 transition-colors">
        <div className="max-w-7xl mx-auto">
          <TicketsContent />
        </div>
      </section>
    </ProtectedRoute>
  );
}