import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { GearItemWithCalculated, GearFieldValue, Category, QuantityDisplayMode, ChartViewMode, ChartFocus, Pack, isBig3Category } from '../utils/types';
import CardGridView from './DetailPanel/CardGridView';
import ComparisonTable from './ComparisonTable';
import TableHeader from './GearTable/TableHeader';
import TableRow from './GearTable/TableRow';
import BulkActionBar from './BulkActionBar';
import EmptyState from './ui/EmptyState';
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
  filteredByCategory?: string[];
  chartFocusFilter?: ChartFocus;
  selectedItemId?: string | null;
  hoveredItemId?: string | null;
  onItemSelect?: (id: string | null) => void;
  onItemHover?: (id: string | null) => void;
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
  filteredByCategory = [],
  chartFocusFilter = 'all',
  selectedItemId,
  hoveredItemId,
  onItemSelect,
  onItemHover,
  activePack = null,
  activePackItemIds = [],
  onTogglePackItem,
  onAddItemsToPack,
}) => {
  const { sortField, sortDirection, handleSort, forceSort } = useGearSort();
  const { changedFields, handleFieldChange, clearChangedFields } = useChangedFields(onUpdateItem);
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('currency');
    return (saved === 'JPY' || saved === 'USD') ? saved : 'JPY';
  });

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  // viewMode切替時にテーブルソートを自動連動（降順: 重い/高い順）
  useEffect(() => {
    if (viewMode === 'cost') {
      forceSort('price', 'desc');
    } else {
      forceSort('weight', 'desc');
    }
  }, [viewMode, forceSort]);

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

  const handleQuantityDisplayModeChange = useCallback(() => {
    const next =
      quantityDisplayMode === 'owned' ? 'need' :
      quantityDisplayMode === 'need' ? 'all' : 'owned';
    onQuantityDisplayModeChange(next);
  }, [quantityDisplayMode, onQuantityDisplayModeChange]);

  // Per-row inline edit state: 同時に編集できるのは 1 行だけ。
  // 旧 showCheckboxes を分離: Compare mode は checkbox 表示のみ (shouldShowCheckboxes)、
  // 行編集は editingItemId 単独で制御する。
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const shouldShowCheckboxes = isCompareMode;

  const handleStartEdit = useCallback((itemId: string) => {
    setEditingItemId(itemId);
  }, []);

  const handleSaveEdit = useCallback(() => {
    // onUpdateItem で即時保存済みなので state をクリアするだけでよい
    setEditingItemId(null);
    clearChangedFields();
  }, [clearChangedFields]);

  const handleCancelEdit = useCallback(() => {
    // TODO: 真のロールバックには元値を保持する必要がある。
    //       現状は楽観的 UI 更新のため「Cancel は単に変更バッジをクリアして抜ける」挙動。
    setEditingItemId(null);
    clearChangedFields();
  }, [clearChangedFields]);

  const handleDeleteItem = useCallback((itemId: string) => {
    if (window.confirm('このギアを削除しますか?')) {
      onDelete(itemId);
      if (editingItemId === itemId) setEditingItemId(null);
    }
  }, [onDelete, editingItemId]);

  // Compare モードから抜けたら選択状態をクリア
  useEffect(() => {
    if (!isCompareMode) {
      clearSelection();
    }
  }, [isCompareMode, clearSelection]);

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

  // Table / Compare モード用 Context（早期returnよりも前で呼ぶ — Hooks Rules）
  const contextValue = useMemo(() => ({
    quantityDisplayMode,
    onQuantityDisplayModeChange: handleQuantityDisplayModeChange,
    currency,
    onCurrencyChange: handleCurrencyChange,
    showCheckboxes: shouldShowCheckboxes,
    editingItemId,
    onStartEdit: handleStartEdit,
    onSaveEdit: handleSaveEdit,
    onCancelEdit: handleCancelEdit,
    onDeleteItem: handleDeleteItem,
    activePackName: activePack?.name,
    onAddAllToPack: activePack && (onAddItemsToPack || onTogglePackItem) ? handleAddAllToPack : undefined,
    isAllVisibleInPack,
  }), [quantityDisplayMode, handleQuantityDisplayModeChange, currency, handleCurrencyChange,
       shouldShowCheckboxes, editingItemId, handleStartEdit, handleSaveEdit, handleCancelEdit,
       handleDeleteItem, activePack, onAddItemsToPack, onTogglePackItem,
       handleAddAllToPack, isAllVisibleInPack]);

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

  // 全体で 0 件 / フィルタ後に 0 件を判別
  const hasAnyItem = items.length > 0;
  const hasFilteredItem = chartFilteredItems.length > 0;
  const showGlobalEmpty = !hasAnyItem;
  const showFilteredEmpty = hasAnyItem && !hasFilteredItem;

  // 全体 0 件: 初回ユーザー向けの空状態
  // Chat サイドバーがリスト空時に自動オープンするため CTA ボタンは置かない
  // （AppDock / ProfileHeader の Chat ボタンもあり三重化防止）
  if (showGlobalEmpty) {
    return (
      <div className="w-full h-full min-w-0 flex items-center justify-center">
        <EmptyState
          title="まだギアがありません"
          description="右の Chat パネルに URL を貼るか、ブランド + 商品名を入力するとギアが追加されます。"
        />
      </div>
    );
  }

  // Cardモード
  if (gearViewMode === 'card') {
    return (
      <div className="w-full h-full min-w-0 overflow-hidden">
        {showFilteredEmpty ? (
          <EmptyState
            compact
            title="該当するギアがありません"
            description="カテゴリや表示モードのフィルタを変更すると結果が表示されます。"
          />
        ) : (
          <CardGridView
            items={chartFilteredItems}
            viewMode={viewMode === 'cost' ? 'cost' : 'weight'}
            quantityDisplayMode={quantityDisplayMode}
            selectedItemId={selectedItemId}
            hoveredItemId={hoveredItemId}
            onItemSelect={onItemSelect}
            onItemHover={onItemHover}
            activePackName={activePack?.name}
            activePackItemIds={activePackItemIds}
            onTogglePackItem={onTogglePackItem}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </div>
    );
  }

  return (
    <GearListProvider value={contextValue}>
      <div className="w-full h-full min-w-0 overflow-auto">
        {/* Compare モード時のみ BulkActionBar を表示 (compare 選択用) */}
        {isCompareMode && (
          <div style={{ padding: `${SPACING_SCALE.base}px` }}>
            <BulkActionBar
              selectedCount={selectedIds.length}
              totalCount={processedItems.length}
              allSelected={isAllSelected}
              onSelectAll={handleSelectAll}
              onClearSelection={clearSelection}
              onCompare={handleCompare}
              isCompareMode={true}
              maxCompareItems={MAX_COMPARE_ITEMS}
              canCompare={validationResult.isValid}
              compareDisabledReason={validationResult.errorMessage}
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
              {showFilteredEmpty && (
                <tr>
                  <td colSpan={99}>
                    <EmptyState
                      compact
                      title="該当するギアがありません"
                      description="カテゴリや表示モードのフィルタを変更すると結果が表示されます。"
                    />
                  </td>
                </tr>
              )}
              {!showFilteredEmpty && processedItems.map((item) => (
                <TableRow
                  key={item.id}
                  id={`gear-item-${item.id}`}
                  item={item}
                  categories={categories}
                  isSelected={selectedIds.includes(item.id)}
                  isHighlighted={selectedItemId === item.id}
                  isHovered={hoveredItemId === item.id}
                  activePackName={activePack?.name}
                  isInActivePack={activePackItemIds.includes(item.id)}
                  changedFields={changedFields[item.id]}
                  onSelectItem={handleSelectItem}
                  onUpdateItem={handleFieldChange}
                  onTogglePackItem={onTogglePackItem}
                  onItemSelect={onItemSelect}
                  onItemHover={onItemHover}
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
