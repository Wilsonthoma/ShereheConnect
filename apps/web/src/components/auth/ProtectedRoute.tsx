'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace(`${redirectTo}?next=${encodeURIComponent(window.location.pathname)}`);
    } else {
      setReady(true);
    }
  }, [router, redirectTo]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
