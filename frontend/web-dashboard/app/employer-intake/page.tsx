'use client';

import { useState } from 'react';
import { Building2, User, Mail, Phone, MapPin, Users, Briefcase, FileText, Send } from 'lucide-react';

export default function EmployerIntakePage() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    companySize: '',
    industry: '',
    hiringNeeds: '',
    location: '',
    additionalInfo: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/intake-forms/employer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          companyName: '',
          contactName: '',
          email: '',
          phone: '',
          companySize: '',
          industry: '',
          hiringNeeds: '',
          location: '',
          additionalInfo: ''
        });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-[#F4F4F4]">
      {/* Radial blue blur positioned in upper right */}
      <div 
        className="absolute pointer-events-none hidden md:block"
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
      
      {/* Mobile-only blur effect - smaller and properly contained */}
      <div 
        className="absolute pointer-events-none md:hidden"
        style={{
          top: '0',
          right: '0',
          width: '150px',
          height: '200px',
          background: `
            radial-gradient(
              ellipse at center,
              rgba(36, 102, 208, 0.1) 0%,
              rgba(36, 102, 208, 0.05) 40%,
              transparent 70%
            )
          `,
          filter: 'blur(30px)',
          zIndex: 0,
          overflow: 'hidden'
        }}
      ></div>
      
      {/* Page Header - Mobile optimized */}
      <div className="w-full py-4 sm:py-6 md:py-8 lg:py-12 relative" style={{ zIndex: 1 }}>
        <div className="max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[76px] font-black leading-[115%] text-[#01253F] font-baloo text-center lg:text-left">
            Employer Intake Form
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-[18px] font-bold text-[#7691A4] font-avenir text-center lg:text-left mt-4">
            Tell us about your hiring needs and we'll help you find the perfect candidates
          </p>
        </div>
      </div>

      {/* Main Content Container - Mobile full width */}
      <div className="w-full max-w-[1400px] mx-auto px-2 md:px-4 lg:px-6 xl:px-8 pb-6 sm:pb-8 md:pb-12" style={{ position: 'relative', minHeight: '100vh' }}>
        <div 
          className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_0px_20px_rgba(0,0,0,0.08)] p-2 md:p-4 relative"
          style={{ zIndex: 1 }}
        >
          {/* Form Container - Centered */}
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Information Section */}
              <div className="bg-white rounded-xl lg:rounded-[20px] shadow-[4px_3px_12px_rgba(36,102,208,0.4)] p-6 lg:p-8">
                <h2 className="text-xl lg:text-2xl font-black text-[#2466D0] mb-6 font-avenir flex items-center">
                  <Building2 className="w-6 h-6 mr-3" />
                  Company Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#01253F] mb-2 font-avenir">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2466D0] focus:border-transparent font-avenir"
                      placeholder="Enter company name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-[#01253F] mb-2 font-avenir">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2466D0] focus:border-transparent font-avenir"
                      placeholder="Enter contact name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-bold text-[#01253F] mb-2 font-avenir">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2466D0] focus:border-transparent font-avenir"
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-[#01253F] mb-2 font-avenir">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2466D0] focus:border-transparent font-avenir"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-bold text-[#01253F] mb-2 font-avenir">
                      Company Size
                    </label>
                    <select
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2466D0] focus:border-transparent font-avenir"
                    >
                      <option value="">Select company size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-[#01253F] mb-2 font-avenir">
                      Industry
                    </label>
                    <select
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2466D0] focus:border-transparent font-avenir"
                    >
                      <option value="">Select industry</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Long-term Care">Long-term Care</option>
                      <option value="Home Care">Home Care</option>
                      <option value="Hospital">Hospital</option>
                      <option value="Rehabilitation">Rehabilitation</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Hiring Needs Section */}
              <div className="bg-white rounded-xl lg:rounded-[20px] shadow-[4px_3px_12px_rgba(36,102,208,0.4)] p-6 lg:p-8">
                <h2 className="text-xl lg:text-2xl font-black text-[#2466D0] mb-6 font-avenir flex items-center">
                  <Briefcase className="w-6 h-6 mr-3" />
                  Hiring Needs
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[#01253F] mb-2 font-avenir">
                      Hiring Needs *
                    </label>
                    <textarea
                      name="hiringNeeds"
                      value={formData.hiringNeeds}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2466D0] focus:border-transparent font-avenir"
                      placeholder="Describe your hiring needs, positions, and requirements..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-[#01253F] mb-2 font-avenir">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2466D0] focus:border-transparent font-avenir"
                      placeholder="City, State or Remote"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="bg-white rounded-xl lg:rounded-[20px] shadow-[4px_3px_12px_rgba(36,102,208,0.4)] p-6 lg:p-8">
                <h2 className="text-xl lg:text-2xl font-black text-[#2466D0] mb-6 font-avenir flex items-center">
                  <FileText className="w-6 h-6 mr-3" />
                  Additional Information
                </h2>
                
                <div>
                  <label className="block text-sm font-bold text-[#01253F] mb-2 font-avenir">
                    Additional Details
                  </label>
                  <textarea
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2466D0] focus:border-transparent font-avenir"
                    placeholder="Any additional information about your company, culture, or hiring process..."
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#2466D0] hover:bg-[#1a4da3] disabled:bg-gray-400 text-white font-bold py-4 px-8 rounded-full text-lg font-avenir flex items-center transition-colors duration-200 shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-3" />
                      Submit Intake Form
                    </>
                  )}
                </button>
              </div>

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-center font-avenir">
                  Thank you! Your intake form has been submitted successfully. We'll be in touch soon.
                </div>
              )}
              
              {submitStatus === 'error' && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center font-avenir">
                  There was an error submitting your form. Please try again or contact support.
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
