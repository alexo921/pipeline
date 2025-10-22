import React from 'react';
import { AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  type?: 'manual' | 'auto';
  status?: string;
  icon?: 'warning' | 'info' | 'success';
  priority?: 'high' | 'medium' | 'low';
  manualStatus?: string;
  autoStatus?: string;
  [key: string]: any;
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
  onEscalate?: (item: ActionItem) => void;
  expandedActionId?: string;
  onExpandAction?: (id: string) => void;
  onViewCompletedTasks?: (category?: string) => void;
  onToggleActionType?: (id: string) => void;
  onToggleAutomationMode?: (modeName: string) => void;
  isCompletedTasksOpen?: boolean;
}

const ActionCenter: React.FC<ActionCenterProps> = ({ 
  actionItems, 
  automationModes, 
  completedTasks,
  onEscalate,
  expandedActionId,
  onExpandAction,
  onViewCompletedTasks,
  onToggleActionType,
  onToggleAutomationMode,
  isCompletedTasksOpen
}) => {
  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'warning':
        return (
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFC7C8' }}>
            <AlertTriangle className="w-4 h-4 text-gray-800" />
          </div>
        );
      case 'info':
        return (
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#91D7DE' }}>
            <Info className="w-4 h-4 text-gray-800" />
          </div>
        );
      case 'success':
        return (
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#91D7DE' }}>
            <CheckCircle className="w-4 h-4 text-gray-800" />
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FDD6BD' }}>
            <Info className="w-4 h-4 text-gray-800" />
          </div>
        );
    }
  };

  const getTypeBadge = (type: string, onToggle?: () => void) => {
    const isAuto = type === 'auto';
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle?.();
        }}
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium leading-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#2CB3BF] ${
          isAuto
            ? 'bg-green-100 text-green-800 hover:bg-green-200'
            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
        }`}
        aria-pressed={isAuto}
      >
        {isAuto ? 'Auto' : 'Manual'}
      </button>
    );
  };

  const automationLength = (automationModes || []).length;
  const completedLength = (completedTasks || []).length;

  return (
    <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[25px] font-bold leading-[34px] text-[#01253F] font-avenir">Action Center</h2>
      </div>
      
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left Side - Action Items List */}
        <div className="xl:w-2/3 w-full">
          <div className="space-y-2.5">
            {(actionItems || []).map((item) => {
              const itemType: 'manual' | 'auto' = item.type ?? 'manual';
              const itemStatus = item.status ?? (itemType === 'manual' ? (item.manualStatus ?? 'Escalate') : (item.autoStatus ?? 'Automated'));
              const itemIconType: 'warning' | 'info' | 'success' = item.icon ?? (itemType === 'manual' ? 'warning' : 'info');
              const isExpanded = expandedActionId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => onExpandAction?.(item.id)}
                  className={`bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4 cursor-pointer transition-all duration-300 hover:bg-[#F3F3F3] ${
                    isExpanded ? 'scale-[1.02] border-[#2CB3BF]' : ''
                  }`}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 pr-2">
                        <div className="flex flex-wrap items-baseline gap-3 mb-2">
                          <h3 className="text-lg font-medium text-[#01253F]">{item.title}</h3>
                        </div>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <div className="flex-shrink-0">{getIcon(itemIconType)}</div>
                    </div>

                    {isExpanded && (
                      <div className="text-xs text-gray-500 bg-[#F3F3F3] rounded-lg p-3">
                        Deeper insights coming soon. This preview highlights why the action was flagged and which team owns the next step.
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-4 pt-3">
                      {getTypeBadge(itemType, () => onToggleActionType?.(item.id))}
                      {itemType === 'manual' ? (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onEscalate?.(item);
                          }}
                          className="px-3 py-1.5 bg-[#2CB3BF] text-white text-xs font-semibold rounded-md shadow transition-transform hover:-translate-y-0.5 hover:bg-[#27a6b2]"
                        >
                          {itemStatus}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 text-xs font-medium text-[#A1ACB3]">
                          <Clock className="w-4 h-4" />
                          <span>{itemStatus}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side - Automation Modes & Completed Tasks */}
        <div className="xl:w-1/3 w-full space-y-4">
          {/* Automation Modes */}
          <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4">
            <h3 className="text-lg font-medium text-[#01253F] mb-4">Automation Modes</h3>
            <div className="space-y-0">
              {(automationModes || []).map((mode, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-2 -mx-2 transition-colors hover:bg-[#F3F3F3]"
                  style={{ borderBottom: index === (automationLength - 1) ? 'none' : '0.5px solid #F3F3F3' }}
                >
                  <span className="text-sm font-medium text-gray-700">{mode.name}</span>
                  <button
                    type="button"
                    onClick={() => onToggleAutomationMode?.(mode.name)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#2CB3BF] ${
                      mode.status === 'auto' 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    {mode.status === 'auto' ? 'Auto' : 'Manual'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4">
            <h3 className="text-lg font-medium text-[#01253F] mb-4">Completed Tasks</h3>
            <div className="space-y-0 mb-4">
              {(completedTasks || []).map((task, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between py-2 px-2 -mx-2 transition-colors cursor-pointer ${
                    isCompletedTasksOpen ? 'bg-[#F3F3F3] rounded-md' : 'hover:bg-[#F3F3F3]'
                  }`}
                  style={{ borderBottom: index === (completedLength - 1) ? 'none' : '0.5px solid #F3F3F3' }}
                  onClick={() => onViewCompletedTasks?.(task.category)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onViewCompletedTasks?.(task.category);
                    }
                  }}
                >
                  <span className="text-sm font-medium text-gray-700">{task.category}</span>
                  <span className="text-sm font-semibold text-[#01253F]">{task.count} actions</span>
                </div>
              ))}
            </div>
            <button
              onClick={onViewCompletedTasks}
              className={`w-full px-4 py-2 rounded-md transition-colors text-sm ${
                isCompletedTasksOpen
                  ? 'bg-[#2CB3BF] text-white shadow'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isCompletedTasksOpen ? 'Hide Completed Tasks' : 'View All Completed Tasks'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionCenter;
