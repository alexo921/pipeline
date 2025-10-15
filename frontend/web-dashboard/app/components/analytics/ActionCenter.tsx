import React from 'react';
import { AlertTriangle, CheckCircle, Info, Clock, User } from 'lucide-react';

interface ActionItem {
  id: string;
  title: string;
  description: string;
  type: 'manual' | 'auto';
  status: string;
  icon: 'warning' | 'info' | 'success';
  priority: 'high' | 'medium' | 'low';
}

interface AutomationMode {
  name: string;
  status: 'auto' | 'manual';
}

interface CompletedTask {
  category: string;
  count: number;
}

interface ActionCenterProps {
  actionItems: ActionItem[];
  automationModes: AutomationMode[];
  completedTasks: CompletedTask[];
}

const ActionCenter: React.FC<ActionCenterProps> = ({ 
  actionItems, 
  automationModes, 
  completedTasks 
}) => {
  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        type === 'auto' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-blue-100 text-blue-800'
      }`}>
        {type === 'auto' ? 'Auto' : 'Manual'}
      </span>
    );
  };

  return (
    <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[25px] font-bold leading-[34px] text-[#01253F] font-avenir">Action Center</h2>
      </div>
      
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left Side - Action Items List */}
        <div className="xl:w-2/3 w-full">
          <div className="space-y-4">
            {actionItems.map((item) => (
              <div key={item.id} className="bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getIcon(item.icon)}
                      <h3 className="text-lg font-medium text-[#01253F]">{item.title}</h3>
                      {getTypeBadge(item.type)}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                    <div className="flex items-center gap-2">
                      {item.type === 'manual' ? (
                        <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
                          Escalate to Supervisor
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Clock className="w-4 h-4" />
                          <span>{item.status}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {getIcon(item.icon)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Automation Modes & Completed Tasks */}
        <div className="xl:w-1/3 w-full space-y-4">
          {/* Automation Modes */}
          <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4">
            <h3 className="text-lg font-medium text-[#01253F] mb-4">Automation Modes</h3>
            <div className="space-y-2">
              {automationModes.map((mode, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{mode.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    mode.status === 'auto' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {mode.status === 'auto' ? 'Auto' : 'Manual'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4">
            <h3 className="text-lg font-medium text-[#01253F] mb-4">Completed Tasks</h3>
            <div className="space-y-2 mb-4">
              {completedTasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{task.category}</span>
                  <span className="text-sm font-medium text-[#01253F]">{task.count} actions</span>
                </div>
              ))}
            </div>
            <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm">
              View All Completed Tasks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionCenter;