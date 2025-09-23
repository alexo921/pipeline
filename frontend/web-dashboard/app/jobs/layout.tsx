import { Metadata } from 'next';
import BaseLayout from '../components/layout/BaseLayout';

export const metadata: Metadata = {
  title: 'Pipeline | Reduce Skilled Nursing Turnover with Retention Intelligence',
  description: 'Pipeline: The Dedicated Long-Term Care Job Board | CNA, LPN, RN & Home Care Jobs',
  openGraph: {
    title: 'Pipeline | Reduce Skilled Nursing Turnover with Retention Intelligence',
    description: 'Pipeline: The Dedicated Long-Term Care Job Board | CNA, LPN, RN & Home Care Jobs',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pipeline | Reduce Skilled Nursing Turnover with Retention Intelligence',
    description: 'Pipeline: The Dedicated Long-Term Care Job Board | CNA, LPN, RN & Home Care Jobs',
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