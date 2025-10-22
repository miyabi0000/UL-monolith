import React from 'react';
import { COLORS } from '../utils/designSystem';
import { ChartViewMode } from '../utils/types';
import Card from './ui/Card';

interface CompactSummaryProps {
  totals: {
    weight: number;
    price: number;
    items: number;
    missing: number;
  };
  viewMode?: ChartViewMode;
  onViewModeChange?: (mode: ChartViewMode) => void;
}

const CompactSummary: React.FC<CompactSummaryProps> = ({ totals, viewMode = 'weight', onViewModeChange }) => {
  const stats = [
    {
      label: 'Total Weight',
      value: `${totals.weight}g`,
      color: COLORS.primary.dark,
      icon: 'W',
      mode: 'weight' as ChartViewMode
    },
    {
      label: 'Total Cost',
      value: `¥${Math.round(totals.price / 100).toLocaleString()}`,
      color: COLORS.primary.medium,
      icon: '¥',
      mode: 'cost' as ChartViewMode
    },
    {
      label: 'Items',
      value: totals.items.toString(),
      color: COLORS.text.primary,
      icon: '#',
      mode: null
    }
  ];

  return (
    <Card variant="square" hover className="p-2">
      <div className="mb-2">
        <h3
          className="text-xs font-semibold"
          style={{ color: COLORS.text.primary }}
        >
          Pack Summary
        </h3>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat, index) => {
          const isSelected = stat.mode && viewMode === stat.mode;
          const isClickable = stat.mode !== null && onViewModeChange;
          
          return (
            <div
              key={index}
              className={`flex flex-col items-center justify-center group transition-all duration-200 p-2 rounded-lg ${
                isClickable ? 'cursor-pointer hover:scale-105' : ''
              }`}
              style={{
                backgroundColor: isSelected ? `${stat.color}30` : `${stat.color}10`,
                border: isSelected ? `2px solid ${stat.color}` : '2px solid transparent'
              }}
              onClick={() => {
                if (stat.mode && onViewModeChange) {
                  onViewModeChange(stat.mode);
                }
              }}
            >
              <div className="flex items-center space-x-1 mb-0.5">
                <span
                  className={`text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded shadow-sm transition-all duration-200 ${
                    isClickable ? 'group-hover:scale-110' : ''
                  }`}
                  style={{
                    backgroundColor: stat.color,
                    color: COLORS.white
                  }}
                >
                  {stat.icon}
                </span>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: COLORS.text.secondary }}
                >
                  {stat.label}
                </span>
              </div>
              <div
                className={`text-sm font-bold transition-all duration-200 ${
                  isClickable ? 'group-hover:scale-110' : ''
                }`}
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default CompactSummary;
