import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { GearItemWithCalculated, GearFieldValue, Category, QuantityDisplayMode, ChartFocus, isBig3Category } from '../utils/types';
import GearCardCompact from './GearCardCompact';
import OverviewView from './DetailPanel/OverviewView';
import CategorySummaryView from './DetailPanel/CategorySummaryView';
import CardGridView from './DetailPanel/CardGridView';
import ComparisonTable from './ComparisonTable';
import TableHeader, { SortField, SortDirection, Currency } from './GearTable/TableHeader';
import TableRow from './GearTable/TableRow';
import BulkActionBar from './BulkActionBar';
import { SPACING_SCALE } from '../utils/designSystem';
import { filterByCategories, sortItems } from '../utils/sortHelpers';
import { useItemSelection } from '../hooks/useItemSelection';
import { useComparisonMode } from '../hooks/useComparisonMode';

export type PanelMode = 'item' | 'category' | 'overview';

interface GearDetailPanelProps {
  mode: PanelMode;
  selectedItem: GearItemWithCalculated | null;
  selectedCategory: string | null;
  items: GearItemWithCalculated[];
  categories: Category[];
  viewMode: 'weight' | 'cost';
  gearViewMode?: 'table' | 'card' | 'compare';
  quantityDisplayMode: QuantityDisplayMode;
  onQuantityDisplayModeChange: (mode: QuantityDisplayMode) => void;
  onEdit: (item: GearItemWithCalculated) => void;
  onDelete: (id: string) => void;
  onUpdateItem: (id: string, field: string, value: GearFieldValue) => void;
  onItemClick: (itemId: string) => void;
  showCheckboxes: boolean;
  onToggleCheckboxes: () => void;
  filteredByCategory?: string[];
  chartFocusFilter?: ChartFocus; // Big3/Otherフィルタ
}

const GearDetailPanel: React.FC<GearDetailPanelProps> = ({
  mode,
  selectedItem,
  selectedCategory,
  items,
  categories,
  viewMode,
  gearViewMode = 'table',
  quantityDisplayMode,
  onQuantityDisplayModeChange,
  onEdit,
  onDelete,
  onUpdateItem,
  onItemClick,
  showCheckboxes,
  onToggleCheckboxes,
  filteredByCategory = [],
  chartFocusFilter = 'all',
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

  const panelItems = useMemo(() => {
    if (mode === 'category' && selectedCategory) {
      return chartFilteredItems.filter(item => item.category?.name === selectedCategory);
    }
    return chartFilteredItems;
  }, [chartFilteredItems, mode, selectedCategory]);

  // ソート処理（sortHelpers を使用）
  const processedItems = useMemo(
    () => sortItems(panelItems, sortField, sortDirection),
    [panelItems, sortField, sortDirection]
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
    adoptItem: handleAdoptItem,
    previewItemId,
    previewAdopt: handlePreviewAdopt,
  } = useComparisonMode({
    selectedItems,
    onUpdateItem,
    onClearSelection: clearSelection,
    onRemoveItem: (itemId) => {
      setSelectedIds(prev => prev.filter(id => id !== itemId));
    },
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
        onAdopt={handleAdoptItem}
        onPreviewAdopt={handlePreviewAdopt}
        previewItemId={previewItemId}
        onRemove={handleRemoveFromComparison}
      />
    );
  }

  // Cardモード
  if (gearViewMode === 'card') {
    return (
      <div className="w-full h-full min-w-0 overflow-hidden">
        <CardGridView
          items={panelItems}
          viewMode={viewMode}
          onItemClick={onItemClick}
          quantityDisplayMode={quantityDisplayMode}
        />
      </div>
    );
  }

  // Tableモードまたはcompareモード（テーブル表示）
  if (gearViewMode === 'table' || gearViewMode === 'compare') {
    return (
      <div className="w-full h-full min-w-0 overflow-y-auto">
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
        <div className="overflow-x-auto">
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
            />
            <tbody>
              {processedItems.map((item) => (
                <TableRow
                  key={item.id}
                  item={item}
                  categories={categories}
                  showCheckboxes={shouldShowCheckboxes}
                  isSelected={selectedIds.includes(item.id)}
                  changedFields={changedFields[item.id]}
                  quantityDisplayMode={quantityDisplayMode}
                  isEditable={isEditable}
                  currency={currency}
                  onSelectItem={handleSelectItem}
                  onUpdateItem={handleFieldChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // アイテム詳細モードの場合は常にGearCardCompactを表示
  if (mode === 'item') {
    return (
      <div className="w-full h-full min-w-0 overflow-hidden">
        <GearCardCompact
          item={selectedItem}
          viewMode={viewMode}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    );
  }

  // デフォルト（overview/categoryモード）
  return (
    <div className="w-full h-full min-w-0 overflow-hidden">
      {mode === 'category' && selectedCategory ? (
        <CategorySummaryView
          categoryName={selectedCategory}
          items={chartFilteredItems}
          viewMode={viewMode}
          onItemClick={onItemClick}
          quantityDisplayMode={quantityDisplayMode}
        />
      ) : (
        <OverviewView
          items={chartFilteredItems}
          viewMode={viewMode}
          onItemClick={onItemClick}
          quantityDisplayMode={quantityDisplayMode}
        />
      )}
    </div>
  );
};

export default React.memo(GearDetailPanel);
