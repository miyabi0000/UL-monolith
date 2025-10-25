import React, { useState, useMemo, useEffect } from 'react'
import { GearItemWithCalculated, Category } from '../utils/types'
import {
  COLORS,
  SPACING_SCALE,
  FONT_SCALE,
  RADIUS_SCALE,
  getTableRowStyle,
  getTableHeaderStyle,
  getInputStyle,
  getDropdownStyle,
  getDropdownItemStyle,
  getPriorityColor,
  getCategoryBadgeStyle,
  getLinkStyle
} from '../utils/designSystem'
import Card from './ui/Card'
import Button from './ui/Button'
import BulkActionMenu from './BulkActionMenu'
import BulkActionBar from './BulkActionBar'

// Price formatting helper
const formatPrice = (priceCents?: number) => {
  if (!priceCents) return '-'
  
  const price = priceCents / 100
  
  // Detect currency based on price range (simple heuristic)
  if (price > 1000) {
    // Assume JPY for larger numbers
    return `¥${Math.round(price).toLocaleString()}`
  } else {
    // Assume USD for smaller numbers
    return `$${price.toFixed(2)}`
  }
}

interface GearTableProps {
  items: GearItemWithCalculated[]
  categories: Category[]
  filteredByCategory?: string[]
  onEdit: (gear: GearItemWithCalculated) => void
  onDelete: (ids: string[]) => void
  onSave: (gear: GearItemWithCalculated) => void
  onUpdateItem: (id: string, field: string, value: any) => void
  showCheckboxes: boolean
  onToggleCheckboxes?: () => void
  onShowForm: () => void
  onRefresh?: () => void
}

type SortField = 'name' | 'category' | 'weight' | 'shortage' | 'priority' | 'price'
type SortDirection = 'asc' | 'desc'

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
  onRefresh
}) => {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

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
    }
  }, [showCheckboxes])

  return (
    <Card variant="default">
      {/* ヘッダー */}
      <div
        className="flex justify-between items-center"
        style={{
          padding: `${SPACING_SCALE.md}px ${SPACING_SCALE.lg}px`,
          borderBottom: `1px solid ${COLORS.gray[200]}`,
        }}
      >
        <h3
          className="font-semibold"
          style={{
            color: COLORS.text.primary,
            fontSize: `${FONT_SCALE.base}px`
          }}
        >
          GEAR LIST
        </h3>
        <div className="flex items-center gap-2">
          <span
            style={{ color: COLORS.text.secondary, fontSize: `${FONT_SCALE.sm}px` }}
          >
            {processedItems.length} items
          </span>
          <button
            onClick={onShowForm}
            className="font-semibold transition-opacity hover:opacity-80"
            style={{
              backgroundColor: COLORS.gray[700],
              color: COLORS.white,
              padding: `${SPACING_SCALE.sm}px ${SPACING_SCALE.md}px`,
              fontSize: `${FONT_SCALE.sm}px`,
              borderRadius: `${RADIUS_SCALE.base}px`,
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
          >
            + ADD
          </button>
          {onToggleCheckboxes && (
            <BulkActionMenu
              showCheckboxes={showCheckboxes}
              onToggleCheckboxes={onToggleCheckboxes}
              onRefresh={onRefresh}
            />
          )}
        </div>
      </div>

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

      {/* 旧削除ボタンエリア（削除） */}
      {false && showCheckboxes && selectedIds.length > 0 && (
        <div
          className="border-b flex items-center justify-end"
          style={{
            borderBottomColor: COLORS.gray[200],
            padding: `${SPACING_SCALE.base}px`,
            gap: `${SPACING_SCALE.base}px`
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-xs"
              style={{ color: COLORS.text.secondary }}
            >
              {selectedIds.length} selected
            </span>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead style={getTableHeaderStyle()}>
            <tr>
              {showCheckboxes && (
                <th className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={input => {
                      if (input) input.indeterminate = isPartiallySelected
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                  />
                </th>
              )}
              <th
                className="px-4 py-3 text-center font-medium"
                style={{ color: COLORS.text.secondary, fontSize: `${FONT_SCALE.sm}px` }}
              >
                Image
              </th>
              <th
                className="px-4 py-3 text-left font-medium cursor-pointer hover:opacity-70"
                style={{ color: COLORS.text.secondary, fontSize: `${FONT_SCALE.sm}px` }}
                onClick={() => handleSort('name')}
              >
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-center font-medium cursor-pointer hover:opacity-70"
                style={{ color: COLORS.text.secondary, fontSize: `${FONT_SCALE.sm}px` }}
                onClick={() => handleSort('category')}
              >
                Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-center font-medium"
                style={{ color: COLORS.text.secondary, fontSize: `${FONT_SCALE.sm}px` }}
              >
                Own/Need
              </th>
              <th
                className="px-4 py-3 text-center font-medium cursor-pointer hover:opacity-70"
                style={{ color: COLORS.text.secondary, fontSize: `${FONT_SCALE.sm}px` }}
                onClick={() => handleSort('weight')}
              >
                Weight {sortField === 'weight' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-center font-medium cursor-pointer hover:opacity-70"
                style={{ color: COLORS.text.secondary, fontSize: `${FONT_SCALE.sm}px` }}
                onClick={() => handleSort('priority')}
              >
                Priority {sortField === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-center font-medium cursor-pointer hover:opacity-70"
                style={{ color: COLORS.text.secondary, fontSize: `${FONT_SCALE.sm}px` }}
                onClick={() => handleSort('price')}
              >
                Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-center font-medium"
                style={{ color: COLORS.text.secondary, fontSize: `${FONT_SCALE.sm}px` }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody
            className="divide-y"
            style={{
              backgroundColor: COLORS.white,
              borderColor: COLORS.gray[200],
            }}
          >
            {processedItems.map((item) => (
              <tr 
                key={item.id} 
                className="transition-colors hover:opacity-90"
                style={getTableRowStyle(showCheckboxes && selectedIds.includes(item.id))}
              >
                {showCheckboxes && (
                  <td className="px-2 py-1 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                      className="rounded w-3 h-3"
                      style={{
                        borderColor: COLORS.gray[700],
                        color: COLORS.gray[700]
                      }}
                    />
                  </td>
                )}
                <td className="px-2 py-1 text-center" style={{ height: '64px' }}>
                  {item.imageUrl ? (
                    <div className="flex items-center justify-center h-[56px]">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="max-w-[80px] max-h-[56px] w-auto h-auto object-contain"
                        style={{ borderRadius: `${RADIUS_SCALE.base}px` }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[56px]">
                      <span
                        className="text-xs"
                        style={{ color: COLORS.text.muted }}
                      >
                        -
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-2 py-1">
                  <div className="text-left">
                    <div
                      className="text-sm font-medium break-words"
                      style={{ color: COLORS.text.primary }}
                    >
                      {item.productUrl ? (
                        <a
                          href={item.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline transition-colors"
                          style={getLinkStyle()}
                        >
                          {item.name}
                        </a>
                      ) : (
                        item.name
                      )}
                    </div>
                    {item.brand && (
                      <div
                        className="text-xs break-words"
                        style={{ color: COLORS.text.secondary }}
                      >
                        {item.brand}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-center">
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium inline-block"
                    style={getCategoryBadgeStyle(item.category?.color)}
                  >
                    {item.category?.name || 'Other'}
                  </span>
                </td>
                <td
                  className="px-2 py-1 whitespace-nowrap text-xs text-center"
                  style={{ color: COLORS.text.primary }}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <select
                      value={item.ownedQuantity}
                      onChange={(e) => onUpdateItem(item.id, 'ownedQuantity', parseInt(e.target.value))}
                      className="w-8 text-xs bg-transparent focus:outline-none focus:ring-0 border-none appearance-none cursor-pointer text-center"
                    >
                      {Array.from({ length: 11 }, (_, i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                    <span className="text-gray-400">/</span>
                    <select
                      value={item.requiredQuantity}
                      onChange={(e) => onUpdateItem(item.id, 'requiredQuantity', parseInt(e.target.value))}
                      className="w-8 text-xs bg-transparent focus:outline-none focus:ring-0 border-none appearance-none cursor-pointer text-center"
                    >
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                </td>
                <td
                  className="px-2 py-1 whitespace-nowrap text-xs text-center"
                  style={{ color: COLORS.text.primary }}
                >
                  {item.weightGrams ? `${item.totalWeight}g` : '-'}
                  {item.weightGrams && (
                    <div
                      className="text-xs"
                      style={{ color: COLORS.text.secondary }}
                    >
                      ({item.weightGrams}g × {item.requiredQuantity})
                    </div>
                  )}
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getPriorityColor(item.priority) }}
                    />
                    <select
                      value={item.priority}
                      onChange={(e) => onUpdateItem(item.id, 'priority', parseInt(e.target.value))}
                      className="text-xs bg-transparent focus:outline-none focus:ring-0 border-none appearance-none cursor-pointer"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                    </select>
                  </div>
                </td>
                <td
                  className="px-2 py-1 whitespace-nowrap text-xs text-center"
                  style={{ color: COLORS.text.primary }}
                >
                  {formatPrice(item.priceCents)}
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-xs font-medium text-center relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenDropdown(openDropdown === item.id ? null : item.id)
                    }}
                    className="p-0.5 rounded-full transition-colors text-xs hover:bg-gray-100"
                    style={{ color: COLORS.text.muted }}
                  >
                    ⋮
                  </button>

                  {openDropdown === item.id && (
                    <>
                      <div
                        className="fixed inset-0"
                        style={{ zIndex: 9998 }}
                        onClick={() => setOpenDropdown(null)}
                      />
                      <div
                        className="absolute right-0 mt-1 shadow-lg min-w-[100px]"
                        style={{
                          ...getDropdownStyle(),
                          zIndex: 9999,
                          borderRadius: `${RADIUS_SCALE.md}px`,
                          padding: `${SPACING_SCALE.xs}px 0`
                        }}
                      >
                        <button
                          onClick={() => {
                            onEdit(item)
                            setOpenDropdown(null)
                          }}
                          className="w-full text-left text-xs transition-colors block"
                          style={{
                            ...getDropdownItemStyle(),
                            padding: `${SPACING_SCALE.sm}px ${SPACING_SCALE.base}px`
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            onSave(item)
                            setOpenDropdown(null)
                          }}
                          className="w-full text-left text-xs transition-colors block"
                          style={{
                            ...getDropdownItemStyle(),
                            padding: `${SPACING_SCALE.sm}px ${SPACING_SCALE.base}px`
                          }}
                        >
                          Save
                        </button>
                        <hr
                          style={{
                            borderColor: COLORS.gray[200],
                            margin: `${SPACING_SCALE.xs}px 0`
                          }}
                        />
                        <button
                          onClick={() => {
                            onDelete([item.id])
                            setOpenDropdown(null)
                          }}
                          className="w-full text-left text-xs transition-colors block hover:bg-red-50"
                          style={{
                            color: COLORS.accent,
                            padding: `${SPACING_SCALE.sm}px ${SPACING_SCALE.base}px`
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}) as React.FC<GearTableProps>

export default GearTable


