'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isLoggedIn, getUser } from '@/lib/auth';
import { FullPageLoader } from '@/components/ui/Loader';

interface RequireRoleProps {
  children: React.ReactNode;
  roles: Array<'ATTENDEE' | 'ORGANIZER' | 'ADMIN'>;
  redirectTo?: string;
}

export function RequireRole({ children, roles, redirectTo = '/login' }: RequireRoleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace(`${redirectTo}?next=${encodeURIComponent(pathname)}`);
      return;
    }
    const user = getUser();
    if (!user || !roles.includes(user.role)) {
      router.replace('/dashboard');
      return;
    }
    setReady(true);
  }, [router, pathname, redirectTo, roles]);

  if (!ready) {
    return <FullPageLoader message="Checking access..." subMessage="Please wait" />;
  }

  return <>{children}</>;
}
