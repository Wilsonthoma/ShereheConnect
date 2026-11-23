import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Kaushan_Script } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { MixedHeadings } from '@/components/providers/MixedHeadings';

// Display headings use Kaushan Script with Coddy Round as a fallback.
const kaushan = Kaushan_Script({
  subsets: ['latin'],
  variable: '--font-kaushan',
  weight: '400',
  display: 'swap',
});

// Coddy Round provides the bold heading weights.
const coddyRound = localFont({
  src: [
    {
      path: '../fonts/coddy/CoddyRound-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/coddy/CoddyRound-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/coddy/CoddyRound-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../fonts/coddy/CoddyRound-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/coddy/CoddyRound-ExtraBold.ttf',
      weight: '800',
      style: 'normal',
    },
  ],
  variable: '--font-coddy',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#2B2B2B' },
  ],
};

export const metadata: Metadata = {
  title: 'ShereheConnect',
  description: 'Find, book, and attend events near you.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${coddyRound.variable} ${kaushan.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans font-normal antialiased min-h-screen bg-white dark:bg-[#2B2B2B] text-slate-800 dark:text-slate-100">
        <ThemeProvider>
          <LanguageProvider>
            {children}
            <MixedHeadings />
          </LanguageProvider>
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}