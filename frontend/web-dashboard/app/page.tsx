export default function Home() {
  // This page should never be reached due to middleware redirect
  // But just in case, show a simple message
  return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2466D0] mx-auto mb-4"></div>
        <p className="text-[#7691A4] text-lg">Redirecting to jobs...</p>
      </div>
    </div>
  );
}
