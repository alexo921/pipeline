import BaseLayout from "../components/layout/BaseLayout";

export default function LandingPage() {
  return (
    <BaseLayout backgroundStyle={{ backgroundColor: '#FFFFFF' }} navBackgroundClassName="bg-white">
      {/* Hero Section */}
      <section className="section">
        <div className="container flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="max-w-xl lg:max-w-lg">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#01253F] leading-tight">Connecting Healthcare Talent With Opportunity</h1>
            <p className="mt-6 text-lg text-[#4A4A4A] leading-relaxed">Find your next job or make your next hire - connecting healthcare professionals just got easier</p>
            <button className="mt-8 button button-primary px-8 py-4 text-lg font-semibold">Join Pipeline</button>
          </div>
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
            <div className="relative">
              <img src="/Frame 1898.svg" alt="Healthcare professional illustration" className="w-full max-w-md lg:max-w-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-Action Cards */}
      <section className="section">
        <div className="container flex flex-col md:flex-row justify-between gap-6">
          <div className="card text-center flex-1">
            <h2 className="text-xl font-semibold">Looking for a job in healthcare?</h2>
            <div className="mt-4">
              <img src="https://placehold.co/50x50" alt="Stethoscope icon" className="mx-auto" />
            </div>
            <p className="mt-2">Search for job openings and connect with top employers today!</p>
            <button className="mt-4 button button-primary px-4 py-2">Get Started</button>
          </div>
          <div className="card text-center flex-1">
            <h2 className="text-xl font-semibold">Looking to hire a healthcare professional?</h2>
            <div className="mt-4">
              <img src="https://placehold.co/50x50" alt="Building icon" className="mx-auto" />
            </div>
            <p className="mt-2">Post your job openings and find the right candidate now!</p>
            <button className="mt-4 button button-primary px-4 py-2">Get Started</button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section">
        <div className="container">
          <h2 className="text-2xl font-bold text-center">The best jobs in healthcare, right at your fingertips.</h2>
          <div className="flex flex-col md:flex-row justify-between mt-8 gap-8">
            <div className="space-y-4 md:flex-1">
              <div className="card">
                <h3 className="font-semibold">Access Job Boards</h3>
                <p>Search our job board for healthcare jobs that match your needs and qualifications.</p>
              </div>
              <div className="card">
                <h3 className="font-semibold">Build Your Profile</h3>
                <p>Create a profile to showcase your skills and experience to potential employers.</p>
              </div>
              <div className="card">
                <h3 className="font-semibold">Express Interest</h3>
                <p>Let employers know you're interested in their job openings.</p>
              </div>
            </div>
            <div className="relative md:flex-1">
              <div className="border-2 border-gray-300 rounded-lg p-4">
                <img src="https://placehold.co/300x600" alt="Phone mockup" className="w-full rounded-md" />
                <div className="absolute inset-0 flex flex-col justify-center items-center gap-2 pointer-events-none">
                  <div className="bg-white p-2 rounded-lg shadow-md">Registered Nurse</div>
                  <div className="bg-white p-2 rounded-lg shadow-md">St. Mary's Health Care</div>
                  <div className="bg-white p-2 rounded-lg shadow-md">Full-Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section">
        <div className="container">
          <h2 className="text-2xl font-bold text-center">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="card text-center">
              <img src="https://placehold.co/80x80" alt="Profile" className="rounded-full mx-auto" />
              <h3 className="mt-4 font-semibold">Michael Smith</h3>
              <p className="text-gray-500">Healthcare Recruiter</p>
              <p className="mt-2">Create a free account and connect with top employers today!</p>
            </div>
            <div className="card text-center">
              <img src="https://placehold.co/80x80" alt="Profile" className="rounded-full mx-auto" />
              <h3 className="mt-4 font-semibold">Jane Doe</h3>
              <p className="text-gray-500">Healthcare Recruiter</p>
              <p className="mt-2">Create a free account and connect with top employers today!</p>
            </div>
            <div className="card text-center">
              <img src="https://placehold.co/80x80" alt="Profile" className="rounded-full mx-auto" />
              <h3 className="mt-4 font-semibold">Michael Smith</h3>
              <p className="text-gray-500">Healthcare Recruiter</p>
              <p className="mt-2">Create a free account and connect with top employers today!</p>
            </div>
          </div>
        </div>
      </section>

      {/* App Promotion Section */}
      <section className="section">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-8">
          <img src="https://placehold.co/600x400" alt="Pipeline app interface" className="w-full md:w-1/2 rounded-lg" />
          <div className="max-w-md">
            <h2 className="text-2xl font-bold">Your perfect healthcare match awaits</h2>
            <div className="mt-6">
              <button className="mr-4 button button-primary px-4 py-2">Download on the App Store</button>
              <button className="button button-primary px-4 py-2">Get it on Google Play</button>
            </div>
          </div>
        </div>
      </section>
    </BaseLayout>
  );
}


