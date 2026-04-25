import React from 'react';
import { ChartViewMode } from '../utils/types';
import Card from './ui/Card';
import { formatWeight } from '../utils/weightUnit';
import { useWeightUnit } from '../contexts/WeightUnitContext';

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
  const { unit } = useWeightUnit();
  const stats = [
    {
      label: 'Total Weight',
      value: formatWeight(totals.weight, unit),
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
        <h3 className="text-xs font-semibold" style={{ color: 'var(--ink-primary)' }}>
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
              className={`flex flex-col items-center justify-center group transition-all duration-200 p-2 rounded-control border ${
                isClickable ? 'cursor-pointer hover:scale-105' : ''
              }`}
              style={{
                background: isSelected ? 'var(--surface-level-2)' : 'var(--surface-level-1)',
                borderColor: isSelected ? 'var(--stroke-strong)' : 'transparent',
              }}
              onClick={() => {
                if (stat.mode && onViewModeChange) {
                  onViewModeChange(stat.mode);
                }
              }}
            >
              <div className="flex items-center space-x-1 mb-0.5">
                <span
                  className={`text-2xs font-bold w-4 h-4 flex items-center justify-center rounded-control transition-all duration-200 ${
                    isClickable ? 'group-hover:scale-110' : ''
                  }`}
                  style={{
                    background: 'var(--mondrian-black)',
                    color: 'var(--ink-inverse)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {stat.icon}
                </span>
                <span className="text-2xs font-medium" style={{ color: 'var(--ink-muted)' }}>
                  {stat.label}
                </span>
              </div>
              <div
                className={`text-sm font-bold transition-all duration-200 ${
                  isClickable ? 'group-hover:scale-110' : ''
                }`}
                style={{ color: 'var(--ink-secondary)' }}
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
