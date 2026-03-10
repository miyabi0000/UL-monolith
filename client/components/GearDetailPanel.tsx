import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { GearItemWithCalculated, GearFieldValue, Category, QuantityDisplayMode, ChartViewMode, ChartFocus, Pack, isBig3Category } from '../utils/types';
import CardGridView from './DetailPanel/CardGridView';
import ComparisonTable from './ComparisonTable';
import TableHeader, { SortField, SortDirection, Currency } from './GearTable/TableHeader';
import TableRow from './GearTable/TableRow';
import BulkActionBar from './BulkActionBar';
import { SPACING_SCALE } from '../utils/designSystem';
import { filterByCategories, sortItems } from '../utils/sortHelpers';
import { useItemSelection } from '../hooks/useItemSelection';
import { useComparisonMode } from '../hooks/useComparisonMode';

interface GearDetailPanelProps {
  items: GearItemWithCalculated[];
  categories: Category[];
  viewMode: ChartViewMode;
  gearViewMode?: 'table' | 'card' | 'compare';
  quantityDisplayMode: QuantityDisplayMode;
  onQuantityDisplayModeChange: (mode: QuantityDisplayMode) => void;
  onEdit: (item: GearItemWithCalculated) => void;
  onDelete: (id: string) => void;
  onUpdateItem: (id: string, field: string, value: GearFieldValue) => void;
  showCheckboxes: boolean;
  onToggleCheckboxes: () => void;
  filteredByCategory?: string[];
  chartFocusFilter?: ChartFocus;
  selectedItemId?: string | null;
  activePack?: Pack | null;
  activePackItemIds?: string[];
  onTogglePackItem?: (itemId: string) => void;
}

const GearDetailPanel: React.FC<GearDetailPanelProps> = ({
  items,
  categories,
  viewMode,
  gearViewMode = 'table',
  quantityDisplayMode,
  onQuantityDisplayModeChange,
  onEdit,
  onDelete,
  onUpdateItem,
  showCheckboxes,
  onToggleCheckboxes,
  filteredByCategory = [],
  chartFocusFilter = 'all',
  selectedItemId,
  activePack = null,
  activePackItemIds = [],
  onTogglePackItem,
}) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [changedFields, setChangedFields] = useState<Record<string, Set<string>>>({});
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('currency');
    return (saved === 'JPY' || saved === 'USD') ? saved : 'JPY';
  });

  // 通貨設定をlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const handleCurrencyChange = useCallback(() => {
    setCurrency(prev => prev === 'JPY' ? 'USD' : 'JPY');
  }, []);

  // Compareモード用の状態
  const isCompareMode = gearViewMode === 'compare';
  const MAX_COMPARE_ITEMS = 4;

  const quantityFilteredItems = useMemo(() => {
    if (quantityDisplayMode === 'owned') {
      return items.filter(item => item.ownedQuantity > 0);
    }
    if (quantityDisplayMode === 'need') {
      return items.filter(item => item.shortage > 0);
    }
    return items;
  }, [items, quantityDisplayMode]);

  // Big3/Otherフィルタ（Weight-Classモードのチャートと連動）
  const big3FilteredItems = useMemo(() => {
    if (chartFocusFilter === 'all') {
      return quantityFilteredItems;
    }
    if (chartFocusFilter === 'big3') {
      return quantityFilteredItems.filter(item => isBig3Category(item.category));
    }
    // chartFocusFilter === 'other'
    return quantityFilteredItems.filter(item => !isBig3Category(item.category));
  }, [quantityFilteredItems, chartFocusFilter]);

  const chartFilteredItems = useMemo(() => {
    return filterByCategories(big3FilteredItems, filteredByCategory);
  }, [big3FilteredItems, filteredByCategory]);

  // ソート処理（sortHelpers を使用）
  const processedItems = useMemo(
    () => sortItems(chartFilteredItems, sortField, sortDirection),
    [chartFilteredItems, sortField, sortDirection]
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 選択ロジック（useItemSelection フックを使用）
  const {
    selectedIds,
    selectedItems,
    isAllSelected,
    isPartiallySelected,
    handleSelectItem,
    handleSelectAll,
    clearSelection,
    setSelectedIds,
  } = useItemSelection(processedItems, {
    maxSelection: isCompareMode ? MAX_COMPARE_ITEMS : undefined,
  });

  const handleBulkDelete = () => {
    if (selectedIds.length > 0) {
      selectedIds.forEach(id => onDelete(id));
      clearSelection();
    }
  };

  const handleQuantityDisplayModeChange = useCallback(() => {
    const next =
      quantityDisplayMode === 'owned'
        ? 'need'
        : quantityDisplayMode === 'need'
          ? 'all'
          : 'owned';
    onQuantityDisplayModeChange(next);
  }, [quantityDisplayMode, onQuantityDisplayModeChange]);

  const shouldShowCheckboxes = showCheckboxes || isCompareMode;
  const isEditable = !isCompareMode && showCheckboxes;

  useEffect(() => {
    if (!showCheckboxes) {
      clearSelection();
      setChangedFields({});
    }
  }, [showCheckboxes, clearSelection]);

  // 比較モードロジック（useComparisonMode フックを使用）
  const {
    showComparisonModal,
    validationResult,
    openComparison: handleCompare,
    closeComparison: handleCloseComparisonModal,
    removeFromComparison: handleRemoveFromComparison,
    deleteItem: handleDeleteFromComparison,
    raisePriority: handleRaisePriority,
  } = useComparisonMode({
    selectedItems,
    onUpdateItem,
    onClearSelection: clearSelection,
    onRemoveItem: (itemId) => {
      setSelectedIds(prev => prev.filter(id => id !== itemId));
    },
    onDeleteItem: onDelete,
  });

  const handleFieldChange = useCallback(async (id: string, field: string, value: GearFieldValue) => {
    // 変更中フィールドをマーク
    setChangedFields(prev => {
      const updated = { ...prev };
      if (!updated[id]) {
        updated[id] = new Set();
      } else {
        updated[id] = new Set(updated[id]);
      }
      updated[id].add(field);
      return updated;
    });

    try {
      await onUpdateItem(id, field, value);
    } catch (err) {
      console.error('Failed to update field:', err);
    } finally {
      // 成功・失敗に関わらずフィールドをクリア
      setChangedFields(prev => {
        const updated = { ...prev };
        if (updated[id]) {
          updated[id] = new Set(updated[id]);
          updated[id].delete(field);
          if (updated[id].size === 0) {
            delete updated[id];
          }
        }
        return updated;
      });
    }
  }, [onUpdateItem]);

  // Compareモード時の比較表示（縦型テーブル）
  if (isCompareMode && showComparisonModal && selectedItems.length >= 2) {
    return (
      <ComparisonTable
        items={selectedItems}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        onClose={handleCloseComparisonModal}
        onDelete={handleDeleteFromComparison}
        onRaisePriority={handleRaisePriority}
        onRemove={handleRemoveFromComparison}
      />
    );
  }

  // Cardモード
  if (gearViewMode === 'card') {
    return (
      <div className="w-full h-full min-w-0 overflow-hidden">
        <CardGridView
          items={chartFilteredItems}
          viewMode={viewMode}
          quantityDisplayMode={quantityDisplayMode}
          selectedItemId={selectedItemId}
          activePackName={activePack?.name}
          activePackItemIds={activePackItemIds}
          onTogglePackItem={onTogglePackItem}
        />
      </div>
    );
  }

  // Tableモードまたはcompareモード（テーブル表示）
  if (gearViewMode === 'table' || gearViewMode === 'compare') {
    return (
      <div className="w-full h-full min-w-0 overflow-auto">
        {/* 一括操作バー（チェックボックス表示時のみ） */}
        {shouldShowCheckboxes && (
          <div style={{ padding: `${SPACING_SCALE.base}px` }}>
            <BulkActionBar
              selectedCount={selectedIds.length}
              totalCount={processedItems.length}
              allSelected={isAllSelected}
              onSelectAll={handleSelectAll}
              onClearSelection={clearSelection}
              onBulkDelete={handleBulkDelete}
              onCompare={isCompareMode ? handleCompare : undefined}
              isCompareMode={isCompareMode}
              maxCompareItems={MAX_COMPARE_ITEMS}
              canCompare={isCompareMode ? validationResult.isValid : undefined}
              compareDisabledReason={isCompareMode ? validationResult.errorMessage : undefined}
            />
          </div>
        )}

        {/* テーブル表示 */}
        <div>
          <table className="w-full" style={{ minWidth: '600px' }}>
            <TableHeader
              showCheckboxes={shouldShowCheckboxes}
              isAllSelected={isAllSelected}
              isPartiallySelected={isPartiallySelected}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onSelectAll={handleSelectAll}
              quantityDisplayMode={quantityDisplayMode}
              onQuantityDisplayModeChange={handleQuantityDisplayModeChange}
              currency={currency}
              onCurrencyChange={handleCurrencyChange}
              isEditable={isEditable}
              activePackName={activePack?.name}
            />
            <tbody>
              {processedItems.map((item) => (
                <TableRow
                  key={item.id}
                  item={item}
                  categories={categories}
                  showCheckboxes={shouldShowCheckboxes}
                  isSelected={selectedIds.includes(item.id)}
                  isHighlighted={selectedItemId === item.id}
                  changedFields={changedFields[item.id]}
                  quantityDisplayMode={quantityDisplayMode}
                  isEditable={isEditable}
                  currency={currency}
                  onSelectItem={handleSelectItem}
                  onUpdateItem={handleFieldChange}
                  activePackName={activePack?.name}
                  isInActivePack={activePackItemIds.includes(item.id)}
                  onTogglePackItem={onTogglePackItem}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // デフォルト
  return (
    <div className="w-full h-full min-w-0 overflow-hidden">
      <CardGridView
        items={chartFilteredItems}
        viewMode={viewMode}
        quantityDisplayMode={quantityDisplayMode}
        selectedItemId={selectedItemId}
        activePackName={activePack?.name}
        activePackItemIds={activePackItemIds}
        onTogglePackItem={onTogglePackItem}
      />
    </div>
  );
};

export default React.memo(GearDetailPanel);
