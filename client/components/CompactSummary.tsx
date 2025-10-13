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
      label: 'Total Weight',
      value: `${totals.weight}g`,
      color: COLORS.primary.dark,
      icon: 'W'
    },
    {
      label: 'Total Cost',
      value: `¥${Math.round(totals.price / 100).toLocaleString()}`,
      color: COLORS.primary.medium,
      icon: '¥'
    },
    {
      label: 'Items',
      value: totals.items.toString(),
      color: COLORS.text.primary,
      icon: '#'
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
        {stats.map((stat, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center group transition-all duration-200 hover:scale-105 p-2 rounded-lg"
            style={{ backgroundColor: `${stat.color}10` }}
          >
            <div className="flex items-center space-x-1 mb-0.5">
              <span
                className="text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded shadow-sm transition-all duration-200 group-hover:scale-110"
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
              className="text-sm font-bold transition-all duration-200 group-hover:scale-110"
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