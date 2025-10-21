import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Download, RefreshCw, ArrowRight } from 'lucide-react';
import { RetentionForecastCard, NoShowRiskCard, TurnoverCostCard } from './KPICard';
import { InsightFeed, Insight, Action } from './InsightFeed';
import { CohortAnalysis, CohortData, FunnelMetrics } from './CohortAnalysis';
import { HotspotMatrix, HotspotData } from './HotspotMatrix';
import ActionCenter, { ActionItem } from './ActionCenter';
import { PulseModal } from './PulseModal';
import { ReminderModal } from './ReminderModal';
import { useRouter } from 'next/navigation';

interface AnalyticsWorkspaceProps {
  facilityId: string;
}

export const AnalyticsWorkspace: React.FC<AnalyticsWorkspaceProps> = ({ facilityId }) => {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [hotspotType, setHotspotType] = useState<'unit' | 'role'>('unit');
  
  // Modal states
  const [pulseModalOpen, setPulseModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Mock data - replace with actual API calls
  const [kpiData, setKpiData] = useState({
    retentionForecast: {
      percentage30d: 72,
      percentage60d: 68,
      percentage90d: 65,
      trend: 'down' as const,
      riskLevel: 'medium' as const
    },
    noShowRisk: {
      flaggedCount: 4,
      totalCandidates: 25,
      riskPercentage: 16,
      trend: 'up' as const
    },
    turnoverCost: {
      estimatedSavings: 24000,
      hiresRetained: 6,
      timeSaved: 200,
      roi: 2.4
    }
  });

  const [insights, setInsights] = useState<Insight[]>([
    {
      id: '1',
      type: 'retention_drop',
      title: 'Retention Forecast Drop Detected',
      description: 'Rehab unit forecast dropped 12 points vs baseline',
      severity: 'warning',
      actions: [{
        id: 'escalate-1',
        type: 'escalate',
        title: 'Escalate to Supervisor',
        description: 'Notify supervisor of retention risk',
        actor: 'employer',
        channel: 'email',
        automationLevel: 'confirm'
      }],
      data: {},
      generatedAt: new Date()
    },
    {
      id: '2',
      type: 'sentiment_decline',
      title: 'Burnout risk rising in Memory Care - Nights (+18%)',
      description: 'Night shift staff showing increased stress indicators',
      severity: 'warning',
      actions: [{
        id: 'pulse-1',
        type: 'pulse',
        title: 'Send Targeted Pulse',
        description: 'Send pulse survey to Memory Care night staff',
        actor: 'employer',
        channel: 'in_app',
        automationLevel: 'safe'
      }],
      data: {},
      generatedAt: new Date()
    },
    {
      id: '3',
      type: 'complaint_spike',
      title: 'No-show risk increased for CNA candidates from Source X',
      description: 'Candidates from this source showing 25% higher no-show rates',
      severity: 'warning',
      actions: [{
        id: 'nudge-1',
        type: 'nudge',
        title: 'Trigger Reminder Email',
        description: 'Send automated reminder emails to CNA candidates',
        actor: 'candidate',
        channel: 'email',
        automationLevel: 'safe'
      }],
      data: {},
      generatedAt: new Date()
    }
  ]);

  const [cohorts, setCohorts] = useState<CohortData[]>([
    {
      cohort: '2024-Q1',
      totalHires: 15,
      retention30d: 80,
      retention60d: 73,
      retention90d: 67,
      predictedRetention: 70,
      actualRetention: 67
    }
  ]);

  const [funnelMetrics, setFunnelMetrics] = useState<FunnelMetrics>({
    applicants: 100,
    interviews: 50,
    offers: 25,
    hires: 20,
    retention30d: 18,
    retention60d: 16,
    retention90d: 15
  });

  const [hotspots, setHotspots] = useState<HotspotData[]>([
    {
      unit: 'Rehab',
      role: 'CNA',
      sentimentScore: 0.6,
      retentionForecast: 45,
      participationRate: 75,
      riskLevel: 'high'
    },
    {
      unit: 'Memory Care',
      role: 'LPN',
      sentimentScore: 0.5,
      retentionForecast: 35,
      participationRate: 60,
      riskLevel: 'high'
    },
    {
      unit: 'ICU',
      role: 'RN',
      sentimentScore: 0.8,
      retentionForecast: 85,
      participationRate: 90,
      riskLevel: 'low'
    },
    {
      unit: 'Surgical',
      role: 'CNA',
      sentimentScore: 0.7,
      retentionForecast: 70,
      participationRate: 80,
      riskLevel: 'medium'
    }
  ]);

  const [actions, setActions] = useState<ActionItem[]>([
    {
      id: '1',
      facilityId,
      actionType: 'escalate',
      category: 'retention',
      title: 'Escalate Retention Risk - Rehab Unit',
      description: 'Retention forecast dropped 12 points vs baseline',
      priority: 'high',
      status: 'pending',
      type: 'manual',
      icon: 'warning',
      assignedTo: 'supervisor@facility.com',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date()
    },
    {
      id: '2',
      facilityId,
      actionType: 'pulse',
      category: 'sentiment',
      title: 'Pulse survey sent to Memory Care Nights',
      description: 'Targeted pulse survey sent to Memory Care night shift staff to assess burnout risk',
      priority: 'medium',
      status: 'completed',
      type: 'auto',
      icon: 'info',
      assignedTo: 'hr@facility.com',
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
    },
    {
      id: '3',
      facilityId,
      actionType: 'nudge',
      category: 'candidate_engagement',
      title: 'Reminder email scheduled for CNA Source X',
      description: 'Automated reminder emails scheduled for CNA candidates from Source X to reduce no-show rates',
      priority: 'medium',
      status: 'in_progress',
      type: 'auto',
      icon: 'info',
      assignedTo: 'recruiting@facility.com',
      dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
    }
  ]);

  const automationModes = [
    { name: 'Retention Drop Escalation', status: 'manual' as const },
    { name: 'Pulse Reminder', status: 'auto' as const },
    { name: 'Complaint Theme Spike', status: 'manual' as const },
  ];

  const completedTasks = [
    { category: 'New Hire Retention', count: 14 },
    { category: 'Sentiment', count: 6 },
    { category: 'Engagement', count: 8 },
    { category: 'Complaint', count: 11 },
    { category: 'Culture', count: 3 },
  ];

  // Real API calls
  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      // Fetch all analytics data in parallel with credentials
      const [kpisResponse, insightsResponse, cohortsResponse, hotspotsResponse, actionsResponse] = await Promise.all([
        fetch(`${baseUrl}/api/analytics/kpis/${facilityId}`, { credentials: 'include' }),
        fetch(`${baseUrl}/api/analytics/insights/${facilityId}`, { credentials: 'include' }),
        fetch(`${baseUrl}/api/analytics/cohorts/${facilityId}`, { credentials: 'include' }),
        fetch(`${baseUrl}/api/analytics/hotspots/${facilityId}?type=${hotspotType}`, { credentials: 'include' }),
        fetch(`${baseUrl}/api/analytics/actions/${facilityId}`, { credentials: 'include' })
      ]);

      // Parse responses only if successful
      if (kpisResponse.ok) {
        const kpis = await kpisResponse.json();
        if (kpis) {
          setKpiData({
            retentionForecast: kpis.retentionForecast || kpiData.retentionForecast,
            noShowRisk: kpis.noShowRisk || kpiData.noShowRisk,
            turnoverCost: kpis.turnoverCost || kpiData.turnoverCost
          });
        }
      }

      if (insightsResponse.ok) {
        const insights = await insightsResponse.json();
        if (insights && Array.isArray(insights)) {
          setInsights(insights);
        }
      }

      if (cohortsResponse.ok) {
        const cohorts = await cohortsResponse.json();
        if (cohorts && Array.isArray(cohorts)) {
          setCohorts(cohorts);
        }
      }

      if (hotspotsResponse.ok) {
        const hotspots = await hotspotsResponse.json();
        if (hotspots && Array.isArray(hotspots)) {
          setHotspots(hotspots);
        }
      }

      if (actionsResponse.ok) {
        const actions = await actionsResponse.json();
        if (actions && Array.isArray(actions)) {
          setActions(actions.map((action: any) => ({
            type: action.type ?? (action.actionType === 'escalate' ? 'manual' : 'auto'),
            icon: action.icon ?? (action.actionType === 'nudge' ? 'info' : 'warning'),
            priority: action.priority ?? 'medium',
            status: action.status ?? 'pending',
            ...action,
          })));
        }
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Fall back to mock data if API fails
      console.log('Falling back to mock data...');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [facilityId, dateRange, roleFilter, unitFilter]);

  const handleActionClick = (action: Action) => {
    console.log('Action clicked:', action);
    
    if (action.type === 'pulse') {
      setSelectedAudience('Memory Care · Night Shift · CNAs (scheduled in last 30d)');
      setPulseModalOpen(true);
    } else if (action.type === 'nudge') {
      setSelectedRecipients('CNA candidates from Source X (interviews next 7 days)');
      setReminderModalOpen(true);
    } else if (action.type === 'escalate') {
      // Handle escalation action
      console.log('Escalating to supervisor...');
    }
  };

  const handleActionStatusUpdate = (actionId: string, status: string) => {
    setActions(prev => prev.map(action => 
      action.id === actionId 
        ? { ...action, status: status as any, completedAt: status === 'completed' ? new Date() : undefined }
        : action
    ));
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting analytics data as ${format}`);
    // Implement export functionality
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#2466D0] animate-spin mx-auto mb-4" />
          <p className="text-[#7691A4] text-lg">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Main Container - Matches YourPipeline styling */}
      <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_0px_20px_rgba(0,0,0,0.08)] p-2 md:p-4 relative" style={{ maxWidth: '90%', margin: '0 auto' }}>
        
        {/* Header with Filters and Actions - Attached to main container */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Date Range Filter */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="custom">Custom range</option>
              </select>
            </div>

            {/* Role Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Roles</option>
                <option value="CNA">CNA</option>
                <option value="LPN">LPN</option>
                <option value="RN">RN</option>
                <option value="Support">Support</option>
              </select>
            </div>

            {/* Unit Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">All Units</option>
                <option value="ICU">ICU</option>
                <option value="Rehab">Rehab</option>
                <option value="Med-Surg">Med-Surg</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Refresh Button - Rounded like YourPipeline */}
            <button
              onClick={fetchAnalyticsData}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-white hover:bg-gray-50 text-[#A0B3C7] font-medium rounded-full shadow border border-gray-200 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-[#A0B3C7] ${loading ? 'animate-spin' : ''}`} />
              <span className="text-[#A0B3C7] font-avenir">Refresh</span>
            </button>

            {/* YourPipeline Button */}
            <button
              onClick={() => router.push('/your-pipeline')}
              className="flex items-center space-x-2 px-6 py-2 bg-white hover:bg-gray-50 text-[#A0B3C7] font-medium rounded-full shadow border border-gray-200 transition-colors"
            >
              <span className="text-[#A0B3C7] font-avenir">YourPipeline</span>
              <ArrowRight className="w-4 h-4 text-[#A0B3C7]" />
            </button>

            {/* Export Buttons - Rounded like YourPipeline */}
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center space-x-2 px-6 py-2 bg-white hover:bg-gray-50 text-[#A0B3C7] font-medium rounded-full shadow border border-gray-200 transition-colors"
            >
              <Download className="w-4 h-4 text-[#A0B3C7]" />
              <span className="text-[#A0B3C7] font-avenir">CSV</span>
            </button>

            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center space-x-2 px-6 py-2 bg-white hover:bg-gray-50 text-[#A0B3C7] font-medium rounded-full shadow border border-gray-200 transition-colors"
            >
              <Download className="w-4 h-4 text-[#A0B3C7]" />
              <span className="text-[#A0B3C7] font-avenir">PDF</span>
            </button>
          </div>
        </div>

        {/* Action Center - First item under buttons */}
        <div className="mb-8">
          <ActionCenter 
            actionItems={actions}
            automationModes={automationModes}
            completedTasks={completedTasks}
            onEscalate={(item) => handleActionStatusUpdate(item.id, 'in_review')}
          />
        </div>

        {/* KPI Metrics and Insight Feed - Single container */}
        <div className="mb-8">
          <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] p-6">
            <div className="flex flex-col lg:flex-row gap-6 h-full">
             {/* KPI Metrics - Left side */}
             <div className="lg:w-1/2">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-[25px] font-bold leading-[34px] text-[#01253F] font-avenir">KPIs</h2>
               </div>
               <div className="flex flex-col gap-1">
                 <div className="flex gap-2">
                   <div className="flex-1">
                     <RetentionForecastCard data={kpiData.retentionForecast} />
                   </div>
                   <div className="flex-1">
                     <NoShowRiskCard data={kpiData.noShowRisk} />
                   </div>
                 </div>
                 <div>
                   <TurnoverCostCard data={kpiData.turnoverCost} />
                 </div>
               </div>
             </div>
              
              {/* Insight Feed - Right side, full height */}
              <div className="lg:w-1/2 flex flex-col h-full">
                <InsightFeed insights={insights} onActionClick={handleActionClick} />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Analytics - Cohort Analysis and Hotspots */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <CohortAnalysis cohorts={cohorts} funnelMetrics={funnelMetrics} />
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#01253F]">Hotspots</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setHotspotType('unit')}
                    className={`px-3 py-1 rounded-md text-sm ${
                      hotspotType === 'unit' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    By Unit
                  </button>
                  <button
                    onClick={() => setHotspotType('role')}
                    className={`px-3 py-1 rounded-md text-sm ${
                      hotspotType === 'role' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    By Role
                  </button>
                </div>
              </div>
              <HotspotMatrix hotspots={hotspots} type={hotspotType} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <PulseModal 
        isOpen={pulseModalOpen}
        onClose={() => setPulseModalOpen(false)}
        audience={selectedAudience}
      />
      
      <ReminderModal 
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        recipients={selectedRecipients}
      />
    </div>
  );
};
