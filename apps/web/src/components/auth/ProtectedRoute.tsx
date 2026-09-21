'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';
import { FullPageLoader } from '@/components/ui/Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace(`${redirectTo}?next=${encodeURIComponent(pathname)}`);
    } else {
      setReady(true);
    }
  }, [router, pathname, redirectTo]);

  if (!ready) {
    return <FullPageLoader message="Loading..." />;
  }

  return <>{children}</>;
}
