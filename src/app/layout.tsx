import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Antigravity Kelime Oyunu — Multiplayer Turkish Word Puzzle',
  description: 'Arkadaşlarınızla gerçek zamanlı, rekabetçi ve heyecan dolu Türkçe kelime bulma mücadelesine katılın!',
  keywords: ['kelime oyunu', 'multiplayer word game', 'türkçe kelime oyunu', 'realtime game', 'kelime bulmaca'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${outfit.variable} h-full antialiased dark`}>
      <head>
        {/* Preconnect to Google Fonts API for fast loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-purple-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
