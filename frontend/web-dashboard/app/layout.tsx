import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from './contexts/AuthContext';
import { Suspense } from 'react';
import Loading from './components/Common/Loading';

// Import Baloo and configure a fallback for Avenir
const baloo = Inter({ 
  subsets: ['latin'],
  variable: '--font-baloo'
});

export const metadata = {
  title: 'Pipeline - Healthcare',
  description: 'Find your next healthcare job',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&display=swap" 
          rel="stylesheet" 
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        <link rel="icon" type="image/svg+xml" href="/pipeline_logo_p.png" />
      </head>
      <body className={baloo.className}>
        <AuthProvider>
        <Suspense fallback={<Loading />}>
        <main>{children}</main>
        </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
