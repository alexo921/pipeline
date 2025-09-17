export default function LandingPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center p-6 bg-blue-600 text-white">
        <div className="text-2xl font-bold">Pipeline</div>
        <nav className="space-x-4">
          <a href="#" className="hover:underline">Find Jobs</a>
          <a href="#" className="hover:underline">Post a Job</a>
          <a href="#" className="hover:underline">About Us</a>
          <a href="#" className="hover:underline">Login</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between p-12 gap-8">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold">Connecting Healthcare Talent With Opportunity</h1>
          <p className="mt-4 text-lg">Find your next job or make your next hire - connecting healthcare professionals just got easier</p>
          <button className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Join Pipeline</button>
        </div>
        <img src="https://placehold.co/600x400" alt="Healthcare professional holding a tablet" className="w-full md:w-1/2 rounded-lg" />
      </section>

      {/* Call-to-Action Cards */}
      <section className="flex flex-col md:flex-row justify-around gap-6 p-12">
        <div className="bg-gray-100 p-6 rounded-lg shadow-md text-center flex-1">
          <h2 className="text-xl font-semibold">Looking for a job in healthcare?</h2>
          <div className="mt-4">
            <img src="https://placehold.co/50x50" alt="Stethoscope icon" className="mx-auto" />
          </div>
          <p className="mt-2">Search for job openings and connect with top employers today!</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Get Started</button>
        </div>
        <div className="bg-gray-100 p-6 rounded-lg shadow-md text-center flex-1">
          <h2 className="text-xl font-semibold">Looking to hire a healthcare professional?</h2>
          <div className="mt-4">
            <img src="https://placehold.co/50x50" alt="Building icon" className="mx-auto" />
          </div>
          <p className="mt-2">Post your job openings and find the right candidate now!</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Get Started</button>
        </div>
      </section>

      {/* Features Section */}
      <section className="p-12">
        <h2 className="text-2xl font-bold text-center">The best jobs in healthcare, right at your fingertips.</h2>
        <div className="flex flex-col md:flex-row justify-between mt-8 gap-8">
          <div className="space-y-4 md:flex-1">
            <div className="bg-gray-100 p-4 rounded-lg shadow-md">
              <h3 className="font-semibold">Access Job Boards</h3>
              <p>Search our job board for healthcare jobs that match your needs and qualifications.</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg shadow-md">
              <h3 className="font-semibold">Build Your Profile</h3>
              <p>Create a profile to showcase your skills and experience to potential employers.</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg shadow-md">
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
      </section>

      {/* Testimonials Section */}
      <section className="p-12">
        <h2 className="text-2xl font-bold text-center">What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gray-100 p-6 rounded-lg shadow-md text-center">
            <img src="https://placehold.co/80x80" alt="Profile" className="rounded-full mx-auto" />
            <h3 className="mt-4 font-semibold">Michael Smith</h3>
            <p className="text-gray-500">Healthcare Recruiter</p>
            <p className="mt-2">Create a free account and connect with top employers today!</p>
          </div>
          <div className="bg-gray-100 p-6 rounded-lg shadow-md text-center">
            <img src="https://placehold.co/80x80" alt="Profile" className="rounded-full mx-auto" />
            <h3 className="mt-4 font-semibold">Jane Doe</h3>
            <p className="text-gray-500">Healthcare Recruiter</p>
            <p className="mt-2">Create a free account and connect with top employers today!</p>
          </div>
          <div className="bg-gray-100 p-6 rounded-lg shadow-md text-center">
            <img src="https://placehold.co/80x80" alt="Profile" className="rounded-full mx-auto" />
            <h3 className="mt-4 font-semibold">Michael Smith</h3>
            <p className="text-gray-500">Healthcare Recruiter</p>
            <p className="mt-2">Create a free account and connect with top employers today!</p>
          </div>
        </div>
      </section>

      {/* App Promotion Section */}
      <section className="flex flex-col md:flex-row items-center justify-between p-12 gap-8">
        <img src="https://placehold.co/600x400" alt="Pipeline app interface" className="w-full md:w-1/2 rounded-lg" />
        <div className="max-w-md">
          <h2 className="text-2xl font-bold">Your perfect healthcare match awaits</h2>
          <div className="mt-6">
            <button className="mr-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Download on the App Store</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Get it on Google Play</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-blue-600 text-white p-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <div className="text-2xl font-bold">Pipeline</div>
            <p className="mt-2">Lorem ipsum dolor sit amet, consectetur adipiscing elit aliquam.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <a href="#" className="hover:underline">Facebook</a>
            <a href="#" className="hover:underline">Twitter</a>
            <a href="#" className="hover:underline">Instagram</a>
            <a href="#" className="hover:underline">LinkedIn</a>
            <a href="#" className="hover:underline">YouTube</a>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-8">
          <div>
            <h3 className="font-semibold">Product</h3>
            <ul className="space-y-1">
              <li><a href="#" className="hover:underline">Features</a></li>
              <li><a href="#" className="hover:underline">Pricing</a></li>
              <li><a href="#" className="hover:underline">Case studies</a></li>
              <li><a href="#" className="hover:underline">Reviews</a></li>
              <li><a href="#" className="hover:underline">Updates</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Company</h3>
            <ul className="space-y-1">
              <li><a href="#" className="hover:underline">About</a></li>
              <li><a href="#" className="hover:underline">Contact us</a></li>
              <li><a href="#" className="hover:underline">Careers</a></li>
              <li><a href="#" className="hover:underline">Culture</a></li>
              <li><a href="#" className="hover:underline">Blog</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Support</h3>
            <ul className="space-y-1">
              <li><a href="#" className="hover:underline">Getting started</a></li>
              <li><a href="#" className="hover:underline">Help center</a></li>
              <li><a href="#" className="hover:underline">Server status</a></li>
              <li><a href="#" className="hover:underline">Report a bug</a></li>
              <li><a href="#" className="hover:underline">Chat support</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Contact us</h3>
            <ul className="space-y-1">
              <li><a href="mailto:contact@company.com" className="hover:underline">contact@company.com</a></li>
              <li><a href="tel:+14146875892" className="hover:underline">(414) 687 - 5892</a></li>
              <li>794 McAllister St</li>
              <li>San Francisco, 94102</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p>Copyright © 2025 Pipeline</p>
          <div className="mt-2">
            <a href="#" className="hover:underline">Terms and Conditions</a> {"|"} 
            <a href="#" className="hover:underline"> Privacy Policy</a>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
          <h1 className="text-9xl font-bold">Pipeline</h1>
        </div>
      </footer>
    </div>
  );
}


