import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ActionCenterScreen = () => {
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const actions = [
    {
      id: '1',
      title: 'Escalate Retention Risk - Rehab Unit',
      description: 'Retention forecast dropped 12 points vs baseline',
      priority: 'high',
      status: 'pending',
      assignedTo: 'supervisor@facility.com',
      dueDate: 'Tomorrow',
      actionType: 'escalate'
    },
    {
      id: '2',
      title: 'Pulse survey sent to Memory Care Nights',
      description: 'Targeted pulse survey sent to Memory Care night shift staff to assess burnout risk',
      priority: 'medium',
      status: 'completed',
      assignedTo: 'hr@facility.com',
      completedAt: '2 hours ago',
      actionType: 'pulse'
    },
    {
      id: '3',
      title: 'Reminder email scheduled for CNA Source X',
      description: 'Automated reminder emails scheduled for CNA candidates from Source X to reduce no-show rates',
      priority: 'medium',
      status: 'in_progress',
      assignedTo: 'recruiting@facility.com',
      dueDate: '6 hours from now',
      actionType: 'nudge'
    },
    {
      id: '4',
      title: 'Safety Alert - Harassment Complaint',
      description: 'Complaint contains "unsafe," "harassment," etc. Auto-Escalate to Compliance Officer',
      priority: 'critical',
      status: 'pending',
      assignedTo: 'compliance@facility.com',
      dueDate: 'Immediately',
      actionType: 'escalate'
    },
    {
      id: '5',
      title: 'High Performer Cohort Recognition',
      description: 'Retention forecast +10pts vs baseline - Send Encouragement Nudge',
      priority: 'low',
      status: 'completed',
      assignedTo: 'hr@facility.com',
      completedAt: '1 hour ago',
      actionType: 'nudge'
    }
  ];

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

  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case 'escalate':
        return 'warning';
      case 'pulse':
        return 'people';
      case 'nudge':
        return 'checkmark-circle';
      default:
        return 'time';
    }
  };

  const filteredActions = actions.filter(action => {
    const statusMatch = filter === 'all' || action.status === filter;
    const priorityMatch = priorityFilter === 'all' || action.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  const isOverdue = (dueDate: string) => {
    if (!dueDate || dueDate === 'Immediately') return false;
    // Simple overdue check - in real app would compare with actual dates
    return dueDate.includes('hours') && dueDate.includes('now');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Action Center</Text>
          <Text style={styles.subtitle}>
            {filteredActions.length} of {actions.length} actions
          </Text>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Status:</Text>
            <View style={styles.filterButtons}>
              {['all', 'pending', 'in_progress', 'completed'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterButton,
                    filter === status && styles.filterButtonActive
                  ]}
                  onPress={() => setFilter(status)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    filter === status && styles.filterButtonTextActive
                  ]}>
                    {status === 'all' ? 'All' : status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Priority:</Text>
            <View style={styles.filterButtons}>
              {['all', 'critical', 'high', 'medium', 'low'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.filterButton,
                    priorityFilter === priority && styles.filterButtonActive
                  ]}
                  onPress={() => setPriorityFilter(priority)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    priorityFilter === priority && styles.filterButtonTextActive
                  ]}>
                    {priority === 'all' ? 'All' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Actions List */}
        {filteredActions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No actions match the current filters</Text>
          </View>
        ) : (
          <View style={styles.actionsList}>
            {filteredActions.map((action) => (
              <View 
                key={action.id} 
                style={[
                  styles.actionCard,
                  isOverdue(action.dueDate) && styles.actionCardOverdue
                ]}
              >
                <View style={styles.actionHeader}>
                  <View style={styles.actionInfo}>
                    <Ionicons 
                      name={getActionTypeIcon(action.actionType)} 
                      size={20} 
                      color={getPriorityColor(action.priority)} 
                    />
                    <View style={styles.actionDetails}>
                      <Text style={styles.actionTitle}>{action.title}</Text>
                      <Text style={styles.actionDescription}>{action.description}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.actionBadges}>
                    <View style={[
                      styles.priorityBadge, 
                      { backgroundColor: getPriorityColor(action.priority) + '20' }
                    ]}>
                      <Text style={[
                        styles.priorityText, 
                        { color: getPriorityColor(action.priority) }
                      ]}>
                        {action.priority}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: getStatusColor(action.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.statusText, 
                        { color: getStatusColor(action.status) }
                      ]}>
                        {action.status}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.actionFooter}>
                  <View style={styles.actionMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="person" size={16} color="#7691A4" />
                      <Text style={styles.metaText}>{action.assignedTo}</Text>
                    </View>
                    <View style={[
                      styles.metaItem,
                      isOverdue(action.dueDate) && styles.metaItemOverdue
                    ]}>
                      <Ionicons name="calendar" size={16} color={isOverdue(action.dueDate) ? "#EF4444" : "#7691A4"} />
                      <Text style={[
                        styles.metaText,
                        isOverdue(action.dueDate) && styles.metaTextOverdue
                      ]}>
                        {action.status === 'completed' ? `Completed ${action.completedAt}` : `Due: ${action.dueDate}`}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.actionButtons}>
                    {action.status === 'pending' && (
                      <TouchableOpacity style={styles.startButton}>
                        <Text style={styles.startButtonText}>Start</Text>
                      </TouchableOpacity>
                    )}
                    {action.status === 'in_progress' && (
                      <TouchableOpacity style={styles.completeButton}>
                        <Text style={styles.completeButtonText}>Complete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
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
  mainContainer: {
    backgroundColor: 'rgba(244,244,244,0.6)',
    borderRadius: 20,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PIPELINE_DARK,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: PIPELINE_GRAY,
  },
  filtersContainer: {
    marginBottom: 24,
    gap: 16,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: PIPELINE_DARK,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: PIPELINE_BLUE,
  },
  filterButtonText: {
    fontSize: 14,
    color: PIPELINE_GRAY,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: 'white',
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionCardOverdue: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  actionInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  actionDetails: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PIPELINE_DARK,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: PIPELINE_GRAY,
    lineHeight: 20,
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
  actionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionMeta: {
    flex: 1,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaItemOverdue: {
    // Additional styling for overdue items
  },
  metaText: {
    fontSize: 14,
    color: PIPELINE_GRAY,
  },
  metaTextOverdue: {
    color: '#EF4444',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  startButton: {
    backgroundColor: '#E9F1FF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  startButtonText: {
    color: PIPELINE_BLUE,
    fontSize: 14,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  completeButtonText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
});

export default ActionCenterScreen;


