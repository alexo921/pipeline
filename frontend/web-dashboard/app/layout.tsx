import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from './contexts/AuthContext';
import { Suspense } from 'react';
import Loading from './components/Common/Loading';
import GlobalAuthModal from './components/GlobalAuthModal';

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
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NB6Z3L2B');`,
          }}
        />
        {/* End Google Tag Manager */}
        
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
        <link rel="icon" type="image/png" href="/pipeline_logo_p.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </head>
      <body className={baloo.className + ' font-avenir'} style={{ fontFamily: `var(--font-avenir), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` }}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-NB6Z3L2B"
            height="0" 
            width="0" 
            style={{display:'none',visibility:'hidden'}}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        
        <AuthProvider>
        <Suspense fallback={<Loading />}>
        <main>{children}</main>
        </Suspense>
        <GlobalAuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
