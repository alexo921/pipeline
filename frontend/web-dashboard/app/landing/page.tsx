import BaseLayout from "../components/layout/BaseLayout";
import FAQItem from "./FAQItem";

export default function LandingPage() {
  return (
    <BaseLayout backgroundStyle={{ backgroundColor: '#FFFFFF' }} navBackgroundClassName="bg-white">
      {/* Hero Section */}
      <section className="section -mb-24 md:-mb-28 relative rounded-3xl">
        <div className="container flex flex-col lg:flex-row items-center justify-between gap-0.52">
          <div className="max-w-xl lg:max-w-lg">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#01253F] leading-tight">The Retention Platform For Skilled Nursing</h1>
            <p className="mt-6 text-lg text-[#4A4A4A] leading-relaxed">Cut no-shows, keep staff longer, and reduce costly churn. Build a workforce that lasts with Pipeline.</p>
            <p className="mt-4 text-base text-[#4A4A4A] leading-relaxed">Preventing just 5 exits a year saves $50,000 annually.</p>
            <button className="mt-8 px-8 py-4 bg-[#2CB3BF] text-white font-bold rounded-full shadow-md hover:bg-[#2499A4] transition duration-200 ease-in-out">
              Join the Pilot Program
            </button>
          </div>
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
            <div className="relative">
              <img src="/Frame 1898.svg" alt="Healthcare professional illustration" className="w-full max-w-md lg:max-w-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="section rounded-3xl">
        <div className="container flex flex-col lg:flex-row gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 flex-1 min-h-[350px]">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full flex items-center justify-center mb-6">
                {/* Icon placeholder - user will add later */}
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              </div>
              <h2 className="text-4xl font-bold text-[#2466D0] mb-4">Fewer No-Shows</h2>
              <p className="text-[#4A4A4A] text-sm leading-relaxed">Predict how many candidates you'll need for orientation and surface those most likely to show up and stay.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 flex-1 min-h-[350px]">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full flex items-center justify-center mb-6">
                {/* Icon placeholder - user will add later */}
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              </div>
              <h2 className="text-4xl font-bold text-[#2466D0] mb-4">Lower Turnover</h2>
              <p className="text-[#4A4A4A] text-sm leading-relaxed">Spot risks early with retention signals like attendance, morale, and culture fit. Intervene before staff walk out.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 flex-1 min-h-[350px]">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full flex items-center justify-center mb-6">
                {/* Icon placeholder - user will add later */}
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              </div>
              <h2 className="text-4xl font-bold text-[#2466D0] mb-4">Less Agency Spend</h2>
              <p className="text-[#4A4A4A] text-sm leading-relaxed">Retain more in-house staff, cut open shifts, and reduce reliance on expensive staffing agencies.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section rounded-3xl">
        <div className="container">
          <h2 className="text-4xl font-bold text-[#2466D0] font-baloo mb-8">From Retention to Full <br></br> Workforce Intelligence</h2>
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="space-y-4 md:flex-1">
              <div className="bg-[#F4F4F4] rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-[#2466D0]">Pip Widget</h3>
                <p>Sits inside your ATS.</p>
              </div>
              <div className="bg-white rounded-lg shadow-[0px_2px_8px_rgba(36,102,208,0.15),0px_8px_24px_rgba(36,102,208,0.4)] p-6">
                <h3 className="font-semibold text-[#2466D0]">YourPipeline</h3>
                <p>Runs alongside your ATS with predictive analytics.</p>
              </div>
              <div className="bg-[#F4F4F4] rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-[#2466D0]">Pipeline OS</h3>
                <p>Full ATS replacement — the workforce operating system for long-term care.</p>
              </div>
            </div>
            <div className="relative md:flex-1 flex justify-center mt-2 md:mt-4">
              <div className="relative">
                {/* Tablet Mockup */}
                <img src="/tablet.svg" alt="Tablet mockup" className="w-full max-w-sm" />
                
                {/* Overlay Metrics - half on, half off the tablet */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Early Churn Risk metric near top-left corner */}
                  <img src="/metric_2.svg" alt="Metric 2" className="absolute w-40 md:w-44 lg:w-48 top-8 -left-6" />
                  {/* Secondary metric at bottom-right corner */}
                  <img src="/metric_1.svg" alt="Metric 1" className="absolute w-40 md:w-44 lg:w-48 bottom-24 md:bottom-28 lg:bottom-32 -right-4 md:-right-6 lg:-right-8" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Savings Calculator Section */}
      <section className="section py-16 rounded-3xl" style={{ backgroundImage: "url('/da_pipes.svg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="container">
          <div className="bg-white rounded-3xl shadow-[0px_2px_8px_rgba(36,102,208,0.15),0px_8px_24px_rgba(36,102,208,0.25)] px-6 md:px-12 py-10">
            <h2 className="text-4xl font-bold text-[#2466D0] font-baloo text-center mb-4">What Turnover Really Costs Your Facility</h2>
            <p className="text-center text-[#01253F] max-w-4xl mx-auto mb-10">A 106-bed nursing facility with ~100 nursing staff loses over $500,000 a <br></br> year to turnover. Even preventing a handful of exits pays off.</p>
            <div className="grid grid-cols-3 gap-1 md:gap-2 items-start justify-items-center max-w-[680px] mx-auto">
              <div>
                <label className="block text-center text-[#01253F] font-semibold mb-2">Nursing Staff Count</label>
                <input type="number" placeholder="Number of employees" className="mx-auto block rounded-full bg-white border border-[#E5E7EB] px-5 py-3 placeholder:text-gray-400 shadow-inner" />
              </div>
              <div>
                <label className="block text-center text-[#01253F] font-semibold mb-2">Turnover Rate (%)</label>
                <input type="number" placeholder="Turnover Rate (%)" className="mx-auto block rounded-full bg-white border border-[#E5E7EB] px-5 py-3 placeholder:text-gray-400 shadow-inner" />
              </div>
              <div>
                <label className="block text-center text-[#01253F] font-semibold mb-2">Cost per Turnover</label>
                <input type="number" placeholder="Cost per Turnover" className="mx-auto block rounded-full bg-white border border-[#E5E7EB] px-5 py-3 placeholder:text-gray-400 shadow-inner" />
              </div>
            </div>
            <div className="flex justify-center mt-10">
              <button className="px-8 py-4 bg-[#2CB3BF] text-white font-bold rounded-full shadow-md hover:bg-[#2499A4] transition duration-200 ease-in-out">Estimate Savings</button>
            </div>
          </div>
        </div>
      </section>

      {/* Pilot Access CTA Section */}
      <section className="section rounded-3xl">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Placeholder image (left) */}
          <div className="w-full md:w-1/2 flex justify-center">
            <img src="/phone.svg" alt="Phone mockup" className="w-full max-w-lg h-72 md:h-96 object-contain translate-y-10 md:translate-y-16" />
          </div>
          {/* Text content (right) */}
          <div className="w-full md:w-1/2 md:pl-8">
            <h2 className="text-4xl font-bold text-[#2466D0] font-baloo mb-6">Shape the Future of<br/>Retention Intelligence</h2>
            <p className="text-[#01253F] leading-relaxed mb-8">We’re partnering with a select group of skilled nursing facilities in Connecticut and Massachusetts. Early partners get preferred pricing, white-glove onboarding, and a seat at the table in shaping how this platform evolves.</p>
            <button className="px-8 py-4 bg-[#2CB3BF] text-white font-bold rounded-full shadow-md hover:bg-[#2499A4] transition duration-200 ease-in-out">Apply for Pilot Access</button>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="section py-16 rounded-3xl" style={{ backgroundImage: "url('/da_pipes2.svg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white font-baloo mb-8">Frequently Ask Questions</h2>
          <div className="md:flex md:gap-4">
            {/* Left column */}
            <div className="md:w-1/2 space-y-4">
              <FAQItem
                question="How much does turnover cost a skilled nursing facility?"
                answer="On average, a 106-bed facility with ~100 nursing staff loses over $500,000 a year to churn."
                defaultOpen
              />
              <FAQItem question="What results can I expect?" />
            </div>
            {/* Right column */}
            <div className="md:w-1/2 space-y-4 mt-4 md:mt-0">
              <FAQItem question="How does Pipeline reduce turnover?" />
              <FAQItem question="What is Retention Intelligence?" />
              <FAQItem question="How long until we deliver your first blog post?" />
            </div>
          </div>
        </div>
      </section>

    </BaseLayout>
  );
}