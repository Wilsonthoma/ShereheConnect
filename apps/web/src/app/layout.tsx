import type { Metadata, Viewport } from 'next';
import { Manrope, Kaushan_Script } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

const kaushan = Kaushan_Script({
  subsets: ['latin'],
  variable: '--font-display',
  weight: '400',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#111827',
};

export const metadata: Metadata = {
  title: 'ShereheConnect — Discover Events Across Kenya',
  description:
    'Find, book, and attend events near you. From festivals to conferences, connect with the experiences that matter.',
  keywords: ['events', 'tickets', 'Kenya', 'Nairobi', 'festivals', 'conferences', 'M-Pesa'],
  authors: [{ name: 'ShereheConnect' }],
  openGraph: {
    title: 'ShereheConnect — Discover Events Across Kenya',
    description: 'Find, book, and attend events near you.',
    type: 'website',
    locale: 'en_KE',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${kaushan.variable}`}>
      <body className="antialiased bg-light text-dark min-h-screen">
        {children}
      </body>
    </html>
  );
}
