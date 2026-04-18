import { useEffect, useState, useCallback } from 'react';

/**
 * ダークモードの購読 + トグル用 hook。
 *
 * HTML root の `dark` クラス有無を MutationObserver で監視し、別コンポーネント
 * (例: ProfileHeader と AppDock) の両方に同じ isDark 値を配る。`toggle()` で
 * クラスを切り替えて localStorage にも `theme` を保存する。
 *
 * 戻り値:
 *   isDark: 現在ダークか
 *   toggle(): ライト/ダークを切替
 */
export const useDarkMode = (): { isDark: boolean; toggle: () => void } => {
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const toggle = useCallback(() => {
    const root = document.documentElement;
    const next = !root.classList.contains('dark');
    root.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      /* localStorage 不可環境はサイレントに無視 */
    }
    setIsDark(next);
  }, []);

  return { isDark, toggle };
};
