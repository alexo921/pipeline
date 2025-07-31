"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { 
  BarChart3, 
  Users, 
  Eye, 
  MousePointer, 
  TrendingUp, 
  Calendar,
  ArrowLeft,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

interface AnalyticsData {
  summary: {
    totalJobViews: number;
    totalApplyClicks: number;
    totalUsers: number;
    conversionRate: string;
  };
  trends: {
    jobViewsByDay: Array<{ date: string; count: number }>;
    applyClicksByDay: Array<{ date: string; count: number }>;
  };
  topJobs: {
    viewed: Array<{ jobId: string; _count: { jobId: number }; job?: any }>;
    applied: Array<{ jobId: string; _count: { jobId: number }; job?: any }>;
  };
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(30);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push("/jobs");
    }
  }, [user, router]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/summary?days=${timeRange}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the analytics dashboard.
          </p>
          <Link 
            href="/jobs"
            className="inline-flex items-center space-x-2 bg-[#01253F] text-white px-6 py-3 rounded-lg hover:bg-[#011a2e] transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Jobs</span>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F4]">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2466D0] mx-auto mb-4"></div>
              <p className="text-[#7691A4] text-lg">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F4F4]">
        <div className="container mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="inline-flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] font-avenir">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#01253F] mb-2">Analytics Dashboard</h1>
            <p className="text-[#7691A4]">Track job performance and user engagement</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              onClick={fetchAnalytics}
              className="inline-flex items-center space-x-2 bg-[#2466D0] text-white px-4 py-2 rounded-lg hover:bg-[#1e52a8] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {analyticsData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#7691A4] text-sm font-medium">Total Job Views</p>
                    <p className="text-3xl font-bold text-[#01253F]">{analyticsData.summary.totalJobViews.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#7691A4] text-sm font-medium">Apply Clicks</p>
                    <p className="text-3xl font-bold text-[#01253F]">{analyticsData.summary.totalApplyClicks.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <MousePointer className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#7691A4] text-sm font-medium">New Users</p>
                    <p className="text-3xl font-bold text-[#01253F]">{analyticsData.summary.totalUsers.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#7691A4] text-sm font-medium">Conversion Rate</p>
                    <p className="text-3xl font-bold text-[#01253F]">{analyticsData.summary.conversionRate}%</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Top Jobs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Top Viewed Jobs */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-[#01253F] mb-4 flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-blue-600" />
                  Top Viewed Jobs
                </h3>
                <div className="space-y-4">
                  {analyticsData.topJobs.viewed.slice(0, 5).map((item, index) => (
                    <div key={item.jobId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-[#01253F]">
                          {item.job?.title || `Job ${item.jobId.slice(0, 8)}`}
                        </p>
                        <p className="text-sm text-[#7691A4]">
                          {item.job?.company || 'Unknown Company'} • {item.job?.location || 'Unknown Location'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#01253F]">{item._count.jobId}</p>
                        <p className="text-xs text-[#7691A4]">views</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Applied Jobs */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-[#01253F] mb-4 flex items-center">
                  <MousePointer className="w-5 h-5 mr-2 text-green-600" />
                  Top Applied Jobs
                </h3>
                <div className="space-y-4">
                  {analyticsData.topJobs.applied.slice(0, 5).map((item, index) => (
                    <div key={item.jobId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-[#01253F]">
                          {item.job?.title || `Job ${item.jobId.slice(0, 8)}`}
                        </p>
                        <p className="text-sm text-[#7691A4]">
                          {item.job?.company || 'Unknown Company'} • {item.job?.location || 'Unknown Location'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#01253F]">{item._count.jobId}</p>
                        <p className="text-xs text-[#7691A4]">clicks</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trends Chart Placeholder */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-[#01253F] mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-[#2466D0]" />
                Trends (Last {timeRange} Days)
              </h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Chart visualization coming soon</p>
                  <p className="text-sm text-gray-400">Data available: {analyticsData.trends.jobViewsByDay.length} days</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 