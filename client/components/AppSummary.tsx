import React from 'react';

interface AppSummaryProps {
  totals: {
    weight: number;
    price: number;
    items: number;
    missing: number;
  };
  successMessage: string;
}

const AppSummary: React.FC<AppSummaryProps> = ({ totals, successMessage }) => {
  return (
    <>
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-green-600 dark:text-green-300 text-sm">{successMessage}</p>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">総重量</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totals.weight}g</div>
        </div>
        <div className="card p-4 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">総価格</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">¥{Math.round(totals.price / 100).toLocaleString()}</div>
        </div>
        <div className="card p-4 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">アイテム数</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totals.items}</div>
        </div>
        <div className="card p-4 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">不足数</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{totals.missing}</div>
        </div>
      </div>
    </>
  );
};

export default AppSummary;