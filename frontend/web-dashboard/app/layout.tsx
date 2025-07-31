import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from './contexts/AuthContext';
import { Suspense } from 'react';
import Loading from './components/Common/Loading';
import GlobalAuthModal from './components/GlobalAuthModal';
import { GoogleTagManager } from '@next/third-parties/google';

// Import Baloo and configure a fallback for Avenir
const baloo = Inter({ 
  subsets: ['latin'],
  variable: '--font-baloo'
});

export const metadata = {
  title: 'Pipeline: Long-Term Care Jobs',
  description: 'Pipeline: The Dedicated Long-Term Care Job Board | CNA, LPN, RN & Home Care Jobs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preload fonts for faster rendering and less FOUT/FOIT */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&display=swap"
          as="style"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
          as="style"
          crossOrigin="anonymous"
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&display=swap" 
          rel="stylesheet" 
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        <link rel="icon" type="image/png" href="/favicon-32x32.png?v=6" />
        <link rel="icon" type="image/png" href="/pipeline_logo_p.png?v=6" />
        <link rel="shortcut icon" href="/favicon-32x32.png?v=6" />
        <link rel="apple-touch-icon" href="/pipeline_logo_p.png?v=6" />
        <meta name="msapplication-TileImage" content="/pipeline_logo_p.png?v=6" />
      </head>
      <body className={baloo.className + ' font-avenir'} style={{ fontFamily: `var(--font-avenir), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` }}>
        <AuthProvider>
        <Suspense fallback={<Loading />}>
        <main>{children}</main>
        </Suspense>
        <GlobalAuthModal />
        </AuthProvider>
        
        {/* Google Tag Manager */}
        <GoogleTagManager gtmId="GTM-NB6Z3L2B" />
      </body>
    </html>
  );
}
