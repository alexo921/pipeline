import React, { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, User, Calendar } from 'lucide-react';

export interface ActionItem {
  id: string;
  facilityId: string;
  employeeId?: string;
  actionType: string;
  category: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  employee?: {
    firstName: string;
    lastName: string;
    role: string;
    department?: string;
    unit?: string;
  };
  facility?: {
    name: string;
  };
}

interface ActionCenterProps {
  actions: ActionItem[];
  onStatusUpdate?: (actionId: string, status: string) => void;
}

export const ActionCenter: React.FC<ActionCenterProps> = ({ actions, onStatusUpdate }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const filteredActions = actions.filter(action => {
    const statusMatch = filter === 'all' || action.status === filter;
    const priorityMatch = priorityFilter === 'all' || action.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case 'escalate':
        return <AlertCircle className="w-4 h-4" />;
      case 'pulse':
        return <User className="w-4 h-4" />;
      case 'nudge':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const isOverdue = (dueDate?: Date) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && !actions.find(a => a.dueDate === dueDate)?.completedAt;
  };

  return (
    <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[25px] font-bold leading-[34px] text-[#01253F] font-avenir">Action Center</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {filteredActions.length} of {actions.length} actions
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Priority:</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Actions List */}
      {filteredActions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No actions match the current filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActions.map((action) => (
            <div
              key={action.id}
              className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${isOverdue(action.dueDate) ? 'border-red-300 bg-red-50' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  {getActionTypeIcon(action.actionType)}
                  <div>
                    <h3 className="text-lg font-bold text-[#01253F] mb-2">{action.title}</h3>
                    <p className="text-sm text-gray-700 mb-2">{action.description}</p>
                    {action.employee && (
                      <p className="text-xs text-gray-500">
                        Employee: {action.employee.firstName} {action.employee.lastName} ({action.employee.role})
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(action.priority)}`}>
                    {action.priority}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                    {action.status}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  {action.assignedTo && (
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{action.assignedTo}</span>
                    </div>
                  )}
                  {action.dueDate && (
                    <div className={`flex items-center space-x-1 ${isOverdue(action.dueDate) ? 'text-red-600' : ''}`}>
                      <Calendar className="w-4 h-4" />
                      <span>Due: {formatDate(action.dueDate)}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {action.status === 'pending' && (
                    <button
                      onClick={() => onStatusUpdate?.(action.id, 'in_progress')}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      Start
                    </button>
                  )}
                  {action.status === 'in_progress' && (
                    <button
                      onClick={() => onStatusUpdate?.(action.id, 'completed')}
                      className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
