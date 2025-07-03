import { Metadata } from 'next';
import BaseLayout from '../components/layout/BaseLayout';

export const metadata: Metadata = {
  title: 'Healthcare Jobs | Find Your Next Career',
  description: 'Browse the latest healthcare jobs including CNA positions, home health aide roles, and more.',
  openGraph: {
    title: 'Healthcare Jobs | Find Your Next Career',
    description: 'Browse the latest healthcare jobs including CNA positions, home health aide roles, and more.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Healthcare Jobs | Find Your Next Career',
    description: 'Browse the latest healthcare jobs including CNA positions, home health aide roles, and more.',
  },
};

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BaseLayout 
      showNav={true} 
      showFooter={true}
      customBackground="#F4F4F4"
    >
      {children}
    </BaseLayout>
  );
} 