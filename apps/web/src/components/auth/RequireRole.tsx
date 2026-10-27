'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isLoggedIn, getUser, getToken } from '@/lib/auth';
import { api } from '@/lib/api';
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

  // 1. Initial Access Check
  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace(`${redirectTo}?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const user = getUser();
    if (!user) {
      router.replace(redirectTo);
      return;
    }

    if (user.status === 'SUSPENDED') {
      router.replace('/suspended');
      return;
    }

    if (!roles.includes(user.role)) {
      router.replace('/dashboard');
      return;
    }

    setReady(true);
  }, [router, pathname, redirectTo, roles]);

  // 2. Background Heartbeat Check (Poll every 10 seconds)
  useEffect(() => {
    if (!ready) return;

    const checkStatus = async () => {
      const token = getToken();
      if (!token) return;

      try {
        // We hit the /auth/me endpoint to get the latest status from the DB
        const res = await api.get<{ status: string }>('/auth/me', token);
        
        if (res.status === 'SUSPENDED') {
          // Update local storage to reflect the suspended status
          const user = getUser();
          if (user) {
            localStorage.setItem('attendee_user', JSON.stringify({ ...user, status: 'SUSPENDED' }));
          }
          // Instantly redirect
          router.replace('/suspended');
        }
      } catch (err) {
        // If we get a 401 (token revoked), the api client handles logging them out automatically
      }
    };

    // Check immediately, then every 10 seconds
    checkStatus();
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, [ready, router]);

  if (!ready) {
    return <FullPageLoader message="Checking access..." subMessage="Please wait" />;
  }

  return <>{children}</>;
}
