import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: { default: 'NayaKapda.com — Bulk T-Shirts & Apparel Wholesale', template: '%s | NayaKapda.com' },
  description: 'India\'s trusted B2B bulk T-shirt and apparel platform. Premium 180 GSM to 320 GSM fabrics, volume pricing, and pan-India delivery.',
  keywords: ['bulk t-shirts', 'wholesale apparel', 'blank t-shirts india', 'bulk hoodies', 'printing blank', 'NayaKapda.com'],
  openGraph: {
    siteName: 'NayaKapda.com',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
