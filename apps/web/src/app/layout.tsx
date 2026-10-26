import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Manrope, Kaushan_Script } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';

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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

export const metadata: Metadata = {
  title: 'ShereheConnect — Discover Events Across Kenya',
  description: 'Find, book, and attend events near you.',
};

const themeInitScript = `
(function() {
  try {
    var theme = localStorage.getItem('sherehe-theme') || 'system';
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var shouldBeDark = theme === 'dark' || (theme === 'system' && prefersDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${kaushan.variable}`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="antialiased min-h-screen bg-light dark:bg-slate-950 text-dark dark:text-slate-100">
        <ThemeProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
