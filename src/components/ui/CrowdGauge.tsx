import React from 'react';
import { aiEngine } from '../../services/aiEngine';

interface CrowdGaugeProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  maxExpected?: number;
}

export const CrowdGauge: React.FC<CrowdGaugeProps> = ({
  count,
  size = 'md',
  showLabel = true,
  maxExpected = 40,
}) => {
  const crowdInfo = aiEngine.calculateCrowdLevel(count);

  const dimensions = {
    sm: { diameter: 48, stroke: 4, text: 'text-xs', labelText: 'text-[10px]' },
    md: { diameter: 80, stroke: 6, text: 'text-lg', labelText: 'text-xs' },
    lg: { diameter: 120, stroke: 9, text: 'text-2xl', labelText: 'text-sm' },
  };

  const { diameter, stroke, text, labelText } = dimensions[size];
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Percentage capped at 100%
  const percentage = Math.min(100, Math.round((count / maxExpected) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-1.5">
      <div className="relative flex items-center justify-center" style={{ width: diameter, height: diameter }}>
        <svg
          className="transform -rotate-90"
          width={diameter}
          height={diameter}
        >
          {/* Background circle */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            stroke="rgba(150, 215, 198, 0.3)"
            strokeWidth={stroke}
            fill="transparent"
          />
          {/* Animated progress circle */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            stroke={crowdInfo.color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-black font-mono text-[#1E3A3A] ${text}`}>
            {count}
          </span>
          {size === 'lg' && (
            <span className="text-[10px] text-[#5AA7A7] font-bold tracking-tight">
              PATIENTS
            </span>
          )}
        </div>
      </div>

      {showLabel && (
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: crowdInfo.color }}
          />
          <span
            className={`font-bold ${labelText}`}
            style={{ color: crowdInfo.color }}
          >
            {crowdInfo.label}
          </span>
        </div>
      )}
    </div>
  );
};
