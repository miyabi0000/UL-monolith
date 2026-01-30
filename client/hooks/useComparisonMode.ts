import { useState, useCallback, useMemo } from 'react';
import { GearItemWithCalculated, GearFieldValue } from '../utils/types';

interface UseComparisonModeOptions {
  /**
   * 選択されたアイテムの配列
   */
  selectedItems: GearItemWithCalculated[];
  /**
   * アイテムのフィールドを更新するコールバック
   */
  onUpdateItem?: (id: string, field: string, value: GearFieldValue) => Promise<void>;
  /**
   * 選択をクリアするコールバック
   */
  onClearSelection?: () => void;
  /**
   * アイテムを削除するコールバック
   */
  onRemoveItem?: (id: string) => void;
  /**
   * 比較モーダルを閉じた時のコールバック
   */
  onComparisonClose?: () => void;
}

interface ComparisonValidation {
  /** 比較可能かどうか */
  isValid: boolean;
  /** エラーメッセージ */
  errorMessage?: string;
}

interface UseComparisonModeReturn {
  /** 比較モーダルの表示状態 */
  showComparisonModal: boolean;
  /** 比較可能かどうかの検証結果 */
  validationResult: ComparisonValidation;
  /** 比較モーダルを開く */
  openComparison: () => void;
  /** 比較モーダルを閉じる */
  closeComparison: () => void;
  /** 比較から削除 */
  removeFromComparison: (itemId: string) => void;
  /** アイテムを採用（ownedQuantity +1） */
  adoptItem: (itemId: string) => Promise<void>;
  /** プレビュー中のアイテムID */
  previewItemId: string | null;
  /** プレビュー採用（グラフに影響を表示） */
  previewAdopt: (itemId: string | null) => void;
}

/**
 * 比較モードのロジックを管理するカスタムフック
 *
 * @param options - オプション設定
 * @returns 比較モード状態と操作関数
 */
export function useComparisonMode(
  options: UseComparisonModeOptions
): UseComparisonModeReturn {
  const {
    selectedItems,
    onUpdateItem,
    onClearSelection,
    onRemoveItem,
    onComparisonClose,
  } = options;

  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);

  /**
   * 比較可能かどうかを検証
   * - 2件以上のアイテムが選択されている
   * - すべて同一カテゴリである
   */
  const validationResult = useMemo((): ComparisonValidation => {
    if (selectedItems.length < 2) {
      return {
        isValid: false,
        errorMessage: '比較するには2件以上のアイテムを選択してください',
      };
    }

    const categorySet = new Set(
      selectedItems
        .map(item => item.category?.id)
        .filter(Boolean)
    );

    if (categorySet.size === 0) {
      return {
        isValid: false,
        errorMessage: 'カテゴリが設定されていないアイテムは比較できません',
      };
    }

    if (categorySet.size > 1) {
      return {
        isValid: false,
        errorMessage: '同一カテゴリ内のアイテムのみ比較できます',
      };
    }

    return { isValid: true };
  }, [selectedItems]);

  /**
   * 比較モーダルを開く
   */
  const openComparison = useCallback(() => {
    if (!validationResult.isValid) {
      console.error(validationResult.errorMessage);
      return;
    }
    setShowComparisonModal(true);
  }, [validationResult]);

  /**
   * 比較モーダルを閉じる
   */
  const closeComparison = useCallback(() => {
    setShowComparisonModal(false);
    setPreviewItemId(null);
    onComparisonClose?.();
  }, [onComparisonClose]);

  /**
   * プレビュー採用（グラフに影響を表示）
   * nullを渡すとプレビューをクリア
   */
  const previewAdopt = useCallback((itemId: string | null) => {
    setPreviewItemId(itemId);
  }, []);

  /**
   * 比較から削除
   * 2件以下になった場合は自動的にモーダルを閉じる
   */
  const removeFromComparison = useCallback((itemId: string) => {
    onRemoveItem?.(itemId);

    // 削除後のアイテム数をチェック
    const remainingCount = selectedItems.length - 1;
    if (remainingCount < 2) {
      setShowComparisonModal(false);
      onComparisonClose?.();
    }
  }, [selectedItems.length, onRemoveItem, onComparisonClose]);

  /**
   * アイテムを採用（ownedQuantity を +1）
   * 採用後は比較モーダルを閉じて選択をクリア
   */
  const adoptItem = useCallback(async (itemId: string) => {
    const item = selectedItems.find(i => i.id === itemId);
    if (!item) {
      console.error('Item not found:', itemId);
      return;
    }

    if (!onUpdateItem) {
      console.error('onUpdateItem callback is not provided');
      return;
    }

    try {
      await onUpdateItem(itemId, 'ownedQuantity', (item.ownedQuantity || 0) + 1);
      setShowComparisonModal(false);
      setPreviewItemId(null);
      onClearSelection?.();
      onComparisonClose?.();
    } catch (err) {
      console.error('Failed to adopt item:', err);
      throw err;
    }
  }, [selectedItems, onUpdateItem, onClearSelection, onComparisonClose]);

  return {
    showComparisonModal,
    validationResult,
    openComparison,
    closeComparison,
    removeFromComparison,
    adoptItem,
    previewItemId,
    previewAdopt,
  };
}
