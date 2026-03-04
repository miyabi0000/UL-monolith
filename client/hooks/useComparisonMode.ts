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
   * 比較リストからアイテムを除外するコールバック（選択解除）
   */
  onRemoveItem?: (id: string) => void;
  /**
   * アイテムをギアリストから削除するコールバック
   */
  onDeleteItem?: (id: string) => void;
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

const MIN_COMPARISON_ITEMS = 2;

const VALIDATION_MESSAGES = {
  TOO_FEW_ITEMS: '比較するには2件以上のアイテムを選択してください',
  MISSING_CATEGORY: 'カテゴリが設定されていないアイテムは比較できません',
  MIXED_CATEGORIES: '同一カテゴリ内のアイテムのみ比較できます',
} as const;

function validateComparisonItems(
  selectedItems: GearItemWithCalculated[]
): ComparisonValidation {
  if (selectedItems.length < MIN_COMPARISON_ITEMS) {
    return {
      isValid: false,
      errorMessage: VALIDATION_MESSAGES.TOO_FEW_ITEMS,
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
      errorMessage: VALIDATION_MESSAGES.MISSING_CATEGORY,
    };
  }

  if (categorySet.size > 1) {
    return {
      isValid: false,
      errorMessage: VALIDATION_MESSAGES.MIXED_CATEGORIES,
    };
  }

  return { isValid: true };
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
  /** 比較リストから除外（選択解除のみ） */
  removeFromComparison: (itemId: string) => void;
  /** アイテムをギアリストから削除 */
  deleteItem: (itemId: string) => void;
  /** アイテムの優先度を最高（1）に設定 */
  raisePriority: (itemId: string) => Promise<void>;
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
    onDeleteItem,
    onComparisonClose,
  } = options;

  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const finalizeComparison = useCallback((clearSelection = false) => {
    setShowComparisonModal(false);
    if (clearSelection) {
      onClearSelection?.();
    }
    onComparisonClose?.();
  }, [onClearSelection, onComparisonClose]);

  /**
   * 比較可能かどうかを検証
   * - 2件以上のアイテムが選択されている
   * - すべて同一カテゴリである
   */
  const validationResult = useMemo((): ComparisonValidation => {
    return validateComparisonItems(selectedItems);
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
    finalizeComparison();
  }, [finalizeComparison]);

  /**
   * 比較リストから除外（選択解除のみ、ギアリストからは削除しない）
   * 2件以下になった場合は自動的にモーダルを閉じる
   */
  const removeFromComparison = useCallback((itemId: string) => {
    onRemoveItem?.(itemId);

    const remainingCount = selectedItems.length - 1;
    if (remainingCount < MIN_COMPARISON_ITEMS) {
      finalizeComparison();
    }
  }, [selectedItems.length, onRemoveItem, finalizeComparison]);

  /**
   * アイテムをギアリストから削除し、比較リストからも除外
   * 2件以下になった場合はモーダルを閉じる
   */
  const deleteItem = useCallback((itemId: string) => {
    onDeleteItem?.(itemId);
    onRemoveItem?.(itemId);

    const remainingCount = selectedItems.length - 1;
    if (remainingCount < MIN_COMPARISON_ITEMS) {
      finalizeComparison(true);
    }
  }, [selectedItems.length, onDeleteItem, onRemoveItem, finalizeComparison]);

  /**
   * アイテムの優先度を最高（1）に設定する
   * 「このギアを買う」という意思表示として使う
   */
  const raisePriority = useCallback(async (itemId: string) => {
    if (!onUpdateItem) {
      console.error('onUpdateItem callback is not provided');
      return;
    }

    try {
      await onUpdateItem(itemId, 'priority', 1);
    } catch (err) {
      console.error('Failed to raise priority:', err);
      throw err;
    }
  }, [onUpdateItem]);

  return {
    showComparisonModal,
    validationResult,
    openComparison,
    closeComparison,
    removeFromComparison,
    deleteItem,
    raisePriority,
  };
}
