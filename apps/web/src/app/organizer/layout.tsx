'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, usePathname } from 'next/navigation';
import { organizerApi } from '@/lib/organizerApi';
import { FullPageLoader } from '@/components/ui';

const RequireRole = dynamic(
  () => import('@/components/auth').then((mod) => mod.RequireRole),
  {
    ssr: false,
    loading: () => <FullPageLoader message="Verifying access..." />,
  },
);

const OrganizerShell = dynamic(
  () => import('@/components/organizer').then((mod) => mod.OrganizerShell),
  {
    ssr: false,
    loading: () => <FullPageLoader message="Loading organizer workspace..." />,
  },
);

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [verificationChecked, setVerificationChecked] = useState(false);

  useEffect(() => {
    organizerApi.getVerificationStatus()
      .then(({ kycStatus }) => {
        setVerificationChecked(true);
        if (
          kycStatus !== 'VERIFIED' &&
          pathname !== '/organizer/dashboard' &&
          pathname !== '/organizer/onboarding'
        ) {
          router.replace('/organizer/dashboard');
        }
      })
      .catch(() => {
        setVerificationChecked(true);
        if (
          pathname !== '/organizer/dashboard' &&
          pathname !== '/organizer/onboarding'
        ) {
          router.replace('/organizer/dashboard');
        }
      });
  }, [pathname, router]);

  if (!verificationChecked) {
    return <FullPageLoader message="Checking verification status..." />;
  }

  return (
    <RequireRole roles={['ORGANIZER', 'ADMIN']}>
      <OrganizerShell>{children}</OrganizerShell>
    </RequireRole>
  );
}