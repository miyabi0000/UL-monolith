import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { GearItemWithCalculated, Category, GearFieldValue, QuantityDisplayMode, ViewMode } from '../../utils/types'
import { SPACING_SCALE } from '../../utils/designSystem'
import Card from '../ui/Card'
import GearListHeader from '../GearListHeader'
import BulkActionBar from '../BulkActionBar'
import TableHeader, { SortField, SortDirection } from './TableHeader'
import TableRow from './TableRow'
import ComparisonTable from '../ComparisonTable'
import { useComparisonMode } from '../../hooks/useComparisonMode'

interface GearTableProps {
  items: GearItemWithCalculated[]
  categories: Category[]
  filteredByCategory?: string[]
  onEdit: (gear: GearItemWithCalculated) => void
  onDelete: (ids: string[]) => void
  onSave: (gear: GearItemWithCalculated) => void
  onUpdateItem: (id: string, field: string, value: GearFieldValue) => void
  showCheckboxes: boolean
  onToggleCheckboxes?: () => void
  onShowForm: () => void
  onShowBulkUrlInput?: () => void
  onCreate?: (gear: any) => void
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
}

const GearTable: React.FC<GearTableProps> = React.memo(({
  items,
  categories,
  filteredByCategory = [],
  onEdit,
  onDelete,
  onSave,
  onUpdateItem,
  showCheckboxes,
  onToggleCheckboxes,
  onShowForm,
  onShowBulkUrlInput,
  onCreate,
  currentView,
  onViewChange
}) => {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [changedFields, setChangedFields] = useState<Record<string, Set<string>>>({})
  const [quantityDisplayMode, setQuantityDisplayMode] = useState<QuantityDisplayMode>('owned')

  // ソート処理
  const processedItems = useMemo(() => {
    // 安全性チェック: itemsが配列でない場合は空配列を使用
    const safeItems = Array.isArray(items) ? items : [];

    // カテゴリフィルタリング
    const filteredItems = filteredByCategory.length > 0
      ? safeItems.filter(item =>
          item.category && filteredByCategory.includes(item.category.name)
        )
      : safeItems;

    // 季節の順序定義
    const seasonOrder: Record<string, number> = {
      'spring': 0,
      'summer': 1,
      'fall': 2,
      'winter': 3
    }

    // ソート
    return [...filteredItems].sort((a, b) => {
      let aVal: any, bVal: any

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'category':
          aVal = a.category?.name || ''
          bVal = b.category?.name || ''
          break
        case 'weight':
          aVal = a.totalWeight
          bVal = b.totalWeight
          break
        case 'shortage':
          aVal = a.shortage
          bVal = b.shortage
          break
        case 'owned':
          aVal = a.ownedQuantity
          bVal = b.ownedQuantity
          break
        case 'required':
          aVal = a.requiredQuantity
          bVal = b.requiredQuantity
          break
        case 'priority':
          aVal = a.priority
          bVal = b.priority
          break
        case 'price':
          aVal = a.priceCents || 0
          bVal = b.priceCents || 0
          break
        case 'season':
          // 複数季節の場合は最初の季節で比較
          aVal = a.seasons && a.seasons.length > 0 ? seasonOrder[a.seasons[0]] ?? 999 : 999
          bVal = b.seasons && b.seasons.length > 0 ? seasonOrder[b.seasons[0]] ?? 999 : 999
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [items, filteredByCategory, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleQuantityDisplayModeChange = () => {
    setQuantityDisplayMode(prev => {
      if (prev === 'owned') return 'need'
      if (prev === 'need') return 'all'
      return 'owned'
    })
  }

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(processedItems.map(item => item.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      // Compareモード時は最大3件まで
      if (isCompareMode && selectedIds.length >= MAX_COMPARE_ITEMS) {
        return
      }
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id))
    }
  }

  const handleBulkDelete = () => {
    if (selectedIds.length > 0) {
      onDelete(selectedIds)
      setSelectedIds([])
    }
  }

  // ========================================
  // Compareモード関連の状態と設定
  // ========================================
  const isCompareMode = currentView === 'compare'
  const MAX_COMPARE_ITEMS = 4

  // Compareモード時の表示制御
  // - Compareモード: チェックボックスあり、編集不可
  // - 通常の編集モード: チェックボックスあり、編集可能
  // - 通常の表示モード: チェックボックスなし、編集不可
  const shouldShowCheckboxes = showCheckboxes || isCompareMode
  const isEditable = !isCompareMode && showCheckboxes

  // ========================================
  // 選択関連の状態
  // ========================================
  const isAllSelected = processedItems.length > 0 && selectedIds.length === processedItems.length
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < processedItems.length

  const selectedItems = useMemo(() =>
    processedItems.filter(item => selectedIds.includes(item.id)),
    [processedItems, selectedIds]
  )

  // チェックボックスが非表示になったら選択をクリア
  useEffect(() => {
    if (!showCheckboxes) {
      setSelectedIds([])
      setChangedFields({})
    }
  }, [showCheckboxes])

  // ========================================
  // 比較モードロジック（useComparisonMode フックを使用）
  // ========================================
  const {
    showComparisonModal,
    validationResult,
    openComparison: handleCompare,
    closeComparison: handleCloseComparisonModal,
    adoptItem: handleAdoptItem,
    previewItemId,
    previewAdopt: handlePreviewAdopt,
  } = useComparisonMode({
    selectedItems,
    onUpdateItem: async (id, field, value) => {
      await onUpdateItem(id, field, value)
    },
    onClearSelection: () => setSelectedIds([]),
    onRemoveItem: (itemId) => {
      setSelectedIds(prev => prev.filter(id => id !== itemId))
    },
  })

  // ========================================
  // フィールド編集ハンドラー
  // ========================================

  const handleFieldChange = useCallback(async (id: string, field: string, value: GearFieldValue) => {
    // 変更されたフィールドを記録
    setChangedFields(prev => {
      const updated = { ...prev }
      if (!updated[id]) {
        updated[id] = new Set()
      } else {
        // Setを正しくコピー
        updated[id] = new Set(updated[id])
      }
      updated[id].add(field)
      return updated
    })

    try {
      await onUpdateItem(id, field, value)

      // API呼び出し成功後、該当フィールドのハイライトをクリア
      setChangedFields(prev => {
        const updated = { ...prev }
        if (updated[id]) {
          updated[id] = new Set(updated[id])
          updated[id].delete(field)
          // すべてのフィールドがクリアされたらidも削除
          if (updated[id].size === 0) {
            delete updated[id]
          }
        }
        return updated
      })
    } catch (err) {
      // エラー時はハイライトを残す
      console.error('Failed to update field:', err)
    }
  }, [onUpdateItem])

  // ========================================
  // レンダリング
  // ========================================

  // Compareモード時の比較表示（縦型テーブル）
  if (isCompareMode && showComparisonModal && selectedItems.length >= 2) {
    return (
      <ComparisonTable
        items={selectedItems}
        onClose={handleCloseComparisonModal}
        onAdopt={handleAdoptItem}
        onPreviewAdopt={handlePreviewAdopt}
        previewItemId={previewItemId}
      />
    )
  }

  // 通常のテーブル表示
  return (
    <>
      <Card variant="default">
        {/* ヘッダー */}
        <GearListHeader
          itemCount={processedItems.length}
          currentView={currentView}
          onViewChange={onViewChange}
          showCheckboxes={shouldShowCheckboxes}
          onToggleCheckboxes={isCompareMode ? undefined : onToggleCheckboxes}
          onShowForm={onShowForm}
          onShowBulkUrlInput={onShowBulkUrlInput}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />

      {/* 一括操作バー（チェックボックス表示時のみ） */}
      {shouldShowCheckboxes && (
        <div style={{ padding: `${SPACING_SCALE.base}px` }}>
          <BulkActionBar
            selectedCount={selectedIds.length}
            totalCount={processedItems.length}
            allSelected={selectedIds.length === processedItems.length && processedItems.length > 0}
            onSelectAll={handleSelectAll}
            onClearSelection={() => setSelectedIds([])}
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
        <table className="w-full">
          <TableHeader
            showCheckboxes={shouldShowCheckboxes}
            isAllSelected={isAllSelected}
            isPartiallySelected={isPartiallySelected}
            sortField={sortField}
            sortDirection={sortDirection}
            quantityDisplayMode={quantityDisplayMode}
            onSelectAll={handleSelectAll}
            onSort={handleSort}
            onQuantityDisplayModeChange={handleQuantityDisplayModeChange}
            showEditColumn={!isEditable}
          />
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {processedItems.map((item) => (
              <TableRow
                key={item.id}
                item={item}
                categories={categories}
                showCheckboxes={shouldShowCheckboxes}
                isSelected={selectedIds.includes(item.id)}
                changedFields={changedFields[item.id]}
                quantityDisplayMode={quantityDisplayMode}
                onSelectItem={handleSelectItem}
                onUpdateItem={handleFieldChange}
                isEditable={isEditable}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
    </>
  )
}) as React.FC<GearTableProps>

export default GearTable
