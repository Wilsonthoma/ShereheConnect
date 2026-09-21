'use client';

import { RequireRole } from '@/components/auth';
import { OrganizerShell } from '@/components/organizer';

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={['ORGANIZER', 'ADMIN']}>
      <OrganizerShell>{children}</OrganizerShell>
    </RequireRole>
  );
}
