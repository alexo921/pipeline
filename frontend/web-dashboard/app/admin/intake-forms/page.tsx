'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Building2, User, Mail, Phone, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface IntakeForm {
  id: string;
  submittedAt: string;
  status: string;
  notes?: string;
}

interface EmployerIntakeForm extends IntakeForm {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  companySize?: string;
  industry?: string;
  hiringNeeds?: string;
  location?: string;
  additionalInfo?: string;
}

interface EmployeeIntakeForm extends IntakeForm {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  currentRole?: string;
  experience?: string;
  preferredLocation?: string;
  availability?: string;
  salaryExpectations?: string;
  additionalInfo?: string;
}

export default function AdminIntakeFormsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [employerForms, setEmployerForms] = useState<EmployerIntakeForm[]>([]);
  const [employeeForms, setEmployeeForms] = useState<EmployeeIntakeForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'employer' | 'employee'>('employer');

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    if (!user) {
      router.push('/');
      return;
    }

    fetchIntakeForms();
  }, [user, router]);

  const fetchIntakeForms = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://18.119.0.100:3005';
      
      // Fetch employer forms
      const employerResponse = await fetch(`${backendUrl}/intake-forms/employer`);
      if (employerResponse.ok) {
        const employerData = await employerResponse.json();
        setEmployerForms(employerData.data || []);
      }

      // Fetch employee forms
      const employeeResponse = await fetch(`${backendUrl}/intake-forms/employee`);
      if (employeeResponse.ok) {
        const employeeData = await employeeResponse.json();
        setEmployeeForms(employeeData.data || []);
      }
    } catch (error) {
      console.error('Error fetching intake forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormStatus = async (type: 'employer' | 'employee', id: string, status: string, notes?: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://18.119.0.100:3005';
      const response = await fetch(`${backendUrl}/intake-forms/${type}/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes }),
      });

      if (response.ok) {
        // Refresh the forms
        fetchIntakeForms();
      }
    } catch (error) {
      console.error('Error updating form status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'reviewed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'contacted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'archived':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2466D0] mx-auto mb-4"></div>
          <p className="text-[#7691A4] text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4]">
      {/* Page Header */}
      <div className="w-full py-8 lg:py-12">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 xl:px-8">
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black leading-[115%] text-[#01253F] font-baloo text-center lg:text-left">
            Intake Forms Dashboard
          </h1>
          <p className="text-lg lg:text-xl font-bold text-[#7691A4] font-avenir text-center lg:text-left mt-4">
            Manage employer and employee intake forms
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 xl:px-8 pb-12">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white rounded-lg p-1 mb-8 shadow-sm">
          <button
            onClick={() => setActiveTab('employer')}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition-colors ${
              activeTab === 'employer'
                ? 'bg-[#2466D0] text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 className="w-5 h-5 inline mr-2" />
            Employer Forms ({employerForms.length})
          </button>
          <button
            onClick={() => setActiveTab('employee')}
            className={`flex-1 py-3 px-6 rounded-md font-medium transition-colors ${
              activeTab === 'employee'
                ? 'bg-[#2466D0] text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="w-5 h-5 inline mr-2" />
            Employee Forms ({employeeForms.length})
          </button>
        </div>

        {/* Forms List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeTab === 'employer' ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#01253F] font-avenir">Employer Intake Forms</h2>
              {employerForms.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No employer intake forms submitted yet.</p>
              ) : (
                <div className="space-y-4">
                  {employerForms.map((form) => (
                    <div key={form.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-[#2466D0] font-avenir">{form.companyName}</h3>
                          <p className="text-gray-600 font-avenir">Contact: {form.contactName}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {form.email}
                            </span>
                            {form.phone && (
                              <span className="flex items-center">
                                <Phone className="w-4 h-4 mr-1" />
                                {form.phone}
                              </span>
                            )}
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(form.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(form.status)}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(form.status)}`}>
                            {form.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {form.companySize && (
                          <div>
                            <span className="font-semibold text-gray-700">Company Size:</span> {form.companySize}
                          </div>
                        )}
                        {form.industry && (
                          <div>
                            <span className="font-semibold text-gray-700">Industry:</span> {form.industry}
                          </div>
                        )}
                        {form.location && (
                          <div>
                            <span className="font-semibold text-gray-700">Location:</span> {form.location}
                          </div>
                        )}
                      </div>
                      
                      {form.hiringNeeds && (
                        <div className="mb-4">
                          <span className="font-semibold text-gray-700">Hiring Needs:</span>
                          <p className="text-gray-600 mt-1">{form.hiringNeeds}</p>
                        </div>
                      )}
                      
                      {form.additionalInfo && (
                        <div className="mb-4">
                          <span className="font-semibold text-gray-700">Additional Info:</span>
                          <p className="text-gray-600 mt-1">{form.additionalInfo}</p>
                        </div>
                      )}
                      
                      {/* Status Update Controls */}
                      <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                        <select
                          value={form.status}
                          onChange={(e) => updateFormStatus('employer', form.id, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="contacted">Contacted</option>
                          <option value="archived">Archived</option>
                        </select>
                        <button
                          onClick={() => updateFormStatus('employer', form.id, form.status)}
                          className="px-4 py-2 bg-[#2466D0] text-white rounded-md text-sm hover:bg-[#1a4da3] transition-colors"
                        >
                          Update Status
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#01253F] font-avenir">Employee Intake Forms</h2>
              {employeeForms.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No employee intake forms submitted yet.</p>
              ) : (
                <div className="space-y-4">
                  {employeeForms.map((form) => (
                    <div key={form.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-[#2466D0] font-avenir">{form.firstName} {form.lastName}</h3>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {form.email}
                            </span>
                            {form.phone && (
                              <span className="flex items-center">
                                <Phone className="w-4 h-4 mr-1" />
                                {form.phone}
                              </span>
                            )}
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(form.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(form.status)}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(form.status)}`}>
                            {form.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {form.currentRole && (
                          <div>
                            <span className="font-semibold text-gray-700">Current Role:</span> {form.currentRole}
                          </div>
                        )}
                        {form.experience && (
                          <div>
                            <span className="font-semibold text-gray-700">Experience:</span> {form.experience}
                          </div>
                        )}
                        {form.preferredLocation && (
                          <div>
                            <span className="font-semibold text-gray-700">Preferred Location:</span> {form.preferredLocation}
                          </div>
                        )}
                        {form.availability && (
                          <div>
                            <span className="font-semibold text-gray-700">Availability:</span> {form.availability}
                          </div>
                        )}
                      </div>
                      
                      {form.salaryExpectations && (
                        <div className="mb-4">
                          <span className="font-semibold text-gray-700">Salary Expectations:</span>
                          <p className="text-gray-600 mt-1">{form.salaryExpectations}</p>
                        </div>
                      )}
                      
                      {form.additionalInfo && (
                        <div className="mb-4">
                          <span className="font-semibold text-gray-700">Additional Info:</span>
                          <p className="text-gray-600 mt-1">{form.additionalInfo}</p>
                        </div>
                      )}
                      
                      {/* Status Update Controls */}
                      <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                        <select
                          value={form.status}
                          onChange={(e) => updateFormStatus('employee', form.id, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="contacted">Contacted</option>
                          <option value="archived">Archived</option>
                        </select>
                        <button
                          onClick={() => updateFormStatus('employee', form.id, form.status)}
                          className="px-4 py-2 bg-[#2466D0] text-white rounded-md text-sm hover:bg-[#1a4da3] transition-colors"
                        >
                          Update Status
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
