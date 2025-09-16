import React from 'react';
import { COLORS } from '../utils/colors';

interface CompactSummaryProps {
  totals: {
    weight: number;
    price: number;
    items: number;
    missing: number;
  };
}

const CompactSummary: React.FC<CompactSummaryProps> = ({ totals }) => {
  const stats = [
    {
      label: '総重量',
      value: `${totals.weight}g`,
      color: COLORS.primary.dark,
      icon: 'W'
    },
    {
      label: '総価格',
      value: `¥${Math.round(totals.price / 100).toLocaleString()}`,
      color: COLORS.primary.medium,
      icon: '¥'
    },
    {
      label: 'アイテム数',
      value: totals.items.toString(),
      color: COLORS.text.primary,
      icon: '#'
    },
    {
      label: '不足数',
      value: totals.missing.toString(),
      color: totals.missing > 0 ? COLORS.accent : COLORS.primary.medium,
      icon: totals.missing > 0 ? '!' : '✓'
    }
  ];

  return (
    <div 
      className="rounded-lg border p-4 space-y-4"
      style={{ 
        backgroundColor: COLORS.white,
        borderColor: COLORS.primary.medium
      }}
    >
      <h3 
        className="text-sm font-semibold mb-3 border-b pb-2"
        style={{ 
          color: COLORS.text.primary,
          borderBottomColor: COLORS.primary.light
        }}
      >
STATS
      </h3>
      <div className="space-y-3">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span 
                className="text-xs font-bold w-4 h-4 flex items-center justify-center rounded"
                style={{ 
                  backgroundColor: stat.color,
                  color: COLORS.white 
                }}
              >
                {stat.icon}
              </span>
              <span 
                className="text-xs font-medium"
                style={{ color: COLORS.text.secondary }}
              >
                {stat.label}
              </span>
            </div>
            <div 
              className="text-base font-bold"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompactSummary;