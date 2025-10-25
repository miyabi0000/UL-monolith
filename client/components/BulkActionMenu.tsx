import React, { useState, useRef, useEffect } from 'react';
import { COLORS } from '../utils/designSystem';

interface BulkActionMenuProps {
  showCheckboxes: boolean;
  onToggleCheckboxes: () => void;
  onRefresh?: () => void;
}

const BulkActionMenu: React.FC<BulkActionMenuProps> = ({
  showCheckboxes,
  onToggleCheckboxes,
  onRefresh
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleCheckboxes = () => {
    onToggleCheckboxes();
    setIsOpen(false);
  };

  const handleRefresh = () => {
    onRefresh?.();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* メニューボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md transition-colors"
        style={{
          backgroundColor: isOpen ? COLORS.gray[100] : 'transparent',
          color: COLORS.text.primary
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = COLORS.background;
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
        aria-label="メニュー"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="10" cy="16" r="1.5" />
        </svg>
      </button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-md shadow-lg z-50"
          style={{
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.gray[100]}`
          }}
        >
          <div className="py-1">
            {/* 一括編集モード */}
            <button
              onClick={handleToggleCheckboxes}
              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
              style={{ color: COLORS.text.primary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.gray[100];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span className="w-4">
                {showCheckboxes ? '✓' : ''}
              </span>
              <span>一括編集モード</span>
            </button>

            {/* 区切り線 */}
            <div
              className="my-1"
              style={{
                height: '1px',
                backgroundColor: COLORS.gray[100]
              }}
            />

            {/* 更新 */}
            {onRefresh && (
              <button
                onClick={handleRefresh}
                className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                style={{ color: COLORS.text.primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.gray[100];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span className="w-4">↻</span>
                <span>更新</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActionMenu;

