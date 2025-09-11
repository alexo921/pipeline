import React from 'react';
import { Calendar, Users, TrendingUp, TrendingDown } from 'lucide-react';

export interface CohortData {
  cohort: string;
  totalHires: number;
  retention30d: number;
  retention60d: number;
  retention90d: number;
  predictedRetention: number;
  actualRetention?: number;
}

export interface FunnelMetrics {
  applicants: number;
  interviews: number;
  offers: number;
  hires: number;
  retention30d: number;
  retention60d: number;
  retention90d: number;
}

interface CohortAnalysisProps {
  cohorts: CohortData[];
  funnelMetrics: FunnelMetrics;
}

export const CohortAnalysis: React.FC<CohortAnalysisProps> = ({ cohorts, funnelMetrics }) => {
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getRetentionColor = (value: number) => {
    if (value >= 70) return 'text-green-600';
    if (value >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRetentionIcon = (predicted: number, actual?: number) => {
    if (!actual) return null;
    if (actual > predicted) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (actual < predicted) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-[#01253F] mb-6">Cohorts & Funnels</h2>
      
      {/* Funnel Metrics */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-[#01253F] mb-4">Hiring Funnel</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-[#01253F]">{funnelMetrics.applicants}</div>
            <div className="text-sm text-gray-600">Applicants</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-[#01253F]">{funnelMetrics.interviews}</div>
            <div className="text-sm text-gray-600">Interviews</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-[#01253F]">{funnelMetrics.offers}</div>
            <div className="text-sm text-gray-600">Offers</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-[#01253F]">{funnelMetrics.hires}</div>
            <div className="text-sm text-gray-600">Hires</div>
          </div>
        </div>
        
        {/* Retention Metrics */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className={`text-xl font-bold ${getRetentionColor(funnelMetrics.retention30d)}`}>
              {formatPercentage(funnelMetrics.retention30d)}
            </div>
            <div className="text-sm text-gray-600">30d Retention</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className={`text-xl font-bold ${getRetentionColor(funnelMetrics.retention60d)}`}>
              {formatPercentage(funnelMetrics.retention60d)}
            </div>
            <div className="text-sm text-gray-600">60d Retention</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className={`text-xl font-bold ${getRetentionColor(funnelMetrics.retention90d)}`}>
              {formatPercentage(funnelMetrics.retention90d)}
            </div>
            <div className="text-sm text-gray-600">90d Retention</div>
          </div>
        </div>
      </div>

      {/* Cohort Analysis */}
      <div>
        <h3 className="text-lg font-semibold text-[#01253F] mb-4">Cohort Analysis</h3>
        
        {cohorts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No cohort data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-[#01253F]">Cohort</th>
                  <th className="text-center py-3 px-4 font-semibold text-[#01253F]">Total Hires</th>
                  <th className="text-center py-3 px-4 font-semibold text-[#01253F]">30d</th>
                  <th className="text-center py-3 px-4 font-semibold text-[#01253F]">60d</th>
                  <th className="text-center py-3 px-4 font-semibold text-[#01253F]">90d</th>
                  <th className="text-center py-3 px-4 font-semibold text-[#01253F]">Predicted</th>
                  <th className="text-center py-3 px-4 font-semibold text-[#01253F]">Actual</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((cohort, index) => (
                  <tr key={cohort.cohort} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-3 px-4 font-medium text-[#01253F]">{cohort.cohort}</td>
                    <td className="py-3 px-4 text-center">{cohort.totalHires}</td>
                    <td className={`py-3 px-4 text-center font-semibold ${getRetentionColor(cohort.retention30d)}`}>
                      {formatPercentage(cohort.retention30d)}
                    </td>
                    <td className={`py-3 px-4 text-center font-semibold ${getRetentionColor(cohort.retention60d)}`}>
                      {formatPercentage(cohort.retention60d)}
                    </td>
                    <td className={`py-3 px-4 text-center font-semibold ${getRetentionColor(cohort.retention90d)}`}>
                      {formatPercentage(cohort.retention90d)}
                    </td>
                    <td className={`py-3 px-4 text-center font-semibold ${getRetentionColor(cohort.predictedRetention)}`}>
                      {formatPercentage(cohort.predictedRetention)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {cohort.actualRetention && (
                          <>
                            <span className={`font-semibold ${getRetentionColor(cohort.actualRetention)}`}>
                              {formatPercentage(cohort.actualRetention)}
                            </span>
                            {getRetentionIcon(cohort.predictedRetention, cohort.actualRetention)}
                          </>
                        )}
                        {!cohort.actualRetention && (
                          <span className="text-gray-400 text-sm">TBD</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
