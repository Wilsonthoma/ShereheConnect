'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { RequireRole } from '@/components/auth';
import { OrganizerShell } from '@/components/organizer';
import { organizerApi } from '@/lib/organizerApi';
import { FullPageLoader } from '@/components/ui';

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // If we are already on the onboarding page, don't check again
    if (pathname === '/organizer/onboarding') {
      setIsChecking(false);
      return;
    }

    organizerApi
      .getProfile()
      .then((profile) => {
        // If profile doesn't exist or KYC is NOT submitted, force them to onboarding
        if (!profile || !profile.kycStatus || profile.kycStatus === 'NOT_SUBMITTED') {
          router.replace('/organizer/onboarding');
        } else {
          setIsChecking(false);
        }
      })
      .catch(() => {
        // If they are brand new (404 profile not found), send to onboarding
        router.replace('/organizer/onboarding');
      });
  }, [pathname, router]);

  if (isChecking && pathname !== '/organizer/onboarding') {
    return <FullPageLoader message="Checking organizer profile..." />;
  }

  return (
    <RequireRole roles={['ORGANIZER', 'ADMIN']}>
      <OrganizerShell>{children}</OrganizerShell>
    </RequireRole>
  );
}