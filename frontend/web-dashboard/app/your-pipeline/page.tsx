"use client";

import React, { useState } from 'react';
import { 
  Bell, 
  Edit3, 
  Download,
  CheckCircle,
  Info,
  AlertTriangle,
  Briefcase,
  TrendingUp,
  MapPin,
  Users,
  MessageSquare,
  Phone,
  Mail
} from 'lucide-react';
import BaseLayout from '../components/layout/BaseLayout';
import AdminDashboardNav from '../components/AdminDashboardNav';
import ActionCenter, { ActionItem } from '../components/analytics/ActionCenter';
import HotspotsSection from '../components/analytics/HotspotsSection';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const YourPipelinePage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState(false);
  const [isInsightsExpanded, setIsInsightsExpanded] = useState(false);

  // Demo state
  const [currentPage, setCurrentPage] = useState(1);
  const [notifications, setNotifications] = useState(2);
  const [showNotification, setShowNotification] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [activeEscalationItem, setActiveEscalationItem] = useState<ActionItem | null>(null);
  const [escalationForm, setEscalationForm] = useState({
    recipient: '',
    subject: '',
    message: ''
  });
  const [expandedItem, setExpandedItem] = useState<{ section: 'workforce' | 'action' | 'hotspot'; id: string } | null>(null);
  // Full-screen expansion removed

  // Demo data
  const demoJobs = [
    {
      id: 1,
      title: "Registered Nurse",
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "75k/yr - 85k/yr",
      applicants: 4,
      status: "Active"
    },
    {
      id: 2,
      title: "Physical Therapist", 
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "80k/yr - 95k/yr",
      applicants: 7,
      status: "Active"
    },
    {
      id: 3,
      title: "Medical Assistant",
      company: "St. Mary's Health Center", 
      location: "New Haven, CT",
      salary: "45k/yr - 55k/yr",
      applicants: 12,
      status: "Active"
    },
    {
      id: 4,
      title: "Respiratory Therapist",
      company: "St. Mary's Health Center",
      location: "New Haven, CT", 
      salary: "70k/yr - 85k/yr",
      applicants: 3,
      status: "Active"
    },
    {
      id: 5,
      title: "Laboratory Technician",
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "50k/yr - 65k/yr",
      applicants: 8,
      status: "Active"
    },
    {
      id: 6,
      title: "Radiology Technologist",
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "60k/yr - 75k/yr",
      applicants: 5,
      status: "Active"
    },
    {
      id: 7,
      title: "Pharmacy Technician",
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "40k/yr - 55k/yr",
      applicants: 15,
      status: "Active"
    },
    {
      id: 8,
      title: "Occupational Therapist",
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "75k/yr - 90k/yr",
      applicants: 6,
      status: "Active"
    },
    {
      id: 9,
      title: "Speech Language Pathologist",
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "70k/yr - 85k/yr",
      applicants: 4,
      status: "Active"
    },
    {
      id: 10,
      title: "Clinical Social Worker",
      company: "St. Mary's Health Center",
      location: "New Haven, CT",
      salary: "55k/yr - 70k/yr",
      applicants: 9,
      status: "Active"
    }
  ];

  const demoMatches = [
    {
      id: 1,
      name: "Marvin Grant",
      role: "Registered Nurse",
      experience: "5+ years experience",
      location: "New Haven, CT",
      matchScore: 94,
      status: "Matched"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      role: "Physical Therapist", 
      experience: "3+ years experience",
      location: "Hartford, CT",
      matchScore: 87,
      status: "Matched"
    },
    {
      id: 3,
      name: "Michael Chen",
      role: "Medical Assistant",
      experience: "2+ years experience", 
      location: "Bridgeport, CT",
      matchScore: 92,
      status: "Matched"
    },
    {
      id: 4,
      name: "Jennifer Davis",
      role: "Respiratory Therapist",
      experience: "4+ years experience",
      location: "New Haven, CT",
      matchScore: 89,
      status: "Matched"
    },
    {
      id: 5,
      name: "Robert Wilson",
      role: "Laboratory Technician",
      experience: "6+ years experience",
      location: "Milford, CT",
      matchScore: 91,
      status: "Matched"
    },
    {
      id: 6,
      name: "Lisa Martinez",
      role: "Radiology Technologist",
      experience: "3+ years experience",
      location: "West Haven, CT",
      matchScore: 88,
      status: "Matched"
    },
    {
      id: 7,
      name: "David Thompson",
      role: "Pharmacy Technician",
      experience: "2+ years experience",
      location: "New Haven, CT",
      matchScore: 85,
      status: "Matched"
    },
    {
      id: 8,
      name: "Amanda Rodriguez",
      role: "Occupational Therapist",
      experience: "5+ years experience",
      location: "Hartford, CT",
      matchScore: 93,
      status: "Matched"
    },
    {
      id: 9,
      name: "Thomas Anderson",
      role: "Speech Language Pathologist",
      experience: "4+ years experience",
      location: "New Haven, CT",
      matchScore: 90,
      status: "Matched"
    },
    {
      id: 10,
      name: "Jessica White",
      role: "Clinical Social Worker",
      experience: "3+ years experience",
      location: "Bridgeport, CT",
      matchScore: 86,
      status: "Matched"
    },
    {
      id: 11,
      name: "Christopher Taylor",
      role: "Registered Nurse",
      experience: "8+ years experience",
      location: "Milford, CT",
      matchScore: 95,
      status: "Matched"
    },
    {
      id: 12,
      name: "Nicole Adams",
      role: "Physical Therapist",
      experience: "6+ years experience",
      location: "West Haven, CT",
      matchScore: 92,
      status: "Matched"
    },
    {
      id: 13,
      name: "Ryan Miller",
      role: "Medical Assistant",
      experience: "3+ years experience",
      location: "New Haven, CT",
      matchScore: 87,
      status: "Matched"
    },
    {
      id: 14,
      name: "Emma Wilson",
      role: "Respiratory Therapist",
      experience: "5+ years experience",
      location: "Hartford, CT",
      matchScore: 89,
      status: "Matched"
    },
    {
      id: 15,
      name: "Daniel Kim",
      role: "Laboratory Technician",
      experience: "4+ years experience",
      location: "Bridgeport, CT",
      matchScore: 88,
      status: "Matched"
    }
  ];

  const demoApplicants = [
    {
      id: 1,
      name: "Emily Rodriguez",
      role: "Registered Nurse",
      experience: "4+ years experience",
      location: "New Haven, CT",
      status: "Applied",
      appliedDate: "2 days ago"
    },
    {
      id: 2,
      name: "David Thompson",
      role: "Registered Nurse",
      experience: "6+ years experience",
      location: "Milford, CT",
      status: "Applied",
      appliedDate: "1 day ago"
    },
    {
      id: 3,
      name: "Lisa Park",
      role: "Registered Nurse",
      experience: "3+ years experience",
      location: "West Haven, CT",
      status: "Applied",
      appliedDate: "3 days ago"
    },
    {
      id: 4,
      name: "Carlos Mendez",
      role: "Physical Therapist",
      experience: "5+ years experience",
      location: "New Haven, CT",
      status: "Applied",
      appliedDate: "4 days ago"
    },
    {
      id: 5,
      name: "Rachel Green",
      role: "Medical Assistant",
      experience: "2+ years experience",
      location: "Hartford, CT",
      status: "Applied",
      appliedDate: "1 day ago"
    },
    {
      id: 6,
      name: "James Brown",
      role: "Respiratory Therapist",
      experience: "7+ years experience",
      location: "Bridgeport, CT",
      status: "Applied",
      appliedDate: "2 days ago"
    },
    {
      id: 7,
      name: "Maria Garcia",
      role: "Laboratory Technician",
      experience: "4+ years experience",
      location: "New Haven, CT",
      status: "Applied",
      appliedDate: "5 days ago"
    },
    {
      id: 8,
      name: "Kevin Lee",
      role: "Radiology Technologist",
      experience: "3+ years experience",
      location: "Milford, CT",
      status: "Applied",
      appliedDate: "3 days ago"
    },
    {
      id: 9,
      name: "Sophia Chen",
      role: "Pharmacy Technician",
      experience: "1+ years experience",
      location: "West Haven, CT",
      status: "Applied",
      appliedDate: "1 day ago"
    },
    {
      id: 10,
      name: "Alex Johnson",
      role: "Occupational Therapist",
      experience: "6+ years experience",
      location: "Hartford, CT",
      status: "Applied",
      appliedDate: "2 days ago"
    },
    {
      id: 11,
      name: "Daniel Kim",
      role: "Speech Language Pathologist",
      experience: "4+ years experience",
      location: "New Haven, CT",
      status: "Applied",
      appliedDate: "1 day ago"
    },
    {
      id: 12,
      name: "Sarah Williams",
      role: "Clinical Social Worker",
      experience: "5+ years experience",
      location: "Bridgeport, CT",
      status: "Applied",
      appliedDate: "3 days ago"
    },
    {
      id: 13,
      name: "Michael Davis",
      role: "Registered Nurse",
      experience: "9+ years experience",
      location: "Milford, CT",
      status: "Applied",
      appliedDate: "4 days ago"
    },
    {
      id: 14,
      name: "Emma Wilson",
      role: "Physical Therapist",
      experience: "7+ years experience",
      location: "West Haven, CT",
      status: "Applied",
      appliedDate: "2 days ago"
    },
    {
      id: 15,
      name: "Ryan Miller",
      role: "Medical Assistant",
      experience: "3+ years experience",
      location: "Hartford, CT",
      status: "Applied",
      appliedDate: "1 day ago"
    }
  ];

  // Analytics data based on PDF structure
  const analyticsData = {
    // Hiring Health Metrics (Left Column - 2x2 Grid)
    orientationFillForecast: {
      rolesOnTrack: 12,
      totalRoles: 15,
      rolesAtRisk: 3,
      percentage: 80, // 12/15 = 80%
      threshold: 'amber', // amber 80-89%
      orientationDaysAway: 5 // <7 days triggers alert
    },
    strongMatches: {
      percentage: 86,
      timeframe: 'this month',
      threshold: 'green' // green ≥75%
    },
    retentionOutcomes: {
      percentage: 72,
      timeframe: 'last 90d',
      threshold: 'green' // green ≥70%
    },
    pulseTrends: {
      percentage: 34,
      timeframe: 'last 30d',
      threshold: 'green' // green stable/up (≥+5%)
    },
    
    // Workforce Stability Metrics (Right Column)
    earlyChurnRisk: {
      percentage: 15,
      hiresAtRisk: 4,
      turnoverCost: 40000,
      threshold: 'amber' // green ≤10%, amber 11-24%, red ≥25%
    },
    retentionForecast: {
      percentage: 52,
      timeframe: '30d',
      threshold: 'red' // green ≥70%, amber 60-69%, red <60%
    },
    workEnvironmentScore: {
      score: 77,
      maxScore: 100,
      threshold: 'green' // green ≥75, amber 65-74, red <65
    },
    cultureAlignment: {
      percentage: 58,
      threshold: 'red' // green ≥70%, amber 60-69%, red <60%
    },
    roiSummary: {
      saved: 24000,
      timeSaved: 200,
      hiresRetained: 6,
      threshold: 'green' // neutral $0-10K, green >$10K
    }
  };

  // Action Center Data
  const actionCenterData = {
    actionItems: [
      {
        id: '1',
        title: 'Retention Forecast Drop Detected - Rehab Unit',
        description: 'Retention forecast dropped 12 points from baseline.',
        type: 'manual' as const,
        status: 'Escalate to Supervisor',
        icon: 'warning' as const,
        priority: 'high' as const
      },
      {
        id: '2',
        title: 'Pulse Participation Drop Detected',
        description: 'Pulse participation dropped 50 points from last month.',
        type: 'auto' as const,
        status: 'Pulse Reminder Sent',
        icon: 'warning' as const,
        priority: 'medium' as const
      },
      {
        id: '3',
        title: 'Culture Misalignment Flag',
        description: 'Intake vs employee sentiment divergence of 20 points.',
        type: 'manual' as const,
        status: 'Escalate to DON',
        icon: 'warning' as const,
        priority: 'high' as const
      },
      {
        id: '4',
        title: 'High Performers Detected',
        description: 'Retention forecast rose 10 points from baseline.',
        type: 'auto' as const,
        status: 'Encouragement Nudge Sent',
        icon: 'success' as const,
        priority: 'low' as const
      },
      {
        id: '5',
        title: 'Safety Compliance Alert',
        description: 'Detected a complaint that contains the term "unsafe".',
        type: 'auto' as const,
        status: 'Escalated to Compliance Officer',
        icon: 'warning' as const,
        priority: 'high' as const
      }
    ],
    automationModes: [
      { name: 'Intake Nudge', status: 'auto' as const },
      { name: 'Pulse Reminder', status: 'auto' as const },
      { name: 'Retention Drop Escalation', status: 'manual' as const },
      { name: 'Complaint Theme Spike', status: 'manual' as const }
    ],
    completedTasks: [
      { category: 'New Hire Retention', count: 14 },
      { category: 'Sentiment', count: 6 },
      { category: 'Engagement', count: 8 },
      { category: 'Complaint', count: 11 },
      { category: 'Culture', count: 3 },
      { category: 'Positive Reinforcement', count: 4 }
    ]
  };

  // Hotspots Data
  const hotspotsData = {
    rehab: {
      sentiment: 22,
      participation: 75,
      retention: 40,
      riskLevel: 'medium' as const
    },
    memoryCare: {
      sentiment: 22,
      participation: 10,
      retention: 8,
      riskLevel: 'high' as const
    },
    icu: {
      sentiment: 22,
      participation: 10,
      retention: 8,
      riskLevel: 'high' as const
    },
    surgical: {
      sentiment: 65,
      participation: 75,
      retention: 90,
      riskLevel: 'low' as const
    }
  };

  const getDefaultEscalationRecipient = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes('supervisor')) return 'supervisor@stmaryshealth.org';
    if (normalizedStatus.includes('don')) return 'don@stmaryshealth.org';
    if (normalizedStatus.includes('compliance')) return 'compliance@stmaryshealth.org';
    return 'leadership@stmaryshealth.org';
  };

  const toggleExpandedItem = (section: 'workforce' | 'action' | 'hotspot', id: string) => {
    setExpandedItem(prev => {
      if (prev && prev.section === section && prev.id === id) {
        return null;
      }
      return { section, id };
    });
  };

  const isWorkforceExpanded = (id: string) => expandedItem?.section === 'workforce' && expandedItem.id === id;

  // Helper functions for color coding and thresholds
  const getThresholdColor = (threshold: string) => {
    switch (threshold) {
      case 'green': return 'bg-green-500';
      case 'amber': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getThresholdTextColor = (threshold: string) => {
    switch (threshold) {
      case 'green': return 'text-green-600';
      case 'amber': return 'text-yellow-600';
      case 'red': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getThresholdIndicatorConfig = (threshold: string) => {
    switch (threshold) {
      case 'green':
        return { background: '#91D7DE', icon: CheckCircle, iconColor: '#01253F' };
      case 'amber':
        return { background: '#FDD6BD', icon: AlertTriangle, iconColor: '#8A3B12' };
      case 'red':
        return { background: '#FFC7C8', icon: AlertTriangle, iconColor: '#8A1F1F' };
      default:
        return { background: '#FDD6BD', icon: AlertTriangle, iconColor: '#8A3B12' };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // CSV Download Helper Functions
  const convertToCSV = (data: any[], headers: string[], filename: string) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header.toLowerCase().replace(/\s+/g, '')] || row[header] || '';
          // Escape commas and quotes in CSV
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAnalyticsCSV = () => {
    const analyticsCSVData = [
      {
        metric: 'Orientation Fill Forecast',
        value: `${analyticsData.orientationFillForecast.percentage}%`,
        details: `${analyticsData.orientationFillForecast.rolesOnTrack} of ${analyticsData.orientationFillForecast.totalRoles} roles on track`,
        threshold: analyticsData.orientationFillForecast.threshold
      },
      {
        metric: 'Strong Matches',
        value: `${analyticsData.strongMatches.percentage}%`,
        details: `${analyticsData.strongMatches.percentage}% strong matches ${analyticsData.strongMatches.timeframe}`,
        threshold: analyticsData.strongMatches.threshold
      },
      {
        metric: 'Retention Outcomes',
        value: `${analyticsData.retentionOutcomes.percentage}%`,
        details: `${analyticsData.retentionOutcomes.percentage}% of hires stayed ≥30d`,
        threshold: analyticsData.retentionOutcomes.threshold
      },
      {
        metric: 'Pulse Trends',
        value: `+${analyticsData.pulseTrends.percentage}%`,
        details: `+${analyticsData.pulseTrends.percentage}% morale trend`,
        threshold: analyticsData.pulseTrends.threshold
      },
      {
        metric: 'Early Churn Risk',
        value: `${analyticsData.earlyChurnRisk.percentage}%`,
        details: `${analyticsData.earlyChurnRisk.hiresAtRisk} hires at risk`,
        threshold: analyticsData.earlyChurnRisk.threshold
      },
      {
        metric: 'Retention Forecast',
        value: `${analyticsData.retentionForecast.percentage}%`,
        details: `${analyticsData.retentionForecast.percentage}% projected to stay`,
        threshold: analyticsData.retentionForecast.threshold
      },
      {
        metric: 'Work Environment Score',
        value: `${analyticsData.workEnvironmentScore.score}/${analyticsData.workEnvironmentScore.maxScore}`,
        details: 'Composite score of morale + fit signals',
        threshold: analyticsData.workEnvironmentScore.threshold
      },
      {
        metric: 'Culture Alignment',
        value: `${analyticsData.cultureAlignment.percentage}%`,
        details: `${analyticsData.cultureAlignment.percentage}% aligned`,
        threshold: analyticsData.cultureAlignment.threshold
      },
      {
        metric: 'ROI Summary',
        value: formatCurrency(analyticsData.roiSummary.saved),
        details: `${analyticsData.roiSummary.timeSaved} hrs saved, ${analyticsData.roiSummary.hiresRetained} hires retained`,
        threshold: analyticsData.roiSummary.threshold
      }
    ];

    convertToCSV(analyticsCSVData, ['Metric', 'Value', 'Details', 'Threshold'], 'analytics-data.csv');
  };

  const downloadJobsCSV = () => {
    if (!demoJobs || !Array.isArray(demoJobs)) return;
    
    const jobsCSVData = demoJobs.map(job => ({
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      applicants: job.applicants,
      status: job.status
    }));

    convertToCSV(jobsCSVData, ['Title', 'Company', 'Location', 'Salary', 'Applicants', 'Status'], 'open-jobs.csv');
  };

  const downloadMatchesCSV = () => {
    if (!demoMatches || !Array.isArray(demoMatches)) return;
    
    const matchesCSVData = demoMatches.map(match => ({
      name: match.name,
      role: match.role,
      experience: match.experience,
      location: match.location,
      matchScore: match.matchScore,
      status: match.status
    }));

    convertToCSV(matchesCSVData, ['Name', 'Role', 'Experience', 'Location', 'Match Score', 'Status'], 'matches.csv');
  };

  const downloadApplicantsCSV = () => {
    if (!demoApplicants || !Array.isArray(demoApplicants)) return;
    
    const applicantsCSVData = demoApplicants.map(applicant => ({
      name: applicant.name,
      role: applicant.role,
      experience: applicant.experience,
      location: applicant.location,
      status: applicant.status,
      appliedDate: applicant.appliedDate
    }));

    convertToCSV(applicantsCSVData, ['Name', 'Role', 'Experience', 'Location', 'Status', 'Applied Date'], 'applicants.csv');
  };

  const handleDownloadCSV = (section: string) => {
    switch (section) {
      case 'analytics':
        downloadAnalyticsCSV();
        break;
      case 'jobs':
        downloadJobsCSV();
        break;
      case 'matches':
        downloadMatchesCSV();
        break;
      case 'applicants':
        downloadApplicantsCSV();
        break;
      default:
        console.log('Unknown section:', section);
    }
  };

  // Expansion handlers removed

  // Demo functions
  const handleNotificationClick = () => {
    setShowNotification(!showNotification);
    setNotifications(0);
  };

  const handleJobEdit = (job: any) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  const handleViewApplicants = (job: any) => {
    // Navigate to applicants page with job information
    router.push(`/applicants?jobId=${job.id}&jobTitle=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}&selectFirst=true`);
  };

  const handleViewProfile = (person: any) => {
    // Navigate to applicants page with matched filter set
    router.push(`/applicants?filter=matched&applicantName=${encodeURIComponent(person.name)}`);
  };

  const handleViewApplicantProfile = (applicant: any) => {
    // Navigate to applicants page without filter (show all applicants)
    router.push(`/applicants?applicantName=${encodeURIComponent(applicant.name)}`);
  };

  const handleEscalationFieldChange = (field: 'recipient' | 'subject' | 'message', value: string) => {
    setEscalationForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEscalateAction = (item: ActionItem) => {
    const recipient = getDefaultEscalationRecipient(item.status);
    const priorityLabel = item.priority.charAt(0).toUpperCase() + item.priority.slice(1);

    setActiveEscalationItem(item);
    setEscalationForm({
      recipient,
      subject: `Escalation: ${item.title}`,
      message: `Hello,\n\nWe have flagged an issue for review:\n- ${item.title}\n- Priority: ${priorityLabel}\n\n${item.description}\n\nPlease let me know if you need additional context.\n\nThanks,\nYourPipeline Assistant`
    });
    setShowEscalationModal(true);
  };

  const handleSendEscalation = () => {
    console.log('Escalation draft prepared', {
      item: activeEscalationItem,
      form: escalationForm
    });
    setShowEscalationModal(false);
    setActiveEscalationItem(null);
    setEscalationForm({
      recipient: '',
      subject: '',
      message: ''
    });
  };

  const handleCloseEscalationModal = () => {
    setShowEscalationModal(false);
    setActiveEscalationItem(null);
    setEscalationForm({
      recipient: '',
      subject: '',
      message: ''
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Check authentication and authorization only once
  // useEffect(() => {
  //   // Don't do anything until we have a definitive user state
  //   if (user === null) {
  //     // Still loading, wait
  //     return;
  //   }

  //   // Only check once
  //   if (authChecked) {
  //     return;
  //   }

  //   setAuthChecked(true);

  //   if (!user) {
  //     // User is not logged in, redirect to home
  //     router.push('/');
  //     return;
  //   }

  //   // Check if user is authorized for this dashboard
  //   if (user.role !== 'EMPLOYER') {
  //     setIsAuthorized(true);
  //     return;
  //   } else {
  //     // User is an employer, redirect to employer dashboard
  //     router.push('/my-pipeline');
  //   }
  // }, [user, router, authChecked]);

  // Disable auth for development
  useEffect(() => {
    setAuthChecked(true);
    setIsAuthorized(true);
  }, []);

  // Show loading while checking authentication
  // if (!authChecked || user === null) {
  //   return (
  //     <BaseLayout>
  //       <div className="flex items-center justify-center min-h-[400px]">
  //         <div className="text-center">
  //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2466D0] mx-auto mb-4"></div>
  //           <p className="text-[#7691A4] text-lg">Loading...</p>
  //         </div>
  //       </div>
  //     </BaseLayout>
  //   );
  // }

  // Show loading if user is not authorized (will redirect)
  // if (!isAuthorized) {
  //   return (
  //     <BaseLayout>
  //       <div className="flex items-center justify-center min-h-[400px]">
  //         <div className="text-center">
  //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2466D0] mx-auto mb-4"></div>
  //           <p className="text-[#7691A4] text-lg">Redirecting...</p>
  //         </div>
  //       </div>
  //     </BaseLayout>
  //   );
  // }

  const earlyChurnIndicator = getThresholdIndicatorConfig(analyticsData.earlyChurnRisk.threshold);
  const EarlyIcon = earlyChurnIndicator.icon;
  const retentionIndicator = getThresholdIndicatorConfig(analyticsData.retentionForecast.threshold);
  const RetentionIcon = retentionIndicator.icon;
  const workEnvIndicator = getThresholdIndicatorConfig(analyticsData.workEnvironmentScore.threshold);
  const WorkEnvIcon = workEnvIndicator.icon;
  const cultureIndicator = getThresholdIndicatorConfig(analyticsData.cultureAlignment.threshold);
  const CultureIcon = cultureIndicator.icon;

  // User is authorized, show the dashboard
  return (
    <BaseLayout isBlurred={showEscalationModal}>
      {/* Admin Navigation - Only show for admin users */}
      {user?.role === 'ADMIN' && <AdminDashboardNav />}

      {/* Page Header */}
      <div className="w-full py-4 sm:py-6 md:py-8 lg:py-12 relative" style={{ zIndex: 1 }}>
        <div className="max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-start">
            <h1 className="text-[70px] font-bold leading-[115%] text-[#01253F] font-baloo ml-14">
              YourPipeline
            </h1>
          </div>
          {user?.role === 'ADMIN' && (
            <p className="text-sm text-blue-600 font-medium mt-2 ml-6">Admin Access - Employee/User Dashboard</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[1400px] mx-auto px-2 md:px-4 lg:px-6 xl:px-8 pb-6 sm:pb-8 md:pb-12" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Main Company Container - Wraps both Analytics/Insights and Jobs/Matches/Applicants */}
        <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_0px_20px_rgba(0,0,0,0.08)] p-2 md:p-4 relative" style={{ maxWidth: '90%', margin: '0 auto' }}>
          
          {/* Company Header and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-[30px] font-black leading-[154%] text-[#01253F] font-avenir">
                St. Mary's Health Center
              </h2>
              {user?.role === 'ADMIN' && (
                <p className="text-sm text-blue-600 font-medium mt-1">Admin Access - Employee/User Dashboard</p>
              )}
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleNotificationClick}
                className="relative bg-white hover:bg-gray-50 text-[#A0B3C7] font-medium px-6 py-2 rounded-full shadow border border-gray-200 transition-colors flex items-center space-x-3"
              >
                <span className="text-[#A0B3C7] font-avenir">Alerts</span>
                <Bell className={`w-4 h-4 text-[#A0B3C7] fill-current ${notifications > 0 ? 'animate-bounce' : ''}`} />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center bg-red-500 animate-pulse">
                    {notifications}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Analytics Container - Holds both Metrics and Insights */}
          <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] p-6 mb-8">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[25px] font-bold leading-[34px] text-[#01253F] font-avenir">Analytics Snapshot</h2>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleDownloadCSV('analytics')}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Download data as CSV"
                >
                  <img src="/download.svg" alt="Download" className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            
            <div className="flex flex-col xl:flex-row gap-6">
              {/* Left Side - Hiring Health Metrics (2x2 Grid) */}
              <div className="flex-shrink-0 xl:w-1/2 w-full">
                <div className="grid grid-cols-2 gap-4 w-full max-w-full xl:max-w-[500px] mx-auto xl:mx-0">
                  {/* Orientation Fill Forecast Card */}
                  <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4 h-[180px]">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-medium text-[#01253F] leading-tight">Orientation Fill<br />Forecast</h3>
                      <div className="relative group">
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          % of roles forecast to fill by orientation (PPP_Match_Target)
                          <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-start mb-2 mt-8">
                      <span className="text-3xl font-bold text-[#01253F]">{analyticsData.orientationFillForecast.percentage}%</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {analyticsData.orientationFillForecast.rolesOnTrack} of {analyticsData.orientationFillForecast.totalRoles} roles on track ({analyticsData.orientationFillForecast.rolesAtRisk} at risk)
                    </div>
                  </div>

                  {/* Strong Matches Card */}
                  <div className="bg-white rounded-[21px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4 h-[180px]">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-medium text-[#01253F] leading-tight">Strong Matches</h3>
                      <div className="relative group">
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          % of surfaced candidates rated as strong fit + predicted to stay ≥30d
                          <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-start mb-2 mt-12">
                      <span className="text-3xl font-bold text-[#01253F]">{analyticsData.strongMatches.percentage}%</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {analyticsData.strongMatches.percentage}% strong matches {analyticsData.strongMatches.timeframe}
                    </div>
                  </div>

                  {/* Retention Outcomes Card */}
                  <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4 h-[180px]">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-medium text-[#01253F] leading-tight">Retention<br />Outcomes</h3>
                      <div className="relative group">
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          % of new hires who stayed ≥30 days (observed vs predicted)
                          <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-start mb-2 mt-8">
                      <span className="text-3xl font-bold text-[#01253F]">{analyticsData.retentionOutcomes.percentage}%</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {analyticsData.retentionOutcomes.percentage}% of hires stayed ≥30d ({analyticsData.retentionOutcomes.timeframe})
                    </div>
                  </div>

                  {/* Pulse Trends Card */}
                  <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4 h-[180px]">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-medium text-[#01253F] leading-tight">Pulse Trends</h3>
                      <div className="relative group">
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          Average morale trend from weekly caregiver check-ins
                          <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-start mb-2 mt-12">
                      <span className="text-3xl font-bold text-[#01253F]">+{analyticsData.pulseTrends.percentage}%</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      +{analyticsData.pulseTrends.percentage}% morale trend ({analyticsData.pulseTrends.timeframe})
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Workforce Stability Section */}
              <div className="xl:w-3/5 w-full bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4 min-w-[300px] mt-4 xl:mt-0 flex flex-col">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                  <h2 className="text-[25px] font-medium leading-[34px] text-[#01253F] font-avenir">Workforce Stability</h2>
                </div>
                
                      {/* Content Area - No Scroll */}
                      <div className="flex-1 space-y-2.5">
                  
                                          {/* Workforce Stability Metrics */}
                        <div className="space-y-2.5">
                        {/* ROI Summary Badge */}
                        <div
                          onClick={() => toggleExpandedItem('workforce', 'roi')}
                          className={`cursor-pointer p-3 rounded-lg transition-all duration-300 border ${
                            isWorkforceExpanded('roi') ? 'bg-white shadow-lg scale-[1.02] border-[#2CB3BF]' : 'border-transparent hover:bg-[#F3F3F3]'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-start gap-3">
                            <div className="flex items-center">
                              <span className="text-sm font-semibold text-[#01253F]">ROI Summary</span>
                              <div className="relative group ml-2">
                                <Info className="w-3 h-3 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                  ROI from reduced turnover + faster fills (export full report)
                                  <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                </div>
                              </div>
                            </div>
                            <div className="inline-flex flex-wrap items-center px-3 py-1 rounded-full text-xs font-semibold text-[#01253F] leading-tight"
                              style={{ backgroundColor: '#91D7DE' }}
                            >
                              {formatCurrency(analyticsData.roiSummary.saved)} saved, {analyticsData.roiSummary.timeSaved} hrs time saved, {analyticsData.roiSummary.hiresRetained} hires retained
                            </div>
                          </div>
                          {isWorkforceExpanded('roi') && (
                            <div className="mt-3 text-xs text-gray-500 bg-[#F3F3F3] rounded-lg p-3">
                              ROI drivers by business unit and quarterly savings trends will display here in the next release.
                            </div>
                          )}
                        </div>
                        
                        {/* Early Churn Risk */}
                        <div
                          onClick={() => toggleExpandedItem('workforce', 'earlyChurn')}
                          className={`cursor-pointer p-3 rounded-lg transition-all duration-300 border ${
                            isWorkforceExpanded('earlyChurn') ? 'bg-white shadow-lg scale-[1.02] border-[#2CB3BF]' : 'border-transparent hover:bg-[#F3F3F3]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <span className="text-sm font-semibold text-[#01253F]">Early Churn Risk</span>
                              <div className="relative group ml-2">
                                <Info className="w-3 h-3 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                  % of active new hires flagged for early churn risk
                                  <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-[#01253F]">
                                {analyticsData.earlyChurnRisk.hiresAtRisk} hires at risk (~{formatCurrency(analyticsData.earlyChurnRisk.turnoverCost)} turnover cost)
                              </span>
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: earlyChurnIndicator.background }}
                              >
                                <EarlyIcon className="w-3.5 h-3.5" style={{ color: earlyChurnIndicator.iconColor }} />
                              </div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full"
                              style={{ width: `${analyticsData.earlyChurnRisk.percentage}%`, background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' }}
                            ></div>
                          </div>
                          {isWorkforceExpanded('earlyChurn') && (
                            <div className="mt-3 text-xs text-gray-500 bg-[#F3F3F3] rounded-lg p-3">
                              Dive deeper into churn drivers by department and view the recommended retention playbook in the detailed view.
                            </div>
                          )}
                        </div>
                  
                  {/* Retention Forecast */}
                  <div
                    onClick={() => toggleExpandedItem('workforce', 'retention')}
                    className={`cursor-pointer p-3 rounded-lg transition-all duration-300 border ${
                      isWorkforceExpanded('retention') ? 'bg-white shadow-lg scale-[1.02] border-[#2CB3BF]' : 'border-transparent hover:bg-[#F3F3F3]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-sm font-semibold text-[#01253F]">Retention Forecast</span>
                        <div className="relative group ml-2">
                          <Info className="w-3 h-3 text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                            % of current hires projected to stay ≥30d (based on RLS)
                            <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#01253F]">
                          {analyticsData.retentionForecast.percentage}% projected to stay {analyticsData.retentionForecast.timeframe}
                        </span>
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: retentionIndicator.background }}
                        >
                          <RetentionIcon className="w-3.5 h-3.5" style={{ color: retentionIndicator.iconColor }} />
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ width: `${analyticsData.retentionForecast.percentage}%`, background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' }}
                      ></div>
                    </div>
                    {isWorkforceExpanded('retention') && (
                      <div className="mt-3 text-xs text-gray-500 bg-[#F3F3F3] rounded-lg p-3">
                        Forecast methodology and underlying leading indicators will appear here for expanded analysis.
                      </div>
                    )}
                  </div>
                  
                  {/* Work Environment Score */}
                  <div
                    onClick={() => toggleExpandedItem('workforce', 'workEnvironment')}
                    className={`cursor-pointer p-3 rounded-lg transition-all duration-300 border ${
                      isWorkforceExpanded('workEnvironment') ? 'bg-white shadow-lg scale-[1.02] border-[#2CB3BF]' : 'border-transparent hover:bg-[#F3F3F3]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-sm font-semibold text-[#01253F]">Work Environment Score</span>
                        <div className="relative group ml-2">
                          <Info className="w-3 h-3 text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                            Composite score of morale + fit signals (updated weekly)
                            <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#01253F]">
                          {analyticsData.workEnvironmentScore.score} / {analyticsData.workEnvironmentScore.maxScore}
                        </span>
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: workEnvIndicator.background }}
                        >
                          <WorkEnvIcon className="w-3.5 h-3.5" style={{ color: workEnvIndicator.iconColor }} />
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ width: `${analyticsData.workEnvironmentScore.score}%`, background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' }}
                      ></div>
                    </div>
                    {isWorkforceExpanded('workEnvironment') && (
                      <div className="mt-3 text-xs text-gray-500 bg-[#F3F3F3] rounded-lg p-3">
                        Track morale survey trends and cultural alignment detail here when expanded.
                      </div>
                    )}
                  </div>
                  
                  {/* Culture Alignment */}
                  <div
                    onClick={() => toggleExpandedItem('workforce', 'culture')}
                    className={`cursor-pointer p-3 rounded-lg transition-all duration-300 border ${
                      isWorkforceExpanded('culture') ? 'bg-white shadow-lg scale-[1.02] border-[#2CB3BF]' : 'border-transparent hover:bg-[#F3F3F3]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-sm font-semibold text-[#01253F]">Culture Alignment</span>
                        <div className="relative group ml-2">
                          <Info className="w-3 h-3 text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                            % of recent hires aligned with your facility's culture profile
                            <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#01253F]">
                          {analyticsData.cultureAlignment.percentage}% aligned
                        </span>
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: cultureIndicator.background }}
                        >
                          <CultureIcon className="w-3.5 h-3.5" style={{ color: cultureIndicator.iconColor }} />
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ width: `${analyticsData.cultureAlignment.percentage}%`, background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' }}
                      ></div>
                    </div>
                    {isWorkforceExpanded('culture') && (
                      <div className="mt-3 text-xs text-gray-500 bg-[#F3F3F3] rounded-lg p-3">
                        Understand sentiment gaps and onboarding feedback detail here when expanded.
                      </div>
                    )}
                  </div>
                        </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Center Section */}
          {actionCenterData && (
            <ActionCenter 
              actionItems={actionCenterData.actionItems || []}
              automationModes={actionCenterData.automationModes || []}
              completedTasks={actionCenterData.completedTasks || []}
              onEscalate={handleEscalateAction}
              expandedActionId={expandedItem?.section === 'action' ? expandedItem.id : undefined}
              onExpandAction={(id) => toggleExpandedItem('action', id)}
              onViewCompletedTasks={() => toggleExpandedItem('action', 'completed-tasks')}
            />
          )}

          {/* Hotspots Section */}
          {hotspotsData && (
            <HotspotsSection 
              data={hotspotsData}
              expandedHotspotId={expandedItem?.section === 'hotspot' ? expandedItem.id : undefined}
              onExpandHotspot={(id) => toggleExpandedItem('hotspot', id)}
            />
          )}
        </div>
      </div>

      {showEscalationModal && activeEscalationItem && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#01253F]/40 backdrop-blur-sm px-4"
          onClick={handleCloseEscalationModal}
        >
          <div
            className="relative w-full max-w-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-[rgba(244,244,244,0.95)] border border-white/60 rounded-[20px] shadow-[0px_12px_40px_rgba(1,37,63,0.2)] p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-[#E9D7F4] to-[#97B3FB] text-[#01253F]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#01253F] leading-tight">
                      {activeEscalationItem.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 max-w-md">
                      {activeEscalationItem.description}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseEscalationModal}
                  className="text-gray-500 hover:text-gray-700 transition-colors text-xl leading-none"
                  aria-label="Close escalation modal"
                >
                  &times;
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-[#01253F] text-white">
                  {activeEscalationItem.priority}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white border border-gray-200 text-[#01253F]">
                  {activeEscalationItem.status}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white border border-gray-200 text-[#01253F]">
                  {activeEscalationItem.type === 'manual' ? 'Manual escalation' : 'Automation'}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#01253F]">
                    Recipient
                  </label>
                  <input
                    type="email"
                    value={escalationForm.recipient}
                    onChange={(event) => handleEscalationFieldChange('recipient', event.target.value)}
                    placeholder="name@company.com"
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#01253F] focus:outline-none focus:ring-2 focus:ring-[#97B3FB]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#01253F]">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={escalationForm.subject}
                    onChange={(event) => handleEscalationFieldChange('subject', event.target.value)}
                    placeholder="Escalation subject line"
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#01253F] focus:outline-none focus:ring-2 focus:ring-[#97B3FB]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#01253F]">
                    Message
                  </label>
                  <textarea
                    value={escalationForm.message}
                    onChange={(event) => handleEscalationFieldChange('message', event.target.value)}
                    rows={6}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#01253F] focus:outline-none focus:ring-2 focus:ring-[#97B3FB]"
                  />
                </div>

                <p className="text-xs text-gray-500">
                  Demo preview only - email delivery will be connected in a future update.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={handleCloseEscalationModal}
                  className="px-4 py-2 text-sm font-medium text-[#01253F] bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendEscalation}
                  className="px-4 py-2 text-sm font-medium text-[#01253F] bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Send Escalation Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </BaseLayout>
  );
};

export default YourPipelinePage;
