import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { GearItemWithCalculated, Category, GearFieldValue } from '../../utils/types'
import { SPACING_SCALE } from '../../utils/designSystem'
import Card from '../ui/Card'
import GearListHeader from '../GearListHeader'
import BulkActionBar from '../BulkActionBar'
import TableHeader, { SortField, SortDirection } from './TableHeader'
import TableRow from './TableRow'

type ViewMode = 'table' | 'card'

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
  onCreate,
  currentView,
  onViewChange
}) => {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [changedFields, setChangedFields] = useState<Record<string, Set<string>>>({})

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
        case 'priority':
          aVal = a.priority
          bVal = b.priority
          break
        case 'price':
          aVal = a.priceCents || 0
          bVal = b.priceCents || 0
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

  const isAllSelected = processedItems.length > 0 && selectedIds.length === processedItems.length
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < processedItems.length

  // Clear selected items when checkboxes are hidden
  useEffect(() => {
    if (!showCheckboxes) {
      setSelectedIds([])
      setChangedFields({})
    }
  }, [showCheckboxes])

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

  return (
    <>
      <Card variant="default">
        {/* 共通ヘッダー */}
        <GearListHeader
          itemCount={processedItems.length}
          currentView={currentView}
          onViewChange={onViewChange}
          showCheckboxes={showCheckboxes}
          onToggleCheckboxes={onToggleCheckboxes}
          onShowForm={onShowForm}
        />

      {/* 一括操作バー */}
      {showCheckboxes && (
        <div style={{ padding: `${SPACING_SCALE.base}px` }}>
          <BulkActionBar
            selectedCount={selectedIds.length}
            totalCount={processedItems.length}
            allSelected={selectedIds.length === processedItems.length && processedItems.length > 0}
            onSelectAll={handleSelectAll}
            onClearSelection={() => setSelectedIds([])}
            onBulkDelete={handleBulkDelete}
          />
        </div>
      )}

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <TableHeader
            showCheckboxes={showCheckboxes}
            isAllSelected={isAllSelected}
            isPartiallySelected={isPartiallySelected}
            sortField={sortField}
            sortDirection={sortDirection}
            onSelectAll={handleSelectAll}
            onSort={handleSort}
          />
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {processedItems.map((item) => (
              <TableRow
                key={item.id}
                item={item}
                categories={categories}
                showCheckboxes={showCheckboxes}
                isSelected={selectedIds.includes(item.id)}
                changedFields={changedFields[item.id]}
                onSelectItem={handleSelectItem}
                onUpdateItem={handleFieldChange}
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

