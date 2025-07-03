import { defaultAuthContext } from '../contexts/AuthContext';

export default function JobsPage() {
  return (
    <div className="min-h-screen relative bg-[#F4F4F4]">
      {/* Radial blue blur positioned in upper right */}
      <div 
        className="absolute pointer-events-none"
        style={{
          top: '-5%',
          right: '-10%',
          width: '1522px',
          height: '2585px',
          backgroundImage: 'url(/blur.svg)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          zIndex: 0
        }}
      ></div>
      
      {/* Page Header - Mobile optimized */}
      <div className="w-full py-4 sm:py-6 md:py-8 lg:py-12 relative" style={{ zIndex: 1 }}>
        <div className="max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[76px] font-black leading-[115%] text-[#01253F] font-baloo text-center lg:text-left">
            Job Board
          </h1>
        </div>
      </div>

      {/* Main Content Container - Mobile full width */}
      <div className="w-full max-w-[1400px] mx-auto px-2 md:px-4 lg:px-6 xl:px-8 pb-6 sm:pb-8 md:pb-12" style={{ position: 'relative', minHeight: '100vh' }}>
        <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_0px_20px_rgba(0,0,0,0.08)] p-2 md:p-4 relative">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2466D0] mx-auto mb-4"></div>
            <p className="text-[#7691A4] text-lg">Loading jobs...</p>
          </div>
        </div>
      </div>
    </div>
  );
} 