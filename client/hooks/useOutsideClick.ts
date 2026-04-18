import { useEffect, type RefObject } from 'react';

/**
 * 対象要素の外側 mousedown で callback を発火する hook。
 *
 * ドロップダウンメニューを外クリックで閉じる共通パターン用。
 *
 * 使い方:
 *   const ref = useRef<HTMLDivElement>(null);
 *   useOutsideClick(ref, () => setMenuOpen(false), menuOpen);
 *
 * @param ref    判定対象の要素 ref。ref.current の内側クリックは無視
 * @param handler 外側クリックで呼ばれる
 * @param active  false の時は購読しない（メニュー閉の時はリスナー不要）
 */
export const useOutsideClick = (
  ref: RefObject<HTMLElement>,
  handler: () => void,
  active: boolean = true,
): void => {
  useEffect(() => {
    if (!active) return;
    const listener = (event: MouseEvent) => {
      const el = ref.current;
      if (el && !el.contains(event.target as Node)) {
        handler();
      }
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler, active]);
};
