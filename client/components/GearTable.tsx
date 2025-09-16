import React, { useState, useMemo, useEffect, useRef } from 'react'
import { GearItemWithCalculated } from '../utils/types'
import { COLORS } from '../utils/colors'
import {
  getTableRowStyle,
  getTableHeaderStyle,
  getInputStyle,
  getButtonStyle,
  getDropdownStyle,
  getDropdownItemStyle,
  getPriorityColor,
  getCategoryBadgeStyle,
  getLinkStyle
} from '../utils/colorHelpers'

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
  onEdit: (gear: GearItemWithCalculated) => void
  onDelete: (ids: string[]) => void
  onSave: (gear: GearItemWithCalculated) => void
  onUpdateItem: (id: string, field: string, value: any) => void
  showCheckboxes: boolean
}

type SortField = 'name' | 'category' | 'weight' | 'shortage' | 'priority' | 'price'
type SortDirection = 'asc' | 'desc'

const GearTable: React.FC<GearTableProps> = React.memo(({ items, onEdit, onDelete, onSave, onUpdateItem, showCheckboxes }) => {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // ソート・フィルタ処理
  const processedItems = useMemo(() => {
    // 安全性チェック: itemsが配列でない場合は空配列を使用
    const safeItems = Array.isArray(items) ? items : [];
    let filtered = safeItems;
    
    // カテゴリフィルタ
    if (filterCategory) {
      filtered = safeItems.filter(item => 
        item.category?.name.toLowerCase().includes(filterCategory.toLowerCase())
      )
    }

    // ソート
    return [...filtered].sort((a, b) => {
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
  }, [items, sortField, sortDirection, filterCategory])

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      setOpenDropdown(null)
    }
    
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdown])

  // Clear selected items when checkboxes are hidden
  useEffect(() => {
    if (!showCheckboxes) {
      setSelectedIds([])
    }
  }, [showCheckboxes])

  return (
    <div>
      {/* フィルタ・ソート */}
      <div 
        className="p-4 border-b flex gap-4 items-center"
        style={{ borderBottomColor: COLORS.primary.medium }}
      >
        <div className="flex-1">
          <input
            type="text"
            placeholder="Filter by category..."
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-md text-sm"
            style={getInputStyle()}
          />
        </div>
        {showCheckboxes && selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span 
              className="text-sm"
              style={{ color: COLORS.text.secondary }}
            >
              {selectedIds.length} selected
            </span>
            <button
              onClick={handleDelete}
              className="px-3 py-1 rounded-md text-sm font-medium transition-colors"
              style={getButtonStyle('danger')}
            >
              Delete Selected
            </button>
          </div>
        )}
        <div 
          className="text-sm"
          style={{ color: COLORS.text.secondary }}
        >
          {processedItems.length} items
        </div>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead style={getTableHeaderStyle()}>
            <tr>
              {showCheckboxes && (
                <th className="px-4 py-3 text-left">
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
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors"
                style={{
                  color: COLORS.text.secondary,
                  '&:hover': { backgroundColor: COLORS.primary.light }
                }}
                onClick={() => handleSort('name')}
              >
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors"
                style={{
                  color: COLORS.text.secondary,
                  '&:hover': { backgroundColor: COLORS.primary.light }
                }}
                onClick={() => handleSort('category')}
              >
                Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: COLORS.text.secondary }}
              >
                Qty (Own/Need)
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors"
                style={{
                  color: COLORS.text.secondary,
                  '&:hover': { backgroundColor: COLORS.primary.light }
                }}
                onClick={() => handleSort('weight')}
              >
                Weight {sortField === 'weight' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors"
                style={{
                  color: COLORS.text.secondary,
                  '&:hover': { backgroundColor: COLORS.primary.light }
                }}
                onClick={() => handleSort('shortage')}
              >
                Missing {sortField === 'shortage' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors"
                style={{
                  color: COLORS.text.secondary,
                  '&:hover': { backgroundColor: COLORS.primary.light }
                }}
                onClick={() => handleSort('priority')}
              >
                Priority {sortField === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors"
                style={{
                  color: COLORS.text.secondary,
                  '&:hover': { backgroundColor: COLORS.primary.light }
                }}
                onClick={() => handleSort('price')}
              >
                Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
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
                  <td className="px-4 py-4 whitespace-nowrap">
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
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    {item.productUrl && (
                      <img
                        src={item.productUrl}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="text-left">
                      <div 
                        className="text-sm font-medium"
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
                          className="text-sm"
                          style={{ color: COLORS.text.secondary }}
                        >
                          {item.brand}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span 
                    className="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                    style={getCategoryBadgeStyle(item.category?.color)}
                  >
                    {item.category?.name || 'Other'}
                  </span>
                </td>
                <td 
                  className="px-4 py-4 whitespace-nowrap text-sm"
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
                  className="px-4 py-4 whitespace-nowrap text-sm"
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
                <td className="px-4 py-4 whitespace-nowrap">
                  {item.shortage > 0 ? (
                    <span 
                      className="font-medium"
                      style={{ color: COLORS.accent }}
                    >
                      {item.shortage}
                    </span>
                  ) : (
                    <span 
                      style={{ color: COLORS.success }}
                    >
                      ✓
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
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
                  className="px-4 py-4 whitespace-nowrap text-sm"
                  style={{ color: COLORS.text.primary }}
                >
                  {formatPrice(item.priceCents)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenDropdown(openDropdown === item.id ? null : item.id)
                    }}
                    className="p-1 rounded-full transition-colors text-sm"
                    style={{
                      color: COLORS.text.muted,
                      '&:hover': {
                        color: COLORS.text.secondary,
                        backgroundColor: COLORS.primary.light
                      }
                    }}
                  >
                    ⋮
                  </button>
                  
                  {openDropdown === item.id && (
                    <div 
                      className="absolute right-0 top-full mt-1 rounded-md shadow-md z-50 min-w-[100px] py-1"
                      style={getDropdownStyle()}
                    >
                      <button
                        onClick={() => {
                          onEdit(item)
                          setOpenDropdown(null)
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs transition-colors block"
                        style={getDropdownItemStyle()}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          onSave(item)
                          setOpenDropdown(null)
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs transition-colors block"
                        style={{
                          color: COLORS.primary.dark,
                          '&:hover': { backgroundColor: COLORS.primary.light }
                        }}
                      >
                        Save
                      </button>
                      <hr 
                        className="my-0.5"
                        style={{ borderColor: COLORS.primary.light }}
                      />
                      <button
                        onClick={() => {
                          onDelete([item.id])
                          setOpenDropdown(null)
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs transition-colors block"
                        style={{
                          color: COLORS.accent,
                          '&:hover': { backgroundColor: '#FEF2F2' }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})

export default GearTable


