import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { GearItemWithCalculated, GearFieldValue, Category, QuantityDisplayMode, ChartViewMode, ChartFocus, Pack, isBig3Category } from '../utils/types';
import CardGridView from './DetailPanel/CardGridView';
import ComparisonTable from './ComparisonTable';
import TableHeader from './GearTable/TableHeader';
import TableRow from './GearTable/TableRow';
import BulkActionBar from './BulkActionBar';
import { SPACING_SCALE } from '../utils/designSystem';
import { filterByCategories, sortItems } from '../utils/sortHelpers';
import { useItemSelection } from '../hooks/useItemSelection';
import { useComparisonMode } from '../hooks/useComparisonMode';
import { useGearSort } from '../hooks/useGearSort';
import { GearListProvider } from '../hooks/useGearListContext';
import { useChangedFields } from '../hooks/useChangedFields';
import type { Currency } from './GearTable/TableHeader';

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
  onAddItemsToPack?: (itemIds: string[]) => void;
}

const MAX_COMPARE_ITEMS = 4;

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
  onAddItemsToPack,
}) => {
  const { sortField, sortDirection, handleSort } = useGearSort();
  const { changedFields, handleFieldChange, clearChangedFields } = useChangedFields(onUpdateItem);
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('currency');
    return (saved === 'JPY' || saved === 'USD') ? saved : 'JPY';
  });

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const handleCurrencyChange = useCallback(() => {
    setCurrency(prev => prev === 'JPY' ? 'USD' : 'JPY');
  }, []);

  const isCompareMode = gearViewMode === 'compare';

  const quantityFilteredItems = useMemo(() => {
    if (quantityDisplayMode === 'owned') return items.filter(item => item.ownedQuantity > 0);
    if (quantityDisplayMode === 'need') return items.filter(item => item.shortage > 0);
    return items;
  }, [items, quantityDisplayMode]);

  const big3FilteredItems = useMemo(() => {
    if (chartFocusFilter === 'all') return quantityFilteredItems;
    if (chartFocusFilter === 'big3') return quantityFilteredItems.filter(item => isBig3Category(item.category));
    return quantityFilteredItems.filter(item => !isBig3Category(item.category));
  }, [quantityFilteredItems, chartFocusFilter]);

  const chartFilteredItems = useMemo(
    () => filterByCategories(big3FilteredItems, filteredByCategory),
    [big3FilteredItems, filteredByCategory]
  );

  const processedItems = useMemo(
    () => sortItems(chartFilteredItems, sortField, sortDirection),
    [chartFilteredItems, sortField, sortDirection]
  );

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
      quantityDisplayMode === 'owned' ? 'need' :
      quantityDisplayMode === 'need' ? 'all' : 'owned';
    onQuantityDisplayModeChange(next);
  }, [quantityDisplayMode, onQuantityDisplayModeChange]);

  const shouldShowCheckboxes = showCheckboxes || isCompareMode;
  const isEditable = !isCompareMode && showCheckboxes;

  useEffect(() => {
    if (!showCheckboxes) {
      clearSelection();
      clearChangedFields();
    }
  }, [showCheckboxes, clearSelection, clearChangedFields]);

  const asyncOnUpdateItem = useCallback(
    async (id: string, field: string, value: GearFieldValue) => { onUpdateItem(id, field, value); },
    [onUpdateItem]
  );

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
    onUpdateItem: asyncOnUpdateItem,
    onClearSelection: clearSelection,
    onRemoveItem: (itemId) => setSelectedIds(prev => prev.filter(id => id !== itemId)),
    onDeleteItem: onDelete,
  });

  // O(1)ルックアップ用のSet
  const activePackIdSet = useMemo(() => new Set(activePackItemIds), [activePackItemIds]);

  // 表示中の全アイテムがパックに入っているか
  const isAllVisibleInPack = useMemo(
    () => processedItems.length > 0 && processedItems.every((item) => activePackIdSet.has(item.id)),
    [processedItems, activePackIdSet]
  );

  const handleAddAllToPack = useCallback(() => {
    if (!activePack) return;
    if (isAllVisibleInPack) {
      if (onTogglePackItem) {
        processedItems.forEach((item) => onTogglePackItem(item.id));
      }
    } else {
      if (onAddItemsToPack) {
        onAddItemsToPack(processedItems.map((item) => item.id));
      }
    }
  }, [activePack, isAllVisibleInPack, onTogglePackItem, onAddItemsToPack, processedItems]);

  // Compareモード時の比較表示
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
          viewMode={viewMode === 'cost' ? 'cost' : 'weight'}
          quantityDisplayMode={quantityDisplayMode}
          selectedItemId={selectedItemId}
          activePackName={activePack?.name}
          activePackItemIds={activePackItemIds}
          onTogglePackItem={onTogglePackItem}
          onEdit={onEdit}
        />
      </div>
    );
  }

  // Table / Compare モード
  const contextValue = useMemo(() => ({
    quantityDisplayMode,
    onQuantityDisplayModeChange: handleQuantityDisplayModeChange,
    currency,
    onCurrencyChange: handleCurrencyChange,
    showCheckboxes: shouldShowCheckboxes,
    isEditable,
    activePackName: activePack?.name,
    onAddAllToPack: activePack && (onAddItemsToPack || onTogglePackItem) ? handleAddAllToPack : undefined,
    isAllVisibleInPack,
  }), [quantityDisplayMode, handleQuantityDisplayModeChange, currency, handleCurrencyChange,
       shouldShowCheckboxes, isEditable, activePack, onAddItemsToPack, onTogglePackItem,
       handleAddAllToPack, isAllVisibleInPack]);

  return (
    <GearListProvider value={contextValue}>
      <div className="w-full h-full min-w-0 overflow-auto">
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
        <div>
          <table className="w-full" style={{ minWidth: '600px' }}>
            <TableHeader
              isAllSelected={isAllSelected}
              isPartiallySelected={isPartiallySelected}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onSelectAll={handleSelectAll}
            />
            <tbody>
              {processedItems.map((item) => (
                <TableRow
                  key={item.id}
                  id={`gear-item-${item.id}`}
                  item={item}
                  categories={categories}
                  isSelected={selectedIds.includes(item.id)}
                  isHighlighted={selectedItemId === item.id}
                  activePackName={activePack?.name}
                  isInActivePack={activePackItemIds.includes(item.id)}
                  changedFields={changedFields[item.id]}
                  onSelectItem={handleSelectItem}
                  onUpdateItem={handleFieldChange}
                  onTogglePackItem={onTogglePackItem}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </GearListProvider>
  );
};

export default React.memo(GearDetailPanel);
