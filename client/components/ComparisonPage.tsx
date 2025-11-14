import React from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, SPACING_SCALE } from '../utils/designSystem';

export default function ComparisonPage() {
  const navigate = useNavigate();

  return (
    <main
      className="max-w-6xl mx-auto transition-all duration-150 ease-out px-4 sm:px-6 md:px-8 lg:px-[16px]"
      style={{
        paddingTop: `${SPACING_SCALE.md}px`,
        paddingBottom: `${SPACING_SCALE.md}px`,
      }}
    >
      <div className="w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            ギア比較
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            ギアアイテムを比較して最適な選択をサポートします。
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              🚧 このページは現在開発中です（Phase 1実装予定）
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: COLORS.primary[600],
              color: COLORS.white
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.primary[700];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.primary[600];
            }}
          >
            ホームに戻る
          </button>
        </div>
      </div>
    </main>
  );
}
