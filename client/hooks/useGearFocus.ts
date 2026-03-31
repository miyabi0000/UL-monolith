import { useCallback, useRef } from 'react';

/**
 * アドバイザーからのギアフォーカス要求を処理するフック
 * 対象行にスクロールし、一時的なハイライトアニメーションを付与する
 */
export const useGearFocus = () => {
  const flashTimerRef = useRef<number | null>(null);

  const handleFocusGear = useCallback((gearId: string) => {
    const el = document.getElementById(`gear-item-${gearId}`);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 既存のタイマーがあればクリア（連続クリック対応）
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
      el.classList.remove('gear-focus-flash');
      // 一フレーム待ってアニメーションを再トリガー
      window.requestAnimationFrame(() => {
        el.classList.add('gear-focus-flash');
      });
    } else {
      el.classList.add('gear-focus-flash');
    }

    flashTimerRef.current = window.setTimeout(() => {
      el.classList.remove('gear-focus-flash');
      flashTimerRef.current = null;
    }, 1900);
  }, []);

  return handleFocusGear;
};
