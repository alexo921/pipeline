import React from 'react';

export interface RetentionForecastData {
  percentage30d: number;
  percentage60d: number;
  percentage90d: number;
  trend: 'up' | 'down' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface NoShowRiskData {
  flaggedCount: number;
  totalCandidates: number;
  riskPercentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TurnoverCostData {
  estimatedSavings: number;
  hiresRetained: number;
  timeSaved: number;
  roi: number;
}

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  riskLevel?: 'low' | 'medium' | 'high';
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  trend,
  riskLevel,
  className = ''
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <span className="text-green-500">↗</span>;
      case 'down':
        return <span className="text-red-500">↘</span>;
      default:
        return <span className="text-gray-500">→</span>;
    }
  };

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <div className={`bg-white rounded-[16px] shadow-[0px_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 p-4 h-[180px] w-full ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-medium text-[#01253F] leading-tight">{title}</h3>
        {trend && (
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
          </div>
        )}
      </div>
      
      <div className="flex items-baseline justify-start mb-2 mt-8">
        <span className={`text-3xl font-bold ${riskLevel ? getRiskColor() : 'text-[#01253F]'}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>
      
      {subtitle && (
        <div className="text-xs text-gray-600">
          {subtitle}
        </div>
      )}
    </div>
  );
};

interface RetentionForecastCardProps {
  data: RetentionForecastData;
}

export const RetentionForecastCard: React.FC<RetentionForecastCardProps> = ({ data }) => {
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  
  return (
    <KPICard
      title="Retention Forecast"
      value={formatPercentage(data.percentage30d)}
      subtitle={`${formatPercentage(data.percentage60d)} 60d, ${formatPercentage(data.percentage90d)} 90d`}
      trend={data.trend}
      riskLevel={data.riskLevel}
    />
  );
};

interface NoShowRiskCardProps {
  data: NoShowRiskData;
}

export const NoShowRiskCard: React.FC<NoShowRiskCardProps> = ({ data }) => {
  return (
    <KPICard
      title="No-Show Risk"
      value={data.flaggedCount}
      subtitle={`${data.riskPercentage.toFixed(1)}% of ${data.totalCandidates} candidates flagged`}
      trend={data.trend}
      riskLevel={data.riskPercentage > 20 ? 'high' : data.riskPercentage > 10 ? 'medium' : 'low'}
    />
  );
};

interface TurnoverCostCardProps {
  data: TurnoverCostData;
}

export const TurnoverCostCard: React.FC<TurnoverCostCardProps> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <KPICard
      title="Turnover Cost Avoided"
      value={formatCurrency(data.estimatedSavings)}
      subtitle={`${data.hiresRetained} hires retained, ${data.timeSaved} hrs saved`}
      trend="up"
      riskLevel="low"
    />
  );
};
