import './globals.css';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { Suspense } from 'react';
import Loading from './components/Common/Loading';
import GlobalAuthModal from './components/GlobalAuthModal';
import { GoogleTagManager } from '@next/third-parties/google';
import { getCompanyConfig } from '@/lib/companies';

// Import Baloo and configure a fallback for Avenir
const baloo = Inter({
  subsets: ['latin'],
  variable: '--font-baloo'
});

export const metadata = {
  title: 'Pipeline | Reduce Skilled Nursing Turnover with Retention Intelligence',
  description: 'Pipeline: The Dedicated Long-Term Care Job Board | CNA, LPN, RN & Home Care Jobs',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const companyId = headersList.get('x-pipeline-company') ?? 'default';
  const company = getCompanyConfig(companyId);

  return (
    <html lang="en">
      <head>
        {/* Load fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        />
        <link rel="icon" type="image/png" href="/favicon-32x32.png?v=6" />
        <link rel="icon" type="image/png" href="/pipeline_logo_p.png?v=6" />
        <link rel="shortcut icon" href="/favicon-32x32.png?v=6" />
        <link rel="apple-touch-icon" href="/pipeline_logo_p.png?v=6" />
        <meta name="msapplication-TileImage" content="/pipeline_logo_p.png?v=6" />
      </head>
      <body className={baloo.className + ' font-avenir'} style={{ fontFamily: `var(--font-avenir), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` }}>
        <CompanyProvider company={company}>
          <AuthProvider>
            <Suspense fallback={<Loading />}>
              <main>{children}</main>
            </Suspense>
            <GlobalAuthModal />
          </AuthProvider>
        </CompanyProvider>

        {/* Google Tag Manager */}
        <GoogleTagManager gtmId="GTM-NB6Z3L2B" />
      </body>
    </html>
  );
}
