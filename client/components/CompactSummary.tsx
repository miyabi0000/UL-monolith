import React from 'react';
import { COLORS } from '../utils/colors';
import { getSquareSeparatorStyle } from '../utils/colorHelpers';

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
      className="border p-4 space-y-3 transition-all duration-300 hover:shadow-lg"
      style={getSquareSeparatorStyle()}
    >
      <h3
        className="text-sm font-bold mb-3 border-b pb-2"
        style={{
          color: COLORS.text.primary,
          borderBottomColor: COLORS.primary.light
        }}
      >
        📊 STATS
      </h3>
      <div className="space-y-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="flex items-center justify-between group transition-all duration-200 hover:scale-105"
          >
            <div className="flex items-center space-x-3">
              <span
                className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg shadow-sm transition-all duration-200 group-hover:scale-110"
                style={{
                  backgroundColor: stat.color,
                  color: COLORS.white
                }}
              >
                {stat.icon}
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: COLORS.text.secondary }}
              >
                {stat.label}
              </span>
            </div>
            <div
              className="text-lg font-bold transition-all duration-200 group-hover:scale-110"
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