'use client';

import { RequireRole } from '@/components/auth';
import { AdminShell } from '@/components/admin';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={['ADMIN']}>
      <AdminShell>{children}</AdminShell>
    </RequireRole>
  );
}
