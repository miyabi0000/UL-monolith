import React from 'react';
import { COLORS, getGlassStyle } from '../../utils/designSystem';

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
  const baseStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    backgroundImage: 'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.1) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '0.375rem',
    ...getGlassStyle('light'),
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'chart':
        return {
          ...baseStyle,
          height: '300px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column' as const,
        };
      case 'table':
        return {
          ...baseStyle,
          height: '400px',
          width: '100%',
        };
      case 'card':
        return {
          ...baseStyle,
          height: '80px',
          width: '100%',
        };
      case 'circle':
        return {
          ...baseStyle,
          height: '40px',
          width: '40px',
          borderRadius: '50%',
        };
      default: // text
        return {
          ...baseStyle,
          height: '1rem',
          width: '100%',
        };
    }
  };

  const renderSkeletonContent = () => {
    if (variant === 'chart') {
      return (
        <div style={getVariantStyle()}>
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              marginBottom: '1rem',
            }}
          />
          <div
            style={{
              width: '80px',
              height: '0.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '0.375rem',
            }}
          />
        </div>
      );
    }

    if (variant === 'table') {
      return (
        <div style={getVariantStyle()}>
          <div className="space-y-3 w-full p-4">
            {/* テーブルヘッダー */}
            <div className="grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: '1rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '0.25rem',
                  }}
                />
              ))}
            </div>
            {/* テーブル行 */}
            {Array.from({ length: 8 }).map((_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, colIndex) => (
                  <div
                    key={colIndex}
                    style={{
                      height: '0.875rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.25rem',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return Array.from({ length: count }).map((_, index) => (
      <div key={index} style={getVariantStyle()} className={className} />
    ));
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      {renderSkeletonContent()}
    </>
  );
};

export default SkeletonLoader;