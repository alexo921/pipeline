import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

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
  expandedHotspotId?: string;
  onExpandHotspot?: (id: string) => void;
}

const HotspotsSection: React.FC<HotspotsSectionProps> = ({ data, expandedHotspotId, onExpandHotspot }) => {
  const getRiskConfig = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return {
          bgColor: '#91D7DE',
          textColor: 'text-gray-800',
          icon: CheckCircle,
        };
      case 'medium':
        return {
          bgColor: '#FDD6BD',
          textColor: 'text-gray-800',
          icon: AlertTriangle,
        };
      case 'high':
        return {
          bgColor: '#FFC7C8',
          textColor: 'text-gray-800',
          icon: AlertTriangle,
        };
      default:
        return {
          bgColor: '#FDD6BD',
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

  const HotspotCard: React.FC<{ title: string; data: HotspotData; id: string }> = ({ title, data, id }) => {
    const riskConfig = getRiskConfig(data.riskLevel);
    const Icon = riskConfig.icon;
    const isExpanded = expandedHotspotId === id;

    return (
      <div
        onClick={() => onExpandHotspot?.(id)}
        className={`relative bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-5 min-h-[240px] flex flex-col cursor-pointer transition-all duration-300 hover:bg-[#F3F3F3] origin-center ${
          isExpanded ? 'scale-[1.04] border-[#2CB3BF] z-10' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5 flex-shrink-0">
          <h3 className="text-lg font-semibold text-[#01253F] leading-tight">{title}</h3>
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-gray-800"
            style={{ backgroundColor: riskConfig.bgColor }}
          >
            <span>{getRiskLabel(data.riskLevel)}</span>
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-4 flex-1 flex flex-col justify-center">
          {/* Sentiment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">Sentiment</span>
              <span className="text-sm font-semibold text-gray-900">{data.sentiment}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full"
                style={{ width: `${data.sentiment}%`, background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' }}
              ></div>
            </div>
          </div>

          {/* Participation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">Participation</span>
              <span className="text-sm font-semibold text-gray-900">{data.participation}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full"
                style={{ width: `${data.participation}%`, background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' }}
              ></div>
            </div>
          </div>

          {/* Retention */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">Retention</span>
              <span className="text-sm font-semibold text-gray-900">{data.retention}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full"
                style={{ width: `${data.retention}%`, background: 'linear-gradient(115.61deg, #E9D7F4 25.46%, #97B3FB 75.57%)' }}
              ></div>
            </div>
          </div>
        </div>

        <div
          className={`text-xs text-gray-500 transition-all duration-300 overflow-hidden ${
            isExpanded ? 'mt-4 opacity-100 max-h-24' : 'mt-0 opacity-0 max-h-0'
          }`}
        >
          Additional hotspot diagnostics will surface here, including sentiment snippets and recommended playbooks.
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[rgba(244,244,244,0.6)] rounded-lg lg:rounded-xl xl:rounded-[20px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] p-6 overflow-visible">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[25px] font-bold leading-[34px] text-[#01253F] font-avenir">Hotspots</h2>
      </div>
      
      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-4 overflow-visible">
        {/* Top Row */}
        <HotspotCard title="Rehab" data={data.rehab} id="rehab" />
        <HotspotCard title="Memory Care" data={data.memoryCare} id="memoryCare" />
        
        {/* Bottom Row */}
        <HotspotCard title="ICU" data={data.icu} id="icu" />
        <HotspotCard title="Surgical" data={data.surgical} id="surgical" />
      </div>
    </div>
  );
};

export default HotspotsSection;
