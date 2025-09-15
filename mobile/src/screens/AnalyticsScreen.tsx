import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AnalyticsScreen = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [roleFilter, setRoleFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');
  const [pulseModalOpen, setPulseModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  const kpiData = {
    retentionForecast: {
      percentage30d: 72,
      percentage60d: 68,
      percentage90d: 65,
      trend: 'down',
      riskLevel: 'medium'
    },
    noShowRisk: {
      flaggedCount: 4,
      totalCandidates: 25,
      riskPercentage: 16,
      trend: 'up'
    },
    turnoverCost: {
      estimatedSavings: 24000,
      hiresRetained: 6,
      timeSaved: 200,
      roi: 2.4
    }
  };

  const insights = [
    {
      id: '1',
      type: 'retention_drop',
      title: 'Retention Forecast Drop Detected',
      description: 'Rehab unit forecast dropped 12 points vs baseline',
      severity: 'warning',
      action: 'Escalate to Supervisor'
    },
    {
      id: '2',
      type: 'sentiment_decline',
      title: 'Burnout risk rising in Memory Care - Nights (+18%)',
      description: 'Night shift staff showing increased stress indicators',
      severity: 'warning',
      action: 'Send Targeted Pulse'
    },
    {
      id: '3',
      type: 'complaint_spike',
      title: 'No-show risk increased for CNA candidates from Source X',
      description: 'Candidates from this source showing 25% higher no-show rates',
      severity: 'warning',
      action: 'Trigger Reminder Email'
    }
  ];

  const actions = [
    {
      id: '1',
      title: 'Escalate Retention Risk - Rehab Unit',
      description: 'Retention forecast dropped 12 points vs baseline',
      priority: 'high',
      status: 'pending',
      assignedTo: 'supervisor@facility.com',
      dueDate: 'Tomorrow'
    },
    {
      id: '2',
      title: 'Pulse survey sent to Memory Care Nights',
      description: 'Targeted pulse survey sent to Memory Care night shift staff',
      priority: 'medium',
      status: 'completed',
      assignedTo: 'hr@facility.com',
      completedAt: '2 hours ago'
    },
    {
      id: '3',
      title: 'Reminder email scheduled for CNA Source X',
      description: 'Automated reminder emails scheduled for CNA candidates',
      priority: 'medium',
      status: 'in_progress',
      assignedTo: 'recruiting@facility.com',
      dueDate: '6 hours from now'
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '#EF4444';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#3B82F6';
      default:
        return '#10B981';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'in_progress':
        return '#3B82F6';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const handleActionClick = (action: string) => {
    if (action === 'Send Targeted Pulse') {
      setPulseModalOpen(true);
    } else if (action === 'Trigger Reminder Email') {
      setReminderModalOpen(true);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Main Container */}
      <View style={styles.mainContainer}>
        
        {/* Header with Filters and Actions */}
        <View style={styles.headerRow}>
          <View style={styles.filtersContainer}>
            {/* Date Range Filter */}
            <View style={styles.filterItem}>
              <Ionicons name="calendar" size={20} color="#7691A4" />
              <TouchableOpacity style={styles.filterButton}>
                <Text style={styles.filterText}>Last 30 days</Text>
                <Ionicons name="chevron-down" size={16} color="#7691A4" />
              </TouchableOpacity>
            </View>

            {/* Role Filter */}
            <View style={styles.filterItem}>
              <Ionicons name="filter" size={20} color="#7691A4" />
              <TouchableOpacity style={styles.filterButton}>
                <Text style={styles.filterText}>All Roles</Text>
                <Ionicons name="chevron-down" size={16} color="#7691A4" />
              </TouchableOpacity>
            </View>

            {/* Unit Filter */}
            <View style={styles.filterItem}>
              <Ionicons name="filter" size={20} color="#7691A4" />
              <TouchableOpacity style={styles.filterButton}>
                <Text style={styles.filterText}>All Units</Text>
                <Ionicons name="chevron-down" size={16} color="#7691A4" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            {/* Refresh Button */}
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="refresh" size={16} color="#7691A4" />
              <Text style={styles.actionButtonText}>Refresh</Text>
            </TouchableOpacity>

            {/* Export Buttons */}
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="download" size={16} color="#7691A4" />
              <Text style={styles.actionButtonText}>CSV</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="download" size={16} color="#7691A4" />
              <Text style={styles.actionButtonText}>PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Center */}
        <View style={styles.actionCenterContainer}>
          <Text style={styles.sectionTitle}>Action Center</Text>
          <View style={styles.actionsList}>
            {actions.map((action) => (
              <View key={action.id} style={styles.actionCard}>
                <View style={styles.actionHeader}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <View style={styles.actionBadges}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(action.priority) + '20' }]}>
                      <Text style={[styles.priorityText, { color: getPriorityColor(action.priority) }]}>
                        {action.priority}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(action.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(action.status) }]}>
                        {action.status}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.actionDescription}>{action.description}</Text>
                <View style={styles.actionFooter}>
                  <Text style={styles.actionAssignee}>{action.assignedTo}</Text>
                  <Text style={styles.actionDueDate}>
                    {action.status === 'completed' ? `Completed ${action.completedAt}` : `Due: ${action.dueDate}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* KPI Metrics and Insight Feed */}
        <View style={styles.kpiInsightContainer}>
          <View style={styles.kpiSection}>
            <Text style={styles.sectionTitle}>KPIs</Text>
            <View style={styles.kpiGrid}>
              {/* Retention Forecast */}
              <View style={styles.kpiCard}>
                <Text style={styles.kpiTitle}>Retention Forecast</Text>
                <Text style={styles.kpiValue}>{kpiData.retentionForecast.percentage30d}%</Text>
                <Text style={styles.kpiSubtitle}>
                  {kpiData.retentionForecast.percentage60d}% 60d, {kpiData.retentionForecast.percentage90d}% 90d
                </Text>
                <View style={styles.trendContainer}>
                  <Ionicons name="trending-down" size={16} color="#EF4444" />
                  <Text style={styles.trendText}>Down</Text>
                </View>
              </View>

              {/* No-Show Risk */}
              <View style={styles.kpiCard}>
                <Text style={styles.kpiTitle}>No-Show Risk</Text>
                <Text style={styles.kpiValue}>{kpiData.noShowRisk.flaggedCount}</Text>
                <Text style={styles.kpiSubtitle}>
                  {kpiData.noShowRisk.riskPercentage}% of {kpiData.noShowRisk.totalCandidates} candidates flagged
                </Text>
                <View style={styles.trendContainer}>
                  <Ionicons name="trending-up" size={16} color="#EF4444" />
                  <Text style={styles.trendText}>Up</Text>
                </View>
              </View>

              {/* Turnover Cost */}
              <View style={[styles.kpiCard, styles.kpiCardWide]}>
                <Text style={styles.kpiTitle}>Turnover Cost Avoided</Text>
                <Text style={styles.kpiValue}>${kpiData.turnoverCost.estimatedSavings.toLocaleString()}</Text>
                <Text style={styles.kpiSubtitle}>
                  {kpiData.turnoverCost.hiresRetained} hires retained, {kpiData.turnoverCost.timeSaved} hrs saved
                </Text>
                <View style={styles.trendContainer}>
                  <Ionicons name="trending-up" size={16} color="#10B981" />
                  <Text style={styles.trendText}>Up</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Insight Feed */}
          <View style={styles.insightSection}>
            <Text style={styles.sectionTitle}>Insight Feed</Text>
            <View style={styles.insightsList}>
              {insights.map((insight) => (
                <View key={insight.id} style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Ionicons 
                      name="warning" 
                      size={20} 
                      color={getSeverityColor(insight.severity)} 
                    />
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                  </View>
                  <Text style={styles.insightDescription}>{insight.description}</Text>
                  <TouchableOpacity 
                    style={styles.insightActionButton}
                    onPress={() => handleActionClick(insight.action)}
                  >
                    <Text style={styles.insightActionText}>{insight.action}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#2466D0" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Pulse Modal */}
      <Modal
        visible={pulseModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPulseModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Targeted Pulse</Text>
              <TouchableOpacity onPress={() => setPulseModalOpen(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>
                Send pulse survey to Memory Care night shift staff to assess burnout risk
              </Text>
              <TouchableOpacity style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Send Pulse</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reminder Modal */}
      <Modal
        visible={reminderModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReminderModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trigger Candidate Reminder</Text>
              <TouchableOpacity onPress={() => setReminderModalOpen(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>
                Send automated reminder emails to CNA candidates from Source X to reduce no-show rates
              </Text>
              <TouchableOpacity style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Send Reminders</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  mainContainer: {
    backgroundColor: 'rgba(244,244,244,0.6)',
    borderRadius: 20,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    color: PIPELINE_DARK,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 14,
    color: PIPELINE_GRAY,
    fontWeight: '600',
  },
  actionCenterContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PIPELINE_DARK,
    marginBottom: 16,
  },
  actionsList: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PIPELINE_DARK,
    flex: 1,
  },
  actionBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionDescription: {
    fontSize: 14,
    color: PIPELINE_GRAY,
    marginBottom: 12,
  },
  actionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionAssignee: {
    fontSize: 14,
    color: PIPELINE_GRAY,
  },
  actionDueDate: {
    fontSize: 14,
    color: PIPELINE_GRAY,
  },
  kpiInsightContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  kpiSection: {
    flex: 1,
  },
  kpiGrid: {
    gap: 8,
  },
  kpiCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    height: 120,
  },
  kpiCardWide: {
    height: 120,
  },
  kpiTitle: {
    fontSize: 14,
    color: PIPELINE_GRAY,
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PIPELINE_DARK,
    marginBottom: 4,
  },
  kpiSubtitle: {
    fontSize: 12,
    color: PIPELINE_GRAY,
    marginBottom: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    color: PIPELINE_GRAY,
  },
  insightSection: {
    flex: 1,
  },
  insightsList: {
    gap: 12,
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PIPELINE_DARK,
    marginLeft: 12,
    flex: 1,
  },
  insightDescription: {
    fontSize: 14,
    color: PIPELINE_GRAY,
    marginBottom: 12,
    lineHeight: 20,
  },
  insightActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E9F1FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  insightActionText: {
    fontSize: 14,
    color: PIPELINE_BLUE,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    backgroundColor: PIPELINE_BLUE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modalContent: {
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    color: PIPELINE_DARK,
    marginBottom: 20,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: PIPELINE_BLUE,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AnalyticsScreen;


