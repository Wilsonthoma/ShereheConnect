'use client';

import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="lg:pl-72">
        <AdminTopbar onOpenSidebar={() => setMobileOpen(true)} />
        <main className="p-4 md:p-6 lg:p-8">
          <div className="container-fluid">{children}</div>
        </main>
      </div>
    </div>
  );
}
