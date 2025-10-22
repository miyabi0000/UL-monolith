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
  onEdit: (gear: GearItemWithCalculated) => void
  onDelete: (ids: string[]) => void
  onSave: (gear: GearItemWithCalculated) => void
  onUpdateItem: (id: string, field: string, value: any) => void
  showCheckboxes: boolean
  onShowForm: () => void
}

type SortField = 'name' | 'category' | 'weight' | 'shortage' | 'priority' | 'price'
type SortDirection = 'asc' | 'desc'

const GearTable: React.FC<GearTableProps> = React.memo(({ items, categories, onEdit, onDelete, onSave, onUpdateItem, showCheckboxes, onShowForm }) => {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // ソート処理
  const processedItems = useMemo(() => {
    // 安全性チェック: itemsが配列でない場合は空配列を使用
    const safeItems = Array.isArray(items) ? items : [];

    // ソート
    return [...safeItems].sort((a, b) => {
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
  }, [items, sortField, sortDirection])

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

  const handleDelete = () => {
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
    <Card variant="square">
      {/* ヘッダー */}
      <div
        className="border-b flex justify-between items-center"
        style={{
          borderBottomColor: COLORS.primary.medium,
          padding: `${SPACING_SCALE.base}px`
        }}
      >
        <h3
          className="font-semibold"
          style={{
            color: COLORS.text.primary,
            fontSize: `${FONT_SCALE.sm}px`
          }}
        >
          GEAR LIST
        </h3>
        <div className="flex items-center gap-2">
          <span
            className="text-xs"
            style={{ color: COLORS.text.secondary }}
          >
            {processedItems.length} items
          </span>
          <button
            onClick={onShowForm}
            className="font-semibold transition-colors"
            style={{
              backgroundColor: COLORS.primary.light,
              color: COLORS.primary.dark,
              border: `1px solid ${COLORS.primary.medium}`,
              padding: `${SPACING_SCALE.sm}px ${SPACING_SCALE.md}px`,
              fontSize: `${FONT_SCALE.xs}px`,
              borderRadius: `${RADIUS_SCALE.base}px`
            }}
          >
            + ADD
          </button>
        </div>
      </div>

      {/* 削除ボタンエリア */}
      {showCheckboxes && selectedIds.length > 0 && (
        <div
          className="border-b flex items-center justify-end"
          style={{
            borderBottomColor: COLORS.primary.medium,
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
      <div>
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
                className="px-2 py-1 text-center text-xs font-medium uppercase tracking-wider"
                style={{ color: COLORS.text.secondary }}
              >
                Image
              </th>
              <th
                className="px-2 py-1 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors hover:bg-gray-50"
                style={{ color: COLORS.text.secondary }}
                onClick={() => handleSort('name')}
              >
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-2 py-1 text-center text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors hover:bg-gray-50"
                style={{ color: COLORS.text.secondary }}
                onClick={() => handleSort('category')}
              >
                Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-2 py-1 text-center text-xs font-medium uppercase tracking-wider"
                style={{ color: COLORS.text.secondary }}
              >
                Own/Need
              </th>
              <th
                className="px-2 py-1 text-center text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors hover:bg-gray-50"
                style={{ color: COLORS.text.secondary }}
                onClick={() => handleSort('weight')}
              >
                Weight {sortField === 'weight' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-2 py-1 text-center text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors hover:bg-gray-50"
                style={{ color: COLORS.text.secondary }}
                onClick={() => handleSort('priority')}
              >
                Priority {sortField === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-2 py-1 text-center text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors hover:bg-gray-50"
                style={{ color: COLORS.text.secondary }}
                onClick={() => handleSort('price')}
              >
                Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-2 py-1 text-center text-xs font-medium uppercase tracking-wider"
                style={{ color: COLORS.text.secondary }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody 
            className="divide-y"
            style={{
              backgroundColor: COLORS.white,
              borderColor: COLORS.primary.medium
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
                        borderColor: COLORS.primary.medium,
                        color: COLORS.primary.dark
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
                            borderColor: COLORS.primary.light,
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
})

export default GearTable


