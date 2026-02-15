import React from 'react';
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
      icon: 'W',
      mode: 'weight' as ChartViewMode
    },
    {
      label: 'Total Cost',
      value: `¥${Math.round(totals.price / 100).toLocaleString()}`,
      icon: '¥',
      mode: 'cost' as ChartViewMode
    },
    {
      label: 'Items',
      value: totals.items.toString(),
      icon: '#',
      mode: null
    }
  ];

  return (
    <Card hover className="p-2">
      <div className="mb-2">
        <h3 className="text-xs font-semibold text-gray-900">
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
              className={`flex flex-col items-center justify-center group transition-all duration-200 p-2 rounded-lg border-2 ${
                isClickable ? 'cursor-pointer hover:scale-105' : ''
              } ${
                isSelected 
                  ? 'bg-gray-200 border-gray-600' 
                  : 'bg-gray-50 border-transparent'
              }`}
              onClick={() => {
                if (stat.mode && onViewModeChange) {
                  onViewModeChange(stat.mode);
                }
              }}
            >
              <div className="flex items-center space-x-1 mb-0.5">
                <span
                  className={`text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded shadow-sm transition-all duration-200 text-white bg-gray-600 ${
                    isClickable ? 'group-hover:scale-110' : ''
                  }`}
                >
                  {stat.icon}
                </span>
                <span className="text-[10px] font-medium text-gray-500">
                  {stat.label}
                </span>
              </div>
              <div
                className={`text-sm font-bold transition-all duration-200 text-gray-700 ${
                  isClickable ? 'group-hover:scale-110' : ''
                }`}
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
