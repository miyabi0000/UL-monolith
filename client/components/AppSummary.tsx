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
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600 text-sm">{successMessage}</p>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">総重量</div>
          <div className="text-2xl font-bold text-gray-900">{totals.weight}g</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">総価格</div>
          <div className="text-2xl font-bold text-gray-900">¥{Math.round(totals.price / 100).toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">アイテム数</div>
          <div className="text-2xl font-bold text-gray-900">{totals.items}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">不足数</div>
          <div className="text-2xl font-bold text-red-600">{totals.missing}</div>
        </div>
      </div>
    </>
  );
};

export default AppSummary;