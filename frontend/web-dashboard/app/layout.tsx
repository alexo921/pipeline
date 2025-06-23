import './globals.css';
import { Inter } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';

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
      </head>
      <body className={baloo.className}>
        <main>{children}</main>
      </body>
    </html>
  );
}
