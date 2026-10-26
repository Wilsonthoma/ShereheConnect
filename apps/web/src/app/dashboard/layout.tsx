import { VerificationBanner } from '@/components/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <VerificationBanner />
      {children}
    </>
  );
}