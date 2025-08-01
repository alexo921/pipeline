'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface AnalyticsEvent {
  eventType: string;
  eventData: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  source: 'pipeline_web';
  version: string;
}

interface AnalyticsSummary {
  totalEvents: number;
  uniqueUsers: number;
  jobViews: number;
  jobApplies: number;
  searches: number;
  filters: number;
  registrations: number;
  sessions: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalEvents: 0,
    uniqueUsers: 0,
    jobViews: 0,
    jobApplies: 0,
    searches: 0,
    filters: 0,
    registrations: 0,
    sessions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Check authentication
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    // Check if user is admin
    if (user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  // Fetch analytics events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/events?limit=1000');
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data.events);
        calculateSummary(data.data.events);
      }
    } catch (error) {
      console.error('Error fetching analytics events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const calculateSummary = (eventList: AnalyticsEvent[]) => {
    const uniqueUsers = new Set(eventList.map(e => e.userId).filter(Boolean)).size;
    const jobViews = eventList.filter(e => e.eventType === 'job_view').length;
    const jobApplies = eventList.filter(e => e.eventType === 'job_apply').length;
    const searches = eventList.filter(e => e.eventType === 'search').length;
    const filters = eventList.filter(e => e.eventType === 'filter').length;
    const registrations = eventList.filter(e => e.eventType === 'user_registration').length;
    const sessions = eventList.filter(e => e.eventType === 'session').length;

    setSummary({
      totalEvents: eventList.length,
      uniqueUsers,
      jobViews,
      jobApplies,
      searches,
      filters,
      registrations,
      sessions,
    });
  };

  // Filter events based on selected criteria
  const filteredEvents = events.filter(event => {
    if (filter !== 'all' && event.eventType !== filter) return false;
    if (searchTerm && !JSON.stringify(event).toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Get event type color
  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'job_view': return 'bg-blue-100 text-blue-800';
      case 'job_apply': return 'bg-green-100 text-green-800';
      case 'search': return 'bg-purple-100 text-purple-800';
      case 'filter': return 'bg-orange-100 text-orange-800';
      case 'user_registration': return 'bg-pink-100 text-pink-800';
      case 'session': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchEvents();
      const interval = setInterval(fetchEvents, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#F4F4F4] font-baloo flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] font-baloo">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[#2466D0]">Analytics Dashboard</h1>
          <button 
            onClick={fetchEvents} 
            disabled={loading}
            className="px-4 py-2 bg-[#2466D0] text-white rounded-lg hover:bg-[#1e5bb8] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Events</h3>
            <p className="text-3xl font-bold text-[#2466D0]">{summary.totalEvents.toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Unique Users</h3>
            <p className="text-3xl font-bold text-[#2466D0]">{summary.uniqueUsers.toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Job Views</h3>
            <p className="text-3xl font-bold text-[#2466D0]">{summary.jobViews.toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Job Applications</h3>
            <p className="text-3xl font-bold text-[#2466D0]">{summary.jobApplies.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">
              {summary.jobViews > 0 ? `${((summary.jobApplies / summary.jobViews) * 100).toFixed(1)}% conversion` : '0% conversion'}
            </p>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Searches</h3>
            <p className="text-2xl font-bold text-[#2466D0]">{summary.searches.toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Filters Used</h3>
            <p className="text-2xl font-bold text-[#2466D0]">{summary.filters.toLocaleString()}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Registrations</h3>
            <p className="text-2xl font-bold text-[#2466D0]">{summary.registrations.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-[#2466D0]">Filters</h3>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2466D0] focus:border-[#2466D0]"
              />
            </div>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2466D0] focus:border-[#2466D0]"
            >
              <option value="all">All Events</option>
              <option value="job_view">Job Views</option>
              <option value="job_apply">Job Applications</option>
              <option value="search">Searches</option>
              <option value="filter">Filters</option>
              <option value="user_registration">Registrations</option>
              <option value="session">Sessions</option>
            </select>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-[#2466D0]">Recent Events ({filteredEvents.length})</h3>
          <div className="max-h-[600px] overflow-y-auto space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {loading ? 'Loading events...' : 'No events found'}
              </div>
            ) : (
              filteredEvents.map((event, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-2 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
                        {event.eventType.replace('_', ' ')}
                      </span>
                      {event.userId && (
                        <span className="px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50">
                          User: {event.userId}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  
                  <div className="text-sm">
                    <strong className="text-[#2466D0]">Data:</strong>
                    <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto border">
                      {JSON.stringify(event.eventData, null, 2)}
                    </pre>
                  </div>

                  {event.ipAddress && (
                    <div className="text-xs text-gray-500">
                      IP: {event.ipAddress}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 