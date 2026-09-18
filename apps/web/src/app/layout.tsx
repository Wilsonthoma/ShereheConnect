import type { Metadata } from 'next';
import { Manrope, Kaushan_Script } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const kaushan = Kaushan_Script({
  subsets: ['latin'],
  variable: '--font-display',
  weight: '400',
});

export const metadata: Metadata = {
  title: 'ShereheConnect — Discover Events Across Kenya',
  description:
    'Find, book, and attend events near you. From festivals to conferences, connect with the experiences that matter.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${kaushan.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
