import React, { useState } from 'react';
import { MapPin, Users, AlertTriangle, CheckCircle } from 'lucide-react';

export interface HotspotData {
  unit: string;
  role: string;
  sentimentScore: number;
  retentionForecast: number;
  participationRate: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface HotspotMatrixProps {
  hotspots: HotspotData[];
  type: 'unit' | 'role';
}

export const HotspotMatrix: React.FC<HotspotMatrixProps> = ({ hotspots, type }) => {
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotData | null>(null);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getHeatmapColor = (value: number, max: number = 100) => {
    const intensity = value / max;
    if (intensity >= 0.8) return 'bg-red-500';
    if (intensity >= 0.6) return 'bg-orange-400';
    if (intensity >= 0.4) return 'bg-yellow-400';
    if (intensity >= 0.2) return 'bg-green-400';
    return 'bg-green-500';
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  if (hotspots.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-[#01253F] mb-6">Hotspots</h2>
        <div className="text-center py-8 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No hotspot data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-[#01253F] mb-6">
        {type === 'unit' ? 'Unit Hotspots' : 'Role Hotspots'}
      </h2>
      
      <div className="grid grid-cols-2 gap-4">
        {hotspots.map((hotspot, index) => (
          <div
            key={`${hotspot.unit}-${hotspot.role}-${index}`}
            className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${getRiskColor(hotspot.riskLevel)}`}
            onClick={() => setSelectedHotspot(hotspot)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-[#01253F]">
                  {type === 'unit' ? hotspot.unit : hotspot.role}
                </h3>
                {type === 'unit' && (
                  <p className="text-sm text-gray-600">{hotspot.role}</p>
                )}
              </div>
              {getRiskIcon(hotspot.riskLevel)}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sentiment</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getHeatmapColor(hotspot.sentimentScore * 100)}`}></div>
                  <span className="text-sm font-medium">{formatPercentage(hotspot.sentimentScore * 100)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Retention</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getHeatmapColor(hotspot.retentionForecast)}`}></div>
                  <span className="text-sm font-medium">{formatPercentage(hotspot.retentionForecast)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Participation</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getHeatmapColor(hotspot.participationRate)}`}></div>
                  <span className="text-sm font-medium">{formatPercentage(hotspot.participationRate)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Hotspot Detail Modal */}
      {selectedHotspot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-[#01253F]">
                {type === 'unit' ? selectedHotspot.unit : selectedHotspot.role} Details
              </h3>
              <button
                onClick={() => setSelectedHotspot(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-[#01253F]">
                    {formatPercentage(selectedHotspot.sentimentScore * 100)}
                  </div>
                  <div className="text-sm text-gray-600">Sentiment Score</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-[#01253F]">
                    {formatPercentage(selectedHotspot.retentionForecast)}
                  </div>
                  <div className="text-sm text-gray-600">Retention Forecast</div>
                </div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-[#01253F]">
                  {formatPercentage(selectedHotspot.participationRate)}
                </div>
                <div className="text-sm text-gray-600">Participation Rate</div>
              </div>
              
              <div className="flex items-center justify-center space-x-2">
                {getRiskIcon(selectedHotspot.riskLevel)}
                <span className="font-medium capitalize">{selectedHotspot.riskLevel} Risk</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
