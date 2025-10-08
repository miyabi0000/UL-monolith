import React from 'react';
import { COLORS } from '../utils/designSystem';
import Card from './ui/Card';

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
    <Card variant="square" hover className="p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center group transition-all duration-200 hover:scale-105 p-3 rounded-lg"
            style={{ backgroundColor: `${stat.color}10` }}
          >
            <div className="flex items-center space-x-2 mb-1">
              <span
                className="text-xs font-bold w-5 h-5 flex items-center justify-center rounded shadow-sm transition-all duration-200 group-hover:scale-110"
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
              className="text-lg font-bold transition-all duration-200 group-hover:scale-110"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default CompactSummary;