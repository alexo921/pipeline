import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const YourPipelineScreen = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [notifications, setNotifications] = useState(2);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showJobModal, setShowJobModal] = useState(false);

  const demoJobs = [
    {
      id: 1,
      title: 'Registered Nurse I',
      company: 'St. Mary\'s Health Center',
      location: 'New Haven, CT',
      applicants: 15,
      matches: 8,
      status: 'Active',
      postedDate: '2 days ago',
      salary: '$75,000 - $85,000',
      type: 'Full-time',
      description: 'We are seeking a dedicated Registered Nurse to join our team...',
      requirements: ['Valid RN License', '2+ years experience', 'BLS Certification'],
      benefits: ['Health Insurance', '401k', 'PTO', 'Continuing Education']
    },
    {
      id: 2,
      title: 'Senior Registered Nurse',
      company: 'St. Mary\'s Health Center',
      location: 'New Haven, CT',
      applicants: 8,
      matches: 5,
      status: 'Active',
      postedDate: '1 day ago',
      salary: '$85,000 - $95,000',
      type: 'Full-time',
      description: 'We are seeking an experienced Senior Registered Nurse...',
      requirements: ['Valid RN License', '5+ years experience', 'ACLS Certification'],
      benefits: ['Health Insurance', '401k', 'PTO', 'Continuing Education']
    }
  ];

  const metrics = [
    {
      id: 1,
      title: 'Orientation Fill Rate',
      value: '78%',
      change: '+12%',
      trend: 'up',
      color: '#10B981'
    },
    {
      id: 2,
      title: 'Matches',
      value: '24',
      change: '+3',
      trend: 'up',
      color: '#3B82F6'
    },
    {
      id: 3,
      title: 'Retention Outcomes',
      value: '85%',
      change: '+5%',
      trend: 'up',
      color: '#8B5CF6'
    },
    {
      id: 4,
      title: 'Pulse Trends',
      value: '4.2',
      change: '+0.3',
      trend: 'up',
      color: '#F59E0B'
    },
    {
      id: 5,
      title: 'Forecast',
      value: '72%',
      change: '-2%',
      trend: 'down',
      color: '#EF4444'
    },
    {
      id: 6,
      title: 'Culture',
      value: '4.5',
      change: '+0.2',
      trend: 'up',
      color: '#06B6D4'
    },
    {
      id: 7,
      title: 'ROI',
      value: '2.4x',
      change: '+0.3x',
      trend: 'up',
      color: '#84CC16'
    }
  ];

  const insights = [
    {
      id: 1,
      title: 'Retention Forecast Drop Detected',
      description: 'Rehab unit forecast dropped 12 points vs baseline',
      severity: 'warning',
      action: 'Escalate to Supervisor'
    },
    {
      id: 2,
      title: 'Burnout risk rising in Memory Care - Nights (+18%)',
      description: 'Night shift staff showing increased stress indicators',
      severity: 'warning',
      action: 'Send Targeted Pulse'
    },
    {
      id: 3,
      title: 'No-show risk increased for CNA candidates from Source X',
      description: 'Candidates from this source showing 25% higher no-show rates',
      severity: 'warning',
      action: 'Trigger Reminder Email'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      default:
        return '#3B82F6';
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? 'trending-up' : 'trending-down';
  };

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? '#10B981' : '#EF4444';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>YourPipeline</Text>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications" size={24} color="#7691A4" />
            {notifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>{notifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>St. Mary's Health Center Dashboard</Text>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          {metrics.map((metric) => (
            <View key={metric.id} style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricTitle}>{metric.title}</Text>
                <View style={styles.trendContainer}>
                  <Ionicons 
                    name={getTrendIcon(metric.trend)} 
                    size={16} 
                    color={getTrendColor(metric.trend)} 
                  />
                  <Text style={[styles.metricChange, { color: getTrendColor(metric.trend) }]}>
                    {metric.change}
                  </Text>
                </View>
              </View>
              <Text style={[styles.metricValue, { color: metric.color }]}>
                {metric.value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Jobs Section */}
      <View style={styles.jobsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Open Positions</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color="#2466D0" />
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.jobsScroll}>
          {demoJobs.map((job) => (
            <TouchableOpacity 
              key={job.id} 
              style={styles.jobCard}
              onPress={() => {
                setSelectedJob(job);
                setShowJobModal(true);
              }}
            >
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{job.status}</Text>
                </View>
              </View>
              
              <Text style={styles.companyName}>{job.company}</Text>
              <Text style={styles.jobLocation}>{job.location}</Text>
              
              <View style={styles.jobStats}>
                <View style={styles.statItem}>
                  <Ionicons name="people" size={16} color="#7691A4" />
                  <Text style={styles.statText}>{job.applicants} applicants</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.statText}>{job.matches} matches</Text>
                </View>
              </View>
              
              <View style={styles.jobFooter}>
                <Text style={styles.postedDate}>Posted {job.postedDate}</Text>
                <TouchableOpacity style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>View Details</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Insights Section */}
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>Insight Feed</Text>
        <View style={styles.insightsList}>
          {insights.map((insight) => (
            <View key={insight.id} style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={styles.insightIcon}>
                  <Ionicons 
                    name="warning" 
                    size={20} 
                    color={getSeverityColor(insight.severity)} 
                  />
                </View>
                <Text style={styles.insightTitle}>{insight.title}</Text>
              </View>
              
              <Text style={styles.insightDescription}>{insight.description}</Text>
              
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>{insight.action}</Text>
                <Ionicons name="chevron-forward" size={16} color="#2466D0" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* Analytics Button */}
      <View style={styles.analyticsContainer}>
        <TouchableOpacity style={styles.analyticsButton}>
          <Ionicons name="analytics" size={24} color="white" />
          <Text style={styles.analyticsButtonText}>View Analytics</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const PIPELINE_BLUE = '#2466D0';
const PIPELINE_DARK = '#01253F';
const PIPELINE_GRAY = '#7691A4';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: PIPELINE_DARK,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: PIPELINE_GRAY,
  },
  metricsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PIPELINE_DARK,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    color: PIPELINE_GRAY,
    flex: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  jobsContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 16,
    color: PIPELINE_BLUE,
    fontWeight: '600',
  },
  jobsScroll: {
    paddingLeft: 20,
  },
  jobCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    width: 280,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PIPELINE_DARK,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  companyName: {
    fontSize: 16,
    color: PIPELINE_GRAY,
    marginBottom: 4,
  },
  jobLocation: {
    fontSize: 14,
    color: PIPELINE_GRAY,
    marginBottom: 16,
  },
  jobStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: PIPELINE_GRAY,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postedDate: {
    fontSize: 14,
    color: PIPELINE_GRAY,
  },
  viewButton: {
    backgroundColor: PIPELINE_BLUE,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  insightsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  insightsList: {
    gap: 12,
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightIcon: {
    marginRight: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PIPELINE_DARK,
    flex: 1,
  },
  insightDescription: {
    fontSize: 14,
    color: PIPELINE_GRAY,
    marginBottom: 12,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E9F1FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: PIPELINE_BLUE,
    fontWeight: '600',
  },
  analyticsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  analyticsButton: {
    backgroundColor: PIPELINE_BLUE,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  analyticsButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default YourPipelineScreen;
