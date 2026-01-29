import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Category, ChartData, ChartViewMode, GearFieldValue, GearItemWithCalculated, QuantityDisplayMode } from '../utils/types'
import { COLORS } from '../utils/designSystem'
import { darkenColor, darkenHslColor, generateItemColor } from '../utils/colorHelpers'
import { getQuantityForDisplayMode } from '../utils/chartHelpers'
import Card from './ui/Card'
import GearDetailPanel, { PanelMode } from './GearDetailPanel'

// ==================== 定数 ====================
// デザインシステムに基づいたチャート設定
const CHART_CONFIG = {
  height: {
    mobile: 350,
    tablet: 450,
    desktop: 500
  },
  outerRadius: {
    mobile: { outer: 120, inner: 85 },
    tablet: { outer: 160, inner: 115 },
    desktop: { outer: 200, inner: 140 }
  },
  innerRadius: {
    mobile: { outer: 85, inner: 55 },
    tablet: { outer: 115, inner: 75 },
    desktop: { outer: 140, inner: 95 }
  },
  centerMaxWidth: {
    mobile: 100,
    tablet: 140,
    desktop: 180
  }
} as const

const DEFAULT_COLOR = '#6B7280'
const SELECTED_COLOR = '#404040' // Gray color for selection (gray.700)
const SELECTED_STROKE_WIDTH = 3

// ==================== ヘルパー関数 ====================
// Color utilities moved to /client/utils/colorHelpers.ts

const formatValue = (value: number, mode: ChartViewMode): string => {
  if (mode === 'cost') {
    return `¥${Math.round(value / 100).toLocaleString()}`
  }
  return `${value}g`
}

const getItemValue = (item: GearItemWithCalculated, viewMode: ChartViewMode, quantityMode: QuantityDisplayMode): number => {
  const quantity = getQuantityForDisplayMode(item, quantityMode)
  const unitValue = viewMode === 'cost' ? (item.priceCents || 0) : (item.weightGrams || 0)
  return unitValue * quantity
}

type GearItemWithPercentages = GearItemWithCalculated & { systemPercentage: number; totalPercentage: number }

// ==================== メインコンポーネント ====================
interface GearChartProps {
  data: ChartData[]
  totalWeight: number
  totalCost: number
  viewMode: ChartViewMode
  quantityDisplayMode: QuantityDisplayMode
  selectedCategories: string[]
  onCategorySelect: (categories: string[]) => void
  onViewModeChange: (mode: ChartViewMode) => void
  onQuantityDisplayModeChange: (mode: QuantityDisplayMode) => void
  items: GearItemWithCalculated[] // すべてのギアアイテム
  categories: Category[] // カテゴリリスト
  onEdit: (item: GearItemWithCalculated) => void
  onDelete: (id: string) => void
  onUpdateItem: (id: string, field: string, value: GearFieldValue) => void // フィールド更新用
  onShowForm?: () => void // + ADDボタン用（Manual Add）
  onShowUrlImport?: () => void // + ADDボタン用（From URL）
  onShowCategoryManager?: () => void // カテゴリ管理用
  gearViewMode?: 'table' | 'card' | 'compare' // ギア表示モード
  onGearViewModeChange?: (mode: 'table' | 'card' | 'compare') => void // モード変更ハンドラ
  showCheckboxes: boolean // チェックボックス表示状態
  onToggleCheckboxes: () => void // チェックボックス切り替え
}

const GearChart: React.FC<GearChartProps> = React.memo(({
  data,
  totalWeight,
  totalCost,
  viewMode,
  quantityDisplayMode,
  selectedCategories,
  onCategorySelect,
  onViewModeChange,
  onQuantityDisplayModeChange,
  items,
  categories,
  onEdit,
  onDelete,
  onUpdateItem,
  onShowForm,
  onShowUrlImport,
  onShowCategoryManager,
  gearViewMode,
  onGearViewModeChange,
  showCheckboxes,
  onToggleCheckboxes
}) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [selectedCategoryForPanel, setSelectedCategoryForPanel] = useState<string | null>(null)
  const [panelMode, setPanelMode] = useState<PanelMode>('overview')
  const [centerPulse, setCenterPulse] = useState(false)
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [showAddMenu, setShowAddMenu] = useState(false) // アクションメニュー用
  const [isChartCollapsed, setIsChartCollapsed] = useState(false) // グラフ折りたたみ状態

  // レスポンシブ対応
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setScreenSize('mobile')
      } else if (width < 1024) {
        setScreenSize('tablet')
      } else {
        setScreenSize('desktop')
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // メニューを閉じる（クリックアウトサイド）
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showAddMenu && !target.closest('.add-menu-container')) {
        setShowAddMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showAddMenu])

  // チャート設定を画面サイズに応じて取得
  const chartHeight = CHART_CONFIG.height[screenSize]
  const outerRadiusConfig = CHART_CONFIG.outerRadius[screenSize]
  const innerRadiusConfig = CHART_CONFIG.innerRadius[screenSize]
  const centerMaxWidth = CHART_CONFIG.centerMaxWidth[screenSize]

  // ==================== データ処理 ====================
  const displayData = useMemo(() => {
    return data.map(category => ({
      ...category,
      value: viewMode === 'cost' ? category.cost : category.weight
    }))
  }, [data, viewMode])

  const totalValue = viewMode === 'cost' ? totalCost : totalWeight

  const sortedData = useMemo(() => {
    return [...displayData].sort((a, b) => b.value - a.value).map(category => ({
      ...category,
      percentage: totalValue > 0 ? Math.round((category.value / totalValue) * 100) : 0,
      sortedItems: (category.items || [])
        .filter(item => getItemValue(item, viewMode, quantityDisplayMode) > 0)
        .sort((a, b) => getItemValue(b, viewMode, quantityDisplayMode) - getItemValue(a, viewMode, quantityDisplayMode))
        .map(item => {
          const itemValue = getItemValue(item, viewMode, quantityDisplayMode)
          return {
            ...item,
            systemPercentage: category.value > 0 ? Math.round((itemValue / category.value) * 100) : 0,
            totalPercentage: totalValue > 0 ? Math.round((itemValue / totalValue) * 100) : 0
          } satisfies GearItemWithPercentages
        }) as GearItemWithPercentages[]
    }))
  }, [displayData, totalValue, viewMode, quantityDisplayMode])

  // チャートで選択中のカテゴリ
  const selectedCategoryFromChart = selectedCategories.length === 1 ? selectedCategories[0] : null
  const selectedData = useMemo(
    () => (selectedCategoryFromChart ? sortedData.find(d => d.name === selectedCategoryFromChart) : null),
    [sortedData, selectedCategoryFromChart]
  )

  const outerPieData = useMemo(() => {
    return (selectedData?.sortedItems || []).map((item, index) => {
      const itemValue = getItemValue(item, viewMode, quantityDisplayMode)
      const fillColor = generateItemColor(
        selectedData?.color || DEFAULT_COLOR,
        index,
        selectedData?.sortedItems?.length || 1
      )
      return {
        name: item.name,
        value: itemValue,
        id: item.id,
        color: fillColor,
        brand: item.brand,
        ownedQuantity: item.ownedQuantity,
        requiredQuantity: item.requiredQuantity,
        shortage: item.shortage,
        priority: item.priority,
        percentage: item.totalPercentage,
        systemPercentage: item.systemPercentage
      }
    })
  }, [selectedData, viewMode, quantityDisplayMode])

  // ==================== イベントハンドラー（memo化） ====================
  const handleCategoryClick = useCallback((categoryName: string) => {
    if (selectedCategories.includes(categoryName)) {
      onCategorySelect([])
      setSelectedCategoryForPanel(null)
      setPanelMode('overview')
    } else {
      onCategorySelect([categoryName])
      setSelectedCategoryForPanel(categoryName)
      setPanelMode('category')
    }
    setSelectedItem(null)
  }, [selectedCategories, onCategorySelect])

  const handleItemClick = useCallback((itemId: string) => {
    if (selectedItem === itemId) {
      setSelectedItem(null)
      // カテゴリ選択中ならcategoryモードへ、未選択ならoverviewモードへ
      if (selectedCategoryForPanel) {
        setPanelMode('category')
      } else {
        setPanelMode('overview')
      }
    } else {
      setSelectedItem(itemId)
      setPanelMode('item')
    }
  }, [selectedItem, selectedCategoryForPanel])

  // CategorySummaryViewからのアイテムクリック
  const handlePanelItemClick = useCallback((itemId: string) => {
    setSelectedItem(itemId)
    setPanelMode('item')
  }, [])

  // 選択されたアイテムオブジェクトを取得
  const selectedItemData = useMemo(() => {
    if (!selectedItem || !items) return null
    return items.find(item => item.id === selectedItem) || null
  }, [selectedItem, items])

  const handleCenterClick = useCallback(() => {
    // 常にWeight/Cost切り替え（カテゴリ選択状態に関係なく）
    onViewModeChange(viewMode === 'weight' ? 'cost' : 'weight')

    // パルスアニメーション
    setCenterPulse(true)
    setTimeout(() => setCenterPulse(false), 600)
  }, [viewMode, onViewModeChange])

  // パンくずリスト用の選択中アイテム名を取得
  const selectedItemName = useMemo(() => {
    if (!selectedItem || !items) return null
    const item = items.find(i => i.id === selectedItem)
    return item?.name || null
  }, [selectedItem, items])

  // パンくずリストナビゲーションのハンドラ
  const handleBreadcrumbClick = useCallback((level: 'all' | 'category') => {
    if (level === 'all') {
      onCategorySelect([])
      setSelectedCategoryForPanel(null)
      setSelectedItem(null)
      setPanelMode('overview')
    } else if (level === 'category') {
      setSelectedItem(null)
      setPanelMode('category')
    }
  }, [onCategorySelect])

  // ==================== レンダリング ====================
  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      {/* メインコンテンツ - 統合レイアウト */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-x-auto">
        {/* グラフエリア */}
        <Card className={`flex flex-col min-w-0 flex-shrink-0 transition-all duration-300 ${isChartCollapsed ? 'w-12' : 'w-full lg:w-[40%]'}`}>
          {/* グラフヘッダー */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            {isChartCollapsed ? (
              <div className="flex items-center justify-center w-full">
                <button
                  onClick={() => setIsChartCollapsed(false)}
                  className="w-full flex flex-col items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors py-2"
                  aria-label="Expand chart"
                >
                  <svg
                    className="w-4 h-4 text-gray-600 dark:text-gray-400 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8M12 8l4 4-4 4" />
                  </svg>
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium" style={{ writingMode: 'vertical-rl' }}>
                    Chart
                  </span>
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chart</h3>
                <button
                  onClick={() => setIsChartCollapsed(true)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  aria-label="Collapse chart"
                >
                  <svg
                    className="w-4 h-4 text-gray-600 dark:text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {!isChartCollapsed && (
            <>
        {/* チャートエリア */}
        <div className="relative flex items-center justify-center flex-1 p-3" style={{ minHeight: chartHeight, maxHeight: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* 外側円 - アイテム（先に描画） */}
              {selectedCategoryFromChart && (
                <Pie
                  data={outerPieData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={outerRadiusConfig.outer}
                  innerRadius={outerRadiusConfig.inner}
                  onClick={(entry) => handleItemClick(entry.id)}
                  className="cursor-pointer"
                >
                  {outerPieData.map((item, index) => {
                    const fillColor = generateItemColor(
                      selectedData?.color || DEFAULT_COLOR,
                      index,
                      selectedData?.sortedItems?.length || 1
                    )
                    const isSelected = selectedItem === item.id
                    const darkenedFillColor = darkenHslColor(fillColor, 0.2)
                    const darkenedStrokeColor = darkenColor(selectedData?.color || DEFAULT_COLOR, 0.2)
                    return (
                      <Cell
                        key={`item-${index}`}
                        fill={isSelected ? darkenedFillColor : fillColor}
                        opacity={isSelected ? 1 : 0.85}
                        stroke={isSelected ? darkenedStrokeColor : COLORS.white}
                        strokeWidth={isSelected ? 2 : 1}
                        style={{
                          filter: isSelected ? `drop-shadow(0 0 6px ${darkenedStrokeColor}99)` : 'none',
                          transition: 'all 0.2s ease',
                          outline: 'none'
                        }}
                      />
                    )
                  })}
                </Pie>
              )}

              {/* 内側円 - カテゴリ（最後に描画して最上面に） */}
              <Pie
                data={sortedData.map(d => ({ ...d, color: d.color }))}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={innerRadiusConfig.outer}
                innerRadius={innerRadiusConfig.inner}
                onClick={(entry) => handleCategoryClick(entry.name)}
                className="cursor-pointer"
              >
                {sortedData.map((entry, index) => {
                  const isCategorySelected = selectedCategoryFromChart === entry.name
                  const hasSelection = selectedCategoryFromChart !== null
                  const darkenedFillColor = darkenColor(entry.color, 0.15)
                  const darkenedStrokeColor = darkenColor(entry.color, 0.2)
                  return (
                    <Cell
                      key={`category-${entry.name}`}
                      fill={isCategorySelected ? darkenedFillColor : entry.color}
                      stroke={isCategorySelected ? darkenedStrokeColor : COLORS.white}
                      strokeWidth={isCategorySelected ? 2 : 1}
                      opacity={hasSelection && !isCategorySelected ? 0.4 : 1}
                      className={hasSelection && !isCategorySelected ? 'hover:opacity-60' : ''}
                      style={{
                        filter: isCategorySelected ? `drop-shadow(0 0 6px ${darkenedStrokeColor}99)` : 'none',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  )
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* 中央表示 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="text-center cursor-pointer pointer-events-auto flex flex-col items-center justify-center"
              style={{
                width: innerRadiusConfig.inner * 2,
                height: innerRadiusConfig.inner * 2,
                borderRadius: '50%',
                transition: 'all 0.3s ease',
                backgroundColor: centerPulse ? 'rgba(64, 64, 64, 0.05)' : 'transparent',
                transform: centerPulse ? 'scale(1.05)' : 'scale(1)',
                boxShadow: centerPulse ? '0 0 20px rgba(64, 64, 64, 0.3)' : 'none'
              }}
              onClick={handleCenterClick}
            >
              {(() => {
                // レベル3: ギアアイテム選択時
                if (selectedItem && selectedData) {
                  const itemData = outerPieData.find(item => item.id === selectedItem)
                  if (itemData) {
                    return (
                      <>
                        <div
                          className="font-bold mb-1 text-gray-900 dark:text-gray-100"
                          style={{
                            fontSize: screenSize === 'mobile' ? '1rem' : '1.2rem'
                          }}
                        >
                          {formatValue(itemData.value, viewMode)}
                        </div>
                        <div
                          className="font-semibold mb-0.5 px-2 text-center overflow-hidden"
                          style={{
                            fontSize: screenSize === 'mobile' ? '0.65rem' : '0.75rem',
                            color: itemData.color,
                            maxWidth: centerMaxWidth - 20,
                            lineHeight: '1.2',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis'
                          }}
                          title={itemData.name}
                        >
                          {itemData.name}
                        </div>
                        {itemData.brand && (
                          <div
                            className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-2 text-center overflow-hidden"
                            style={{
                              fontSize: screenSize === 'mobile' ? '0.5rem' : '0.6rem',
                              maxWidth: centerMaxWidth - 20,
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis'
                            }}
                            title={itemData.brand}
                          >
                            {itemData.brand}
                          </div>
                        )}
                        <div
                          className="text-xs text-gray-500 dark:text-gray-400"
                          style={{
                            fontSize: screenSize === 'mobile' ? '0.55rem' : '0.6rem'
                          }}
                        >
                          {itemData.percentage}% of total
                        </div>
                      </>
                    )
                  }
                }

                // レベル2: カテゴリ選択時
                if (selectedCategoryFromChart && selectedData) {
                  return (
                    <>
                      <div
                        className="font-bold mb-1 text-gray-900 dark:text-gray-100"
                        style={{
                          fontSize: screenSize === 'mobile' ? '1.1rem' : '1.3rem'
                        }}
                      >
                        {formatValue(selectedData.value, viewMode)}
                      </div>
                      <div
                        className="uppercase tracking-wide font-bold mb-2"
                        style={{
                          fontSize: screenSize === 'mobile' ? '0.6rem' : '0.7rem',
                          color: selectedData.color
                        }}
                      >
                        {selectedCategoryFromChart}
                      </div>
                      <div
                        className="text-xs text-gray-500 dark:text-gray-400"
                        style={{
                          fontSize: screenSize === 'mobile' ? '0.55rem' : '0.65rem'
                        }}
                      >
                        {selectedData.percentage}% of total
                      </div>
                    </>
                  )
                }

                // レベル1: 未選択時
                return (
                  <>
                    <div
                      className="font-bold mb-1 text-gray-900 dark:text-gray-100"
                      style={{
                        fontSize: screenSize === 'mobile' ? '1.1rem' : '1.3rem'
                      }}
                    >
                      {formatValue(totalValue, viewMode)}
                    </div>
                    <div
                      className="uppercase tracking-wide font-bold text-gray-500 dark:text-gray-400"
                      style={{
                        fontSize: screenSize === 'mobile' ? '0.6rem' : '0.7rem'
                      }}
                    >
                      {viewMode === 'cost' ? 'TOTAL COST' : 'TOTAL WEIGHT'}
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Weight/Price表示セクション */}
        <div className="px-3 py-1.5 flex justify-center gap-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase">Weight:</span>
            <span className="text-[11px] font-semibold text-gray-900 dark:text-gray-100">{totalWeight.toLocaleString()}g</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase">Price:</span>
            <span className="text-[11px] font-semibold text-gray-900 dark:text-gray-100">¥{Math.round(totalCost / 100).toLocaleString()}</span>
          </div>
        </div>
            </>
          )}
      </Card>

        {/* Gear Detail Panel（右側パネル） */}
        <Card className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* パネルヘッダー */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2">
              {/* Owned/Need/All切り替え */}
              <div className="inline-flex rounded-lg p-0.5 bg-gray-100 dark:bg-gray-800">
                <button
                  onClick={() => onQuantityDisplayModeChange('owned')}
                  className={`w-14 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all duration-200 inline-flex items-center justify-center ${
                    quantityDisplayMode === 'owned'
                      ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  Owned
                </button>
                <button
                  onClick={() => onQuantityDisplayModeChange('need')}
                  className={`w-14 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all duration-200 inline-flex items-center justify-center ${
                    quantityDisplayMode === 'need'
                      ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  Need
                </button>
                <button
                  onClick={() => onQuantityDisplayModeChange('all')}
                  className={`w-14 px-2 py-0.5 rounded-md text-[10px] font-medium transition-all duration-200 inline-flex items-center justify-center ${
                    quantityDisplayMode === 'all'
                      ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  ALL
                </button>
              </div>

              {/* ナビゲーション切り替えボタン（リバースアイコン） */}
              <button
                onClick={() => handleBreadcrumbClick('all')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                aria-label="Reset to all items"
                title={selectedItem ? selectedItemName || 'Item' : selectedCategoryFromChart || 'All Items'}
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* 現在の状態表示 */}
              {(selectedCategoryFromChart || selectedItem) && (
                <div className="text-xs text-gray-500 dark:text-gray-400 max-w-[120px] truncate">
                  {selectedItem && selectedItemName ? selectedItemName : selectedCategoryFromChart}
                </div>
              )}
            </div>

            {/* 右側ボタン群 */}
            <div className="flex items-center gap-2">
              {/* アクションメニュー（ADD + Edit Mode統合） */}
              {onShowForm && (
                <div className="relative add-menu-container">
                  <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
                      showCheckboxes
                        ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Actions
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* ドロップダウンメニュー */}
                  {showAddMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                      <button
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                        onClick={() => {
                          onShowForm()
                          setShowAddMenu(false)
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Manually
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                        onClick={() => {
                          onShowUrlImport?.()
                          setShowAddMenu(false)
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Add from URL
                      </button>
                      {onShowCategoryManager && (
                        <>
                          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                          <button
                            className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                            onClick={() => {
                              onShowCategoryManager()
                              setShowAddMenu(false)
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Manage Categories
                          </button>
                        </>
                      )}
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      <button
                        className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center gap-2 ${
                          showCheckboxes
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => {
                          onToggleCheckboxes()
                          setShowAddMenu(false)
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        {showCheckboxes ? 'Exit Edit Mode' : 'Edit Mode'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ビュー切り替え (Card/Table/Compare) */}
              {onGearViewModeChange && (
                <div className="inline-flex rounded-lg p-0.5 bg-gray-100 dark:bg-gray-800">
                  <button
                    onClick={() => onGearViewModeChange('card')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                      gearViewMode === 'card'
                        ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                    aria-label="Card view"
                  >
                    Card
                  </button>
                  <button
                    onClick={() => onGearViewModeChange('table')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                      gearViewMode === 'table'
                        ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                    aria-label="Table view"
                  >
                    Table
                  </button>
                  <button
                    onClick={() => onGearViewModeChange('compare')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                      gearViewMode === 'compare'
                        ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                    aria-label="Comparison view"
                  >
                    Compare
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* パネルコンテンツ */}
          <div className="flex-1 min-h-0 overflow-hidden">
              <GearDetailPanel
                mode={panelMode}
                selectedItem={selectedItemData}
                selectedCategory={selectedCategoryForPanel}
                items={items}
                categories={categories}
                viewMode={viewMode}
                gearViewMode={gearViewMode}
                quantityDisplayMode={quantityDisplayMode}
                onQuantityDisplayModeChange={onQuantityDisplayModeChange}
                onEdit={onEdit}
                onDelete={onDelete}
                onUpdateItem={onUpdateItem}
                onItemClick={handlePanelItemClick}
                showCheckboxes={showCheckboxes}
                onToggleCheckboxes={onToggleCheckboxes}
                filteredByCategory={selectedCategories}
              />
          </div>
        </Card>
      </div>
    </div>
  )
})

GearChart.displayName = 'GearChart'

export default GearChart
