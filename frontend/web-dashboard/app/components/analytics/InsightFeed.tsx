import React from 'react';
import { AlertTriangle, Info, CheckCircle, ArrowRight } from 'lucide-react';

export interface Action {
  id: string;
  type: 'escalate' | 'pulse' | 'nudge' | 'manual';
  title: string;
  description: string;
  actor: 'employer' | 'candidate';
  channel: 'email' | 'sms' | 'in_app' | 'notification';
  automationLevel: 'safe' | 'confirm' | 'manual';
}

export interface Insight {
  id: string;
  type: 'retention_drop' | 'sentiment_decline' | 'complaint_spike' | 'participation_drop';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  actions: Action[];
  data: any;
  generatedAt: Date;
}

interface InsightFeedProps {
  insights: Insight[];
  onActionClick?: (action: Action) => void;
}

export const InsightFeed: React.FC<InsightFeedProps> = ({ insights, onActionClick }) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'escalate':
        return <ArrowRight className="w-4 h-4" />;
      case 'pulse':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <ArrowRight className="w-4 h-4" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'escalate':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'pulse':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'nudge':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-[#01253F] mb-4">Insight Feed</h2>
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">No insights at this time. All systems are running smoothly!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[25px] font-bold leading-[34px] text-[#01253F] font-avenir">Insight Feed</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => console.log('Download insights')}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Download insights as CSV"
          >
            <ArrowRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                {getSeverityIcon(insight.severity)}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#01253F] mb-2">{insight.title}</h3>
                  <p className="text-sm text-gray-700 mb-4">{insight.description}</p>
                  
                  {insight.actions.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-600">
                        Suggested Actions:
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {insight.actions.map((action) => (
                          <button
                            key={action.id}
                            onClick={() => onActionClick?.(action)}
                            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${getActionColor(action.type)}`}
                          >
                            {getActionIcon(action.type)}
                            <span>{action.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                {new Date(insight.generatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
