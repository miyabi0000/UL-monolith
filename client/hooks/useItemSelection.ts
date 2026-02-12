import { useState, useMemo, useCallback } from 'react';
import { GearItemWithCalculated } from '../utils/types';

interface UseItemSelectionOptions {
  /**
   * 最大選択可能数（オプション）
   * 例: Compareモードでは4件まで
   */
  maxSelection?: number;
  /**
   * 選択解除時のコールバック（オプション）
   */
  onSelectionChange?: (selectedIds: string[]) => void;
}

interface UseItemSelectionReturn {
  /** 選択されたアイテムIDの配列 */
  selectedIds: string[];
  /** 選択されたアイテムのオブジェクト配列 */
  selectedItems: GearItemWithCalculated[];
  /** 全アイテムが選択されているか */
  isAllSelected: boolean;
  /** 一部のアイテムが選択されているか */
  isPartiallySelected: boolean;
  /** 単一アイテムの選択/解除 */
  handleSelectItem: (id: string, checked: boolean) => void;
  /** 全アイテムの選択/解除 */
  handleSelectAll: (checked: boolean) => void;
  /** 選択をクリア */
  clearSelection: () => void;
  /** 選択状態を設定 */
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  /** アイテムが選択されているかチェック */
  isSelected: (id: string) => boolean;
}

/**
 * アイテム選択ロジックを管理するカスタムフック
 *
 * @param items - アイテムの配列
 * @param options - オプション設定
 * @returns 選択状態と操作関数
 */
export function useItemSelection(
  items: GearItemWithCalculated[],
  options: UseItemSelectionOptions = {}
): UseItemSelectionReturn {
  const { maxSelection, onSelectionChange } = options;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 選択されたアイテムのオブジェクト配列
  const selectedItems = useMemo(
    () => items.filter(item => selectedIds.includes(item.id)),
    [items, selectedIds]
  );

  // 全選択状態
  const maxSelectableCount = useMemo(
    () => (maxSelection ? Math.min(items.length, maxSelection) : items.length),
    [items.length, maxSelection]
  );

  const isAllSelected = useMemo(
    () => items.length > 0 && selectedIds.length === maxSelectableCount,
    [items.length, selectedIds.length, maxSelectableCount]
  );

  // 部分選択状態
  const isPartiallySelected = useMemo(
    () => selectedIds.length > 0 && selectedIds.length < maxSelectableCount,
    [selectedIds.length, maxSelectableCount]
  );

  // 単一アイテムの選択/解除
  const handleSelectItem = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prevIds => {
      let newIds: string[];

      if (checked) {
        // 最大選択数のチェック
        if (maxSelection && prevIds.length >= maxSelection) {
          return prevIds;
        }
        newIds = [...prevIds, id];
      } else {
        newIds = prevIds.filter(selectedId => selectedId !== id);
      }

      // コールバック実行
      onSelectionChange?.(newIds);
      return newIds;
    });
  }, [maxSelection, onSelectionChange]);

  // 全アイテムの選択/解除
  const handleSelectAll = useCallback((checked: boolean) => {
    const newIds = checked
      ? items.slice(0, maxSelectableCount).map(item => item.id)
      : [];
    setSelectedIds(newIds);
    onSelectionChange?.(newIds);
  }, [items, maxSelectableCount, onSelectionChange]);

  // 選択をクリア
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  // アイテムが選択されているかチェック
  const isSelected = useCallback((id: string) => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  return {
    selectedIds,
    selectedItems,
    isAllSelected,
    isPartiallySelected,
    handleSelectItem,
    handleSelectAll,
    clearSelection,
    setSelectedIds,
    isSelected,
  };
}
