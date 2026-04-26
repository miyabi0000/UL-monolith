import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'chart' | 'table' | 'card' | 'text' | 'circle';
  count?: number;
}

/**
 * 読込中プレースホルダ。背景は `--surface-level-2` (沈み層)、内側ブロックは
 * `--surface-level-1` (一段浮き) のトークン階層で表現し、light / dark を
 * CSS 変数のみで切替える。
 */
const blockBg: React.CSSProperties = { background: 'var(--surface-level-2)' };
const innerBg: React.CSSProperties = { background: 'var(--surface-level-1)' };

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  variant = 'text',
  count = 1
}) => {
  const renderSkeletonContent = () => {
    if (variant === 'chart') {
      return (
        <div
          className="h-[300px] w-full flex items-center justify-center flex-col animate-pulse rounded-surface"
          style={{ ...blockBg, boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="w-[120px] h-[120px] rounded-full mb-4" style={innerBg} />
          <div className="w-[80px] h-3 rounded-control" style={innerBg} />
        </div>
      );
    }

    if (variant === 'table') {
      return (
        <div
          className="h-[400px] w-full animate-pulse rounded-surface"
          style={{ ...blockBg, boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="space-y-3 w-full p-4">
            <div className="grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 rounded-control" style={innerBg} />
              ))}
            </div>
            {Array.from({ length: 8 }).map((_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, colIndex) => (
                  <div key={colIndex} className="h-3.5 rounded-control" style={innerBg} />
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (variant === 'card') {
      return Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`h-20 w-full animate-pulse rounded-surface ${className}`}
          style={{ ...blockBg, boxShadow: 'var(--shadow-sm)' }}
        />
      ));
    }

    if (variant === 'circle') {
      return Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`h-10 w-10 animate-pulse rounded-full ${className}`}
          style={{ ...blockBg, boxShadow: 'var(--shadow-sm)' }}
        />
      ));
    }

    // text variant
    return Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className={`h-4 w-full animate-pulse rounded-control ${className}`}
        style={{ ...blockBg, boxShadow: 'var(--shadow-sm)' }}
      />
    ));
  };

  return <>{renderSkeletonContent()}</>;
};

export default SkeletonLoader;
