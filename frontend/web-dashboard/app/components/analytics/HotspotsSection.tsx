import React from 'react';
import { Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface HotspotData {
  sentiment: number;
  participation: number;
  retention: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface HotspotsSectionProps {
  data: {
    rehab: HotspotData;
    memoryCare: HotspotData;
    icu: HotspotData;
    surgical: HotspotData;
  };
}

const HotspotsSection: React.FC<HotspotsSectionProps> = ({ data }) => {
  const getRiskConfig = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          icon: CheckCircle,
        };
      case 'medium':
        return {
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          icon: AlertTriangle,
        };
      case 'high':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          icon: AlertTriangle,
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          icon: AlertTriangle,
        };
    }
  };

  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'Low Risk';
      case 'medium':
        return 'Medium Risk';
      case 'high':
        return 'High Risk';
      default:
        return 'Unknown Risk';
    }
  };

  const HotspotCard: React.FC<{ title: string; data: HotspotData }> = ({ title, data }) => {
    const riskConfig = getRiskConfig(data.riskLevel);
    const Icon = riskConfig.icon;

    return (
      <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-5 h-[240px] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-5 flex-shrink-0">
          <h3 className="text-lg font-medium text-[#01253F] leading-tight">{title}</h3>
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${riskConfig.bgColor} ${riskConfig.textColor}`}>
            <Icon className="w-3 h-3" />
            {getRiskLabel(data.riskLevel)}
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-4 flex-1 flex flex-col justify-center">
          {/* Sentiment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700">Sentiment</span>
                <Info className="w-3 h-3 text-gray-400 cursor-help" />
              </div>
              <span className="text-sm font-medium text-gray-900">{data.sentiment}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-blue-400"
                style={{ width: `${data.sentiment}%` }}
              ></div>
            </div>
          </div>

          {/* Participation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700">Participation</span>
                <Info className="w-3 h-3 text-gray-400 cursor-help" />
              </div>
              <span className="text-sm font-medium text-gray-900">{data.participation}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-blue-400"
                style={{ width: `${data.participation}%` }}
              ></div>
            </div>
          </div>

          {/* Retention */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-700">Retention</span>
                <Info className="w-3 h-3 text-gray-400 cursor-help" />
              </div>
              <span className="text-sm font-medium text-gray-900">{data.retention}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-blue-400"
                style={{ width: `${data.retention}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[25px] font-bold leading-[34px] text-[#01253F] font-avenir">Hotspots</h2>
      </div>
      
      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top Row */}
        <HotspotCard title="Rehab" data={data.rehab} />
        <HotspotCard title="Memory Care" data={data.memoryCare} />
        
        {/* Bottom Row */}
        <HotspotCard title="ICU" data={data.icu} />
        <HotspotCard title="Surgical" data={data.surgical} />
      </div>
    </div>
  );
};

export default HotspotsSection;
