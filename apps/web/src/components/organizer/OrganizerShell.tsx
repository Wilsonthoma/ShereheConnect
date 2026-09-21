'use client';

import { useState } from 'react';
import { OrganizerSidebar } from './OrganizerSidebar';
import { OrganizerTopbar } from './OrganizerTopbar';

export function OrganizerShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <OrganizerSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="lg:pl-72">
        <OrganizerTopbar onOpenSidebar={() => setMobileOpen(true)} />
        <main className="p-4 md:p-6 lg:p-8">
          <div className="container-fluid">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
