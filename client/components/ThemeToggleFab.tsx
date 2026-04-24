import React from 'react';
import { useDarkMode } from '../hooks/useDarkMode';

/**
 * ThemeToggleFab — viewport 右上に fixed の ghost ボタン。
 *
 * カード / ヘッダーの外側に独立配置することで、どの画面でも
 * 同じ位置からダークモード切替にアクセスできる。
 *
 * z-index は modal-overlay (z-50) より下の 30 にして、
 * モーダル open 時は背後に潜むようにする。
 */
const ThemeToggleFab: React.FC = () => {
  const { isDark, toggle } = useDarkMode();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="fixed top-2 right-2 z-30 h-7 w-7 inline-flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:bg-[var(--overlay-hover)] active:bg-[var(--overlay-active)] transition-colors"
    >
      {isDark ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
};

export default React.memo(ThemeToggleFab);
