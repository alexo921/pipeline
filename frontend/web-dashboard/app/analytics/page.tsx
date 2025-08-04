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
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
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

interface ActiveUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  lastLoginAt: string;
  eventCount: number;
  recentEvents: Array<{
    eventType: string;
    timestamp: string;
    eventData: Record<string, any>;
  }>;
  lastActivity: string | null;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  emailSubscribed: boolean;
  emailVerified: boolean;
  googleId?: string;
  googlePicture?: string;
  eventCount: number;
  lastActivity: string | null;
  lastEventType: string | null;
}

export default function AnalyticsPage() {
  const { user, showLoginModal } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
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
  const [activeUsersLoading, setActiveUsersLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  // Check authentication
  useEffect(() => {
    console.log('Analytics auth check - user:', user);
    
    if (!user) {
      console.log('No user found, showing login modal');
      showLoginModal();
      return;
    }
    
    // Check if user is admin
    if (user.role !== 'ADMIN') {
      console.log('User is not admin, showing access denied');
      // Don't redirect, just show access denied with login button
      return;
    }
    
    console.log('User is admin, proceeding to analytics');
  }, [user, router, showLoginModal]);

  // Fetch analytics events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching analytics events...');
      
      // Use the Next.js API route which handles authentication
      const response = await fetch(`/api/analytics/events/batch?limit=1000`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      
      console.log('📊 Analytics API response:', data);
      
      if (data.isSuccess || data.success) {
        console.log('✅ Setting events:', data.data.data.events.length, 'events');
        // Filter out analytics page events to avoid self-tracking
        const filteredEvents = data.data.data.events.filter((event: AnalyticsEvent) => {
          const eventData = event.eventData;
          // Exclude events from analytics page
          if (eventData.pagePath && eventData.pagePath.includes('/analytics')) {
            return false;
          }
          // Exclude events from analytics dashboard
          if (eventData.pageTitle && eventData.pageTitle.toLowerCase().includes('analytics')) {
            return false;
          }
          return true;
        });
        setEvents(filteredEvents);
        calculateSummary(filteredEvents);
      } else {
        console.log('❌ API returned error:', data);
      }
    } catch (error) {
      console.error('❌ Error fetching analytics events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch active users
  const fetchActiveUsers = async () => {
    try {
      setActiveUsersLoading(true);
      console.log('👥 Fetching active users...');
      
      const response = await fetch(`/api/analytics/active-users?days=7&limit=50`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      
      console.log('👥 Active users API response:', data);
      
      if (data.success) {
        console.log('✅ Setting active users:', data.data.activeUsers.length, 'users');
        setActiveUsers(data.data.activeUsers);
      } else {
        console.log('❌ Active users API returned error:', data);
      }
    } catch (error) {
      console.error('❌ Error fetching active users:', error);
    } finally {
      setActiveUsersLoading(false);
    }
  };

  // Fetch all users
  const fetchAllUsers = async () => {
    try {
      setUsersLoading(true);
      console.log('👥 Fetching all users...');
      
      const queryParams = new URLSearchParams({
        limit: '100',
        offset: '0'
      });
      
      if (userSearchTerm) {
        queryParams.append('search', userSearchTerm);
      }
      if (userRoleFilter !== 'all') {
        queryParams.append('role', userRoleFilter);
      }
      
      const response = await fetch(`/api/analytics/users?${queryParams.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      
      console.log('👥 All users API response:', data);
      
      if (data.success) {
        console.log('✅ Setting all users:', data.data.users.length, 'users');
        setAllUsers(data.data.users);
      } else {
        console.log('❌ All users API returned error:', data);
      }
    } catch (error) {
      console.error('❌ Error fetching all users:', error);
    } finally {
      setUsersLoading(false);
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
      fetchActiveUsers();
      fetchAllUsers();
      const interval = setInterval(() => {
        fetchEvents();
        fetchActiveUsers();
        fetchAllUsers();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Fetch users when search or role filter changes
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchAllUsers();
    }
  }, [userSearchTerm, userRoleFilter]);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#F4F4F4] font-baloo flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to view analytics.</p>
          <button 
            onClick={showLoginModal}
            className="px-4 py-2 bg-[#2466D0] text-white rounded-lg hover:bg-[#1e5bb8] transition-colors"
          >
            Login as Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] font-baloo">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[#2466D0]">Analytics Dashboard</h1>
          <div className="flex gap-2">
            <button 
              onClick={fetchAllUsers} 
              disabled={usersLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {usersLoading ? 'Loading...' : 'Refresh All Users'}
            </button>
            <button 
              onClick={fetchActiveUsers} 
              disabled={activeUsersLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {activeUsersLoading ? 'Loading...' : 'Refresh Active Users'}
            </button>
            <button 
              onClick={fetchEvents} 
              disabled={loading}
              className="px-4 py-2 bg-[#2466D0] text-white rounded-lg hover:bg-[#1e5bb8] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : 'Refresh Events'}
            </button>
          </div>
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

        {/* Active Users Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-[#2466D0]">Active Users (Last 7 Days)</h3>
          <div className="max-h-[400px] overflow-y-auto space-y-4">
            {activeUsersLoading ? (
              <div className="text-center py-8 text-gray-500">Loading active users...</div>
            ) : activeUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No active users found</div>
            ) : (
              activeUsers.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4 space-y-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#2466D0] rounded-full flex items-center justify-center text-white font-semibold">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-[#2466D0]">{user.eventCount} events</div>
                      <div className="text-xs text-gray-500">
                        Last: {user.lastActivity ? formatTimestamp(user.lastActivity) : 'Never'}
                      </div>
                    </div>
                  </div>
                  
                  {user.recentEvents.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Activity:</h5>
                      <div className="space-y-1">
                        {user.recentEvents.slice(0, 3).map((event, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
                              {event.eventType.replace('_', ' ')}
                            </span>
                            <span className="text-gray-600">
                              {formatTimestamp(event.timestamp)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* All Users Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-[#2466D0]">All Users</h3>
          
          {/* User Filters */}
          <div className="mb-4 flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2466D0] focus:border-[#2466D0]"
              />
            </div>
            <select 
              value={userRoleFilter} 
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2466D0] focus:border-[#2466D0]"
            >
              <option value="all">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="CANDIDATE">Candidate</option>
              <option value="EMPLOYER">Employer</option>
            </select>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-4">
            {usersLoading ? (
              <div className="text-center py-8 text-gray-500">Loading users...</div>
            ) : allUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No users found</div>
            ) : (
              allUsers.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4 space-y-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                            user.role === 'CANDIDATE' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                          {user.emailVerified && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Verified
                            </span>
                          )}
                          {user.googleId && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Google
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-purple-600">{user.eventCount} events</div>
                      <div className="text-xs text-gray-500">
                        Joined: {formatTimestamp(user.createdAt)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Last: {user.lastActivity ? formatTimestamp(user.lastActivity) : 'Never'}
                      </div>
                    </div>
                  </div>
                  
                  {user.lastEventType && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-600">
                        Last activity: <span className="font-medium">{user.lastEventType.replace('_', ' ')}</span>
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
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
                      {event.user && (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 border border-gray-300 rounded text-xs bg-blue-50 text-blue-700">
                            {event.user.firstName} {event.user.lastName}
                          </span>
                          <span className="px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50 text-gray-600">
                            {event.user.email}
                          </span>
                        </div>
                      )}
                      {event.userId && !event.user && (
                        <span className="px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50">
                          User ID: {event.userId}
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