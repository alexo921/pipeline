'use client';

import { useAuth } from '../contexts/AuthContext';

interface ApplyButtonProps {
  jobId: string | number;
  jobUrl?: string;
}

export default function ApplyButton({ jobId, jobUrl }: ApplyButtonProps) {
  const { user, showLoginModal } = useAuth();

  const handleApply = async () => {
    if (!user) {
      showLoginModal();
      return;
    }

    if (!jobUrl) {
      alert('Application URL not available for this job.');
      return;
    }

    try {
      // Track the application
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/applied-jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          userId: user.id, 
          jobId: jobId.toString(), 
          jobUrl 
        }),
        credentials: "include",
      });

      if (!response.ok) {
        console.error('Failed to track application:', response.status);
      }

      // Open the job application URL
      window.open(jobUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error applying for job:', error);
      // Still open the URL even if tracking fails
      window.open(jobUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button 
      onClick={handleApply}
      className="bg-[#2CB3BF] text-white font-black text-[20px] py-3 px-6 rounded-[12px] hover:bg-[#269aa5] transition-colors shadow-lg font-avenir"
    >
      Apply
    </button>
  );
} 