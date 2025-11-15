import React, { useState, useMemo } from 'react';
import { GearItemWithCalculated, Category } from '../utils/types';
import { COLORS, SPACING_SCALE } from '../utils/designSystem';
import GearCard from './GearCard';
import Card from './ui/Card';
import GearListHeader from './GearListHeader';
import BulkActionBar from './BulkActionBar';

type ViewMode = 'table' | 'card';

interface GearViewProps {
  items: GearItemWithCalculated[];
  categories: Category[];
  filteredByCategory?: string[];
  onEdit: (gear: GearItemWithCalculated) => void;
  onDelete: (ids: string[]) => void;
  showCheckboxes: boolean;
  onToggleCheckboxes: () => void;
  onShowForm: () => void;
  onShowBulkUrlInput?: () => void;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

type SortField = 'name' | 'weight' | 'price' | 'priority';
type SortDirection = 'asc' | 'desc';

const GearView: React.FC<GearViewProps> = React.memo(({
  items,
  categories,
  filteredByCategory = [],
  onEdit,
  onDelete,
  showCheckboxes,
  onToggleCheckboxes,
  onShowForm,
  onShowBulkUrlInput,
  currentView,
  onViewChange
}) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // フィルター＆ソート処理
  const processedItems = useMemo(() => {
    const safeItems = Array.isArray(items) ? items : [];
    
    // カテゴリフィルタリング
    const filteredItems = filteredByCategory.length > 0
      ? safeItems.filter(item => 
          item.category && filteredByCategory.includes(item.category.name)
        )
      : safeItems;

    // ソート
    return [...filteredItems].sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'weight':
          aVal = a.totalWeight || 0;
          bVal = b.totalWeight || 0;
          break;
        case 'price':
          aVal = a.totalPrice || 0;
          bVal = b.totalPrice || 0;
          break;
        case 'priority':
          aVal = a.priority;
          bVal = b.priority;
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, filteredByCategory, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === processedItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(processedItems.map(item => item.id));
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    
    if (window.confirm(`選択した${selectedIds.length}個のアイテムを削除しますか？`)) {
      onDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleDeleteSingle = (id: string) => {
    onDelete([id]);
    setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
  };

  return (
    <div>
      {/* 共通ヘッダー */}
      <Card variant="default">
        <GearListHeader
          itemCount={processedItems.length}
          currentView={currentView}
          onViewChange={onViewChange}
          showCheckboxes={showCheckboxes}
          onToggleCheckboxes={onToggleCheckboxes}
          onShowForm={onShowForm}
          onShowBulkUrlInput={onShowBulkUrlInput}
        />

        {/* ソートボタン */}
        <div className="flex items-center gap-2 px-3 pb-3 pt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">並び替え:</span>
          <button
            onClick={() => handleSort('name')}
            className={`px-2.5 py-1 text-xs rounded transition-colors border ${
              sortField === 'name'
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700'
            }`}
          >
            名前 {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('weight')}
            className={`px-2.5 py-1 text-xs rounded transition-colors border ${
              sortField === 'weight'
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700'
            }`}
          >
            重量 {sortField === 'weight' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('price')}
            className={`px-2.5 py-1 text-xs rounded transition-colors border ${
              sortField === 'price'
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700'
            }`}
          >
            価格 {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </Card>

      {/* 一括操作バー */}
      {showCheckboxes && (
        <BulkActionBar
          selectedCount={selectedIds.length}
          totalCount={processedItems.length}
          allSelected={selectedIds.length === processedItems.length && processedItems.length > 0}
          onSelectAll={handleSelectAll}
          onClearSelection={() => setSelectedIds([])}
          onBulkDelete={handleBulkDelete}
        />
      )}

      {/* カードグリッド */}
      <div className="mt-3">
        {processedItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">ギアアイテムがありません</p>
            <p className="text-sm">「+ Add Gear」ボタンから追加してください</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {processedItems.map(item => (
              <GearCard
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDelete={handleDeleteSingle}
                isSelected={selectedIds.includes(item.id)}
                onSelect={handleSelect}
                showCheckbox={showCheckboxes}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

GearView.displayName = 'GearView';

export default GearView;
