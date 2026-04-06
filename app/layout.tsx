import type { Metadata, Viewport } from 'next';
import { Inter, Lora, Literata } from 'next/font/google';
import { STORAGE_KEYS } from '@/lib/storage';
import NavigationWrapper from '@/components/NavigationWrapper';
import './globals.css';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fontSerif = Lora({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  style: ['normal', 'italic'],
});

const fontTexto = Literata({
  subsets: ['latin'],
  variable: '--font-texto',
  display: 'swap',
  style: ['normal', 'italic'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F9F9F7' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
};

export const metadata: Metadata = {
  title: 'Apapacho Reader',
  description: 'Tu biblioteca digital premium',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Apapacho',
  },
};

const themeScript = `
  try {
    const prefsRaw = localStorage.getItem('${STORAGE_KEYS.PREFERENCES}');
    let isDark = false;

    if (prefsRaw) {
      const prefs = JSON.parse(prefsRaw);
      if (prefs.nightMode === true) {
        isDark = true;
      } else if (prefs.nightMode === null && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        isDark = true;
      }
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      isDark = true;
    }

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (_) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontTexto.variable} antialiased bg-brand-bg dark:bg-[#121212] text-brand-dark dark:text-gray-200 min-h-[100dvh] flex flex-col overflow-x-hidden transition-colors duration-500`}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {/* 🌟 NavigationWrapper ahora está garantizado como el único manejador de layout interno */}
        <NavigationWrapper>
          {children}
        </NavigationWrapper>
      </body>
    </html>
  );
}