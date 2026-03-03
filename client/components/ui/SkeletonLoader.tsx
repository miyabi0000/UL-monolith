import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'chart' | 'table' | 'card' | 'text' | 'circle';
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  variant = 'text',
  count = 1
}) => {
  const renderSkeletonContent = () => {
    if (variant === 'chart') {
      return (
        <div className="h-[300px] w-full flex items-center justify-center flex-col animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg shadow-sm">
          <div className="w-[120px] h-[120px] rounded-full bg-gray-300 dark:bg-slate-600 mb-4" />
          <div className="w-[80px] h-3 bg-gray-300 dark:bg-slate-600 rounded-md" />
        </div>
      );
    }

    if (variant === 'table') {
      return (
        <div className="h-[400px] w-full animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg shadow-sm">
          <div className="space-y-3 w-full p-4">
            {/* テーブルヘッダー */}
            <div className="grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-300 dark:bg-slate-600 rounded" />
              ))}
            </div>
            {/* テーブル行 */}
            {Array.from({ length: 8 }).map((_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, colIndex) => (
                  <div key={colIndex} className="h-3.5 bg-gray-300 dark:bg-slate-600 rounded" />
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (variant === 'card') {
      return Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`h-20 w-full animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg shadow-sm ${className}`} />
      ));
    }

    if (variant === 'circle') {
      return Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`h-10 w-10 animate-pulse bg-gray-200 dark:bg-slate-700 rounded-full shadow-sm ${className}`} />
      ));
    }

    // text variant
    return Array.from({ length: count }).map((_, index) => (
      <div key={index} className={`h-4 w-full animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg shadow-sm ${className}`} />
    ));
  };

  return <>{renderSkeletonContent()}</>;
};

export default SkeletonLoader;
