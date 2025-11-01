import React from 'react';
import Card from './ui/Card';

interface AppSummaryProps {
  totals: {
    weight: number;
    price: number;
    items: number;
    missing: number;
  };
}

const AppSummary: React.FC<AppSummaryProps> = ({ totals }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card variant="default" className="p-3">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">総重量</div>
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{totals.weight}g</div>
      </Card>
      <Card variant="default" className="p-3">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">総価格</div>
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">¥{Math.round(totals.price / 100).toLocaleString()}</div>
      </Card>
      <Card variant="default" className="p-3">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">アイテム数</div>
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{totals.items}</div>
      </Card>
      <Card variant="default" className="p-3">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">不足数</div>
        <div className="text-xl font-bold text-red-600 dark:text-red-400">{totals.missing}</div>
      </Card>
    </div>
  );
};

export default AppSummary;