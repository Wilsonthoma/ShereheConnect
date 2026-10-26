import { ProtectedRoute } from '@/components/auth';
import { NotificationsContent } from '@/components/notifications/NotificationsContent';

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <section className="min-h-screen bg-light dark:bg-slate-950 py-16 px-4 transition-colors">
        <div className="max-w-7xl mx-auto">
          <NotificationsContent />
        </div>
      </section>
    </ProtectedRoute>
  );
}