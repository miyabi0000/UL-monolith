import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Category, ChartData, ChartViewMode, GearFieldValue, GearItemWithCalculated, QuantityDisplayMode, WeightBreakdown, ULStatus, UL_THRESHOLDS, WEIGHT_CLASS_COLORS, ChartFocus, ChartScope, DUAL_RING_COLORS } from '../utils/types'
import { COLORS } from '../utils/designSystem'
import { darkenColor, darkenHslColor, generateItemColor } from '../utils/colorHelpers'
import { getQuantityForDisplayMode, calculateInnerRingData, calculateOuterRingData, filterByScope, sumWeight } from '../utils/chartHelpers'
import Card from './ui/Card'
import GearDetailPanel, { PanelMode } from './GearDetailPanel'
import ActiveCalloutShape from './charts/ActiveCalloutShape'

// ==================== SVGアイコン ====================
const BackpackIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 10V18C5 19.1 5.9 20 7 20H17C18.1 20 19 19.1 19 18V10" />
    <path d="M9 20V14H15V20" />
    <path d="M5 10C5 7.79 6.79 6 9 6H15C17.21 6 19 7.79 19 10" />
    <path d="M9 6V4C9 3.45 9.45 3 10 3H14C14.55 3 15 3.45 15 4V6" />
    <path d="M12 10V12" />
  </svg>
)

const ShirtIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 3.46L16 2.79V2C16 1.45 15.55 1 15 1H9C8.45 1 8 1.45 8 2V2.79L3.62 3.46C3.24 3.52 3 3.86 3 4.24V8L8 10V22C8 22.55 8.45 23 9 23H15C15.55 23 16 22.55 16 22V10L21 8V4.24C21 3.86 20.76 3.52 20.38 3.46Z" />
  </svg>
)

const UtensilsIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2V11C3 12.1 3.9 13 5 13H6V22H8V13H9C10.1 13 11 12.1 11 11V2" />
    <path d="M7 2V8" />
    <path d="M17 2C17 2 21 3 21 8C21 13 17 14 17 14V22H15V14C15 14 11 13 11 8C11 3 15 2 15 2" />
  </svg>
)

const ScaleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3V21" />
    <path d="M3 12H21" />
    <path d="M6 8L12 3L18 8" />
    <path d="M4 16H8L6 21H10" />
    <path d="M14 16H20L18 21H22" />
  </svg>
)

const YenIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L6 12H18L12 2Z" />
    <path d="M6 15H18" />
    <path d="M6 18H18" />
    <path d="M12 12V22" />
  </svg>
)

// ==================== 定数 ====================
// デザインシステムに基づいたチャート設定（コンパクト化）
const CHART_CONFIG = {
  height: {
    mobile: 240,
    tablet: 300,
    desktop: 340
  },
  outerRadius: {
    mobile: { outer: 96, inner: 68 },
    tablet: { outer: 128, inner: 92 },
    desktop: { outer: 160, inner: 112 }
  },
  innerRadius: {
    mobile: { outer: 68, inner: 44 },
    tablet: { outer: 92, inner: 60 },
    desktop: { outer: 112, inner: 76 }
  },
  centerMaxWidth: {
    mobile: 80,
    tablet: 112,
    desktop: 144
  }
} as const

const DEFAULT_COLOR = '#6B7280'
const SELECTED_COLOR = '#404040' // Gray color for selection (gray.700)
const SELECTED_STROKE_WIDTH = 3

// UL分類カラートークン
const UL_BADGE_COLORS = {
  ultralight: '#10B981',  // green-500
  lightweight: '#F59E0B', // amber-500
  traditional: '#EF4444'  // red-500
} as const

// フォントサイズトークン
const FONT_SIZES = {
  center: {
    primary: { mobile: '1.1rem', desktop: '1.4rem' },      // 値表示
    secondary: { mobile: '0.65rem', desktop: '0.75rem' },   // ラベル
    tertiary: { mobile: '0.55rem', desktop: '0.65rem' }     // サブ情報
  },
  badge: { mobile: '0.5rem', desktop: '0.55rem' }
} as const

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
  // Weight-Class用
  weightBreakdown?: WeightBreakdown | null
  ulStatus?: ULStatus | null
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
  onToggleCheckboxes,
  weightBreakdown,
  ulStatus
}) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [selectedCategoryForPanel, setSelectedCategoryForPanel] = useState<string | null>(null)
  const [panelMode, setPanelMode] = useState<PanelMode>('overview')
  const [centerPulse, setCenterPulse] = useState(false)
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [showAddMenu, setShowAddMenu] = useState(false) // アクションメニュー用
  const [isChartCollapsed, setIsChartCollapsed] = useState(false) // グラフ折りたたみ状態
  // 二重ドーナツ用状態
  const [chartFocus, setChartFocus] = useState<ChartFocus>('all')
  // Scopeは'base'固定（将来的にトグル復活の可能性あり）
  const chartScope: ChartScope = 'base'
  // hover callout用activeIndex
  const [innerActiveIndex, setInnerActiveIndex] = useState<number | null>(null)
  const [outerActiveIndex, setOuterActiveIndex] = useState<number | null>(null)

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

  // 二重ドーナツ: Inner ring (Big3 vs Other) - ratioを含む
  const dualRingInnerData = useMemo(() => {
    if (viewMode !== 'weight-class') return null
    const data = calculateInnerRingData(items, chartScope)
    const total = data.reduce((sum, d) => sum + d.value, 0)
    return data.map(d => ({ ...d, ratio: total > 0 ? d.value / total : 0, unit: 'g' }))
  }, [viewMode, items, chartScope])

  // 二重ドーナツ: Outer ring (カテゴリ or Big3内訳) - ratioを含む
  const dualRingOuterData = useMemo(() => {
    if (viewMode !== 'weight-class') return null
    const data = calculateOuterRingData(items, chartScope, chartFocus, categories)
    const total = data.reduce((sum, d) => sum + d.value, 0)
    return data.map(d => ({ ...d, ratio: total > 0 ? d.value / total : 0, unit: 'g' }))
  }, [viewMode, items, chartScope, chartFocus, categories])

  // スコープに応じた合計重量
  const scopedTotalWeight = useMemo(() => {
    if (viewMode !== 'weight-class') return totalWeight
    const scopedItems = filterByScope(items, chartScope)
    return sumWeight(scopedItems)
  }, [viewMode, items, chartScope, totalWeight])

  const displayData = useMemo(() => {
    return data.map(category => ({
      ...category,
      value: viewMode === 'cost' ? category.cost : category.weight
    }))
  }, [data, viewMode])

  const totalValue = viewMode === 'cost' ? totalCost : totalWeight

  const sortedData = useMemo(() => {
    const unit = viewMode === 'cost' ? '¥' : 'g'
    return [...displayData].sort((a, b) => b.value - a.value).map(category => ({
      ...category,
      percentage: totalValue > 0 ? Math.round((category.value / totalValue) * 100) : 0,
      ratio: totalValue > 0 ? category.value / totalValue : 0,
      label: category.name,
      unit,
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
    const items = selectedData?.sortedItems || []
    const categoryTotal = items.reduce((sum, item) => sum + getItemValue(item, viewMode, quantityDisplayMode), 0)
    const unit = viewMode === 'cost' ? '¥' : 'g'
    return items.map((item, index) => {
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
        systemPercentage: item.systemPercentage,
        ratio: categoryTotal > 0 ? itemValue / categoryTotal : 0,
        label: item.name,
        unit
      }
    })
  }, [selectedData, viewMode, quantityDisplayMode])

  // ==================== イベントハンドラー（memo化） ====================
  const handleCategoryClick = useCallback((categoryName: string) => {
    console.log('[DEBUG] handleCategoryClick', { categoryName, selectedCategories, selectedItem })
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
    console.log('[DEBUG] handleItemClick', { itemId, selectedItem, selectedCategoryForPanel })
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

  // アイテム詳細からカテゴリへナビゲート（トグルではなく常にカテゴリ選択）
  const handleCategoryNavigate = useCallback((categoryName: string) => {
    console.log('[DEBUG] handleCategoryNavigate', { categoryName })
    setSelectedItem(null)
    onCategorySelect([categoryName])
    setSelectedCategoryForPanel(categoryName)
    setPanelMode('category')
  }, [onCategorySelect])

  // 選択されたアイテムオブジェクトを取得
  const selectedItemData = useMemo(() => {
    if (!selectedItem || !items) return null
    return items.find(item => item.id === selectedItem) || null
  }, [selectedItem, items])

  const handleCenterClick = useCallback(() => {
    // Weight → Cost → Weight-Class → Weight のサイクル
    const nextMode: ChartViewMode = viewMode === 'weight'
      ? 'cost'
      : viewMode === 'cost'
        ? 'weight-class'
        : 'weight'
    onViewModeChange(nextMode)

    // パルスアニメーション
    setCenterPulse(true)
    setTimeout(() => setCenterPulse(false), 600)
  }, [viewMode, onViewModeChange])

  // 二重ドーナツ: Inner ringクリック（Big3 vs Other 切替）
  const handleInnerRingClick = useCallback((segmentId: string) => {
    if (segmentId === 'big3') {
      setChartFocus(chartFocus === 'big3' ? 'all' : 'big3')
    } else if (segmentId === 'other') {
      setChartFocus(chartFocus === 'other' ? 'all' : 'other')
    }
  }, [chartFocus])

  // 二重ドーナツ: Outer ringクリック（カテゴリ選択）
  const handleDualRingOuterClick = useCallback((segmentId: string) => {
    // Big3内訳の場合はカテゴリ名で選択
    const segment = dualRingOuterData?.find(s => s.id === segmentId)
    if (segment) {
      if (selectedCategories.includes(segment.label)) {
        onCategorySelect([])
        setSelectedCategoryForPanel(null)
        setPanelMode('overview')
      } else {
        onCategorySelect([segment.label])
        setSelectedCategoryForPanel(segment.label)
        setPanelMode('category')
      }
    }
    setSelectedItem(null)
  }, [dualRingOuterData, selectedCategories, onCategorySelect])

  // パンくずリスト用の選択中アイテム名を取得
  const selectedItemName = useMemo(() => {
    if (!selectedItem || !items) return null
    const item = items.find(i => i.id === selectedItem)
    return item?.name || null
  }, [selectedItem, items])

  // ==================== レンダリング ====================
  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      {/* メインコンテンツ - 統合レイアウト */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-x-auto">
        {/* グラフエリア */}
        <Card className={`flex flex-col min-w-0 flex-shrink-0 transition-all duration-300 ${isChartCollapsed ? 'w-12' : 'w-full lg:w-[40%]'}`}>
          {/* グラフヘッダー */}
          <div className={`flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 ${isChartCollapsed ? '' : 'h-11'}`}>
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
        <div className="relative flex items-center justify-center p-2 flex-1" style={{ minHeight: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* Weight-Classモード: 二重ドーナツ */}
              {viewMode === 'weight-class' && dualRingInnerData && dualRingOuterData ? (
                <>
                  {/* Outer ring: カテゴリ or Big3内訳 */}
                  <Pie
                    data={dualRingOuterData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={outerRadiusConfig.outer}
                    innerRadius={outerRadiusConfig.inner}
                    onClick={(entry) => handleDualRingOuterClick(entry.id)}
                    activeIndex={outerActiveIndex ?? undefined}
                    activeShape={ActiveCalloutShape}
                    onMouseEnter={(_, idx) => setOuterActiveIndex(idx)}
                    onMouseLeave={() => setOuterActiveIndex(null)}
                    className="cursor-pointer"
                  >
                    {dualRingOuterData.map((entry, index) => {
                      const isSelected = selectedCategories.includes(entry.label)
                      const darkenedFill = darkenColor(entry.color, 0.15)
                      // Outer ringは薄めに表示してInner ringを強調
                      const baseOpacity = chartFocus !== 'all' ? 0.5 : 0.7
                      return (
                        <Cell
                          key={`dual-outer-${index}`}
                          fill={isSelected ? darkenedFill : entry.color}
                          stroke={COLORS.white}
                          strokeWidth={isSelected ? 2 : 1}
                          opacity={isSelected ? 0.95 : baseOpacity}
                          style={{
                            transition: 'all 0.2s ease',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        />
                      )
                    })}
                  </Pie>
                  {/* Inner ring: Big3 vs Other */}
                  <Pie
                    data={dualRingInnerData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={innerRadiusConfig.outer}
                    innerRadius={innerRadiusConfig.inner}
                    onClick={(entry) => handleInnerRingClick(entry.id)}
                    activeIndex={innerActiveIndex ?? undefined}
                    activeShape={ActiveCalloutShape}
                    onMouseEnter={(_, idx) => setInnerActiveIndex(idx)}
                    onMouseLeave={() => setInnerActiveIndex(null)}
                    className="cursor-pointer"
                  >
                    {dualRingInnerData.map((entry, index) => {
                      const isFocused = chartFocus === entry.id || chartFocus === 'all'
                      const darkenedFill = darkenColor(entry.color, 0.25)
                      return (
                        <Cell
                          key={`dual-inner-${index}`}
                          fill={chartFocus === entry.id ? darkenedFill : entry.color}
                          stroke={chartFocus === entry.id ? darkenedFill : COLORS.white}
                          strokeWidth={chartFocus === entry.id ? 3 : 2}
                          opacity={isFocused ? 1 : 0.35}
                          style={{
                            filter: chartFocus === entry.id ? `drop-shadow(0 0 8px ${entry.color}aa)` : 'none',
                            transition: 'all 0.2s ease',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        />
                      )
                    })}
                  </Pie>
                </>
              ) : (
                <>
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
                      activeIndex={outerActiveIndex ?? undefined}
                      activeShape={ActiveCalloutShape}
                      onMouseEnter={(_, idx) => setOuterActiveIndex(idx)}
                      onMouseLeave={() => setOuterActiveIndex(null)}
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
                    activeIndex={innerActiveIndex ?? undefined}
                    activeShape={ActiveCalloutShape}
                    onMouseEnter={(_, idx) => setInnerActiveIndex(idx)}
                    onMouseLeave={() => setInnerActiveIndex(null)}
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
                </>
              )}
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
                          className="font-bold mb-0.5 text-gray-900 dark:text-gray-100"
                          style={{
                            fontSize: screenSize === 'mobile' ? FONT_SIZES.center.primary.mobile : FONT_SIZES.center.primary.desktop
                          }}
                        >
                          {formatValue(itemData.value, viewMode)}
                        </div>
                        <div
                          className="font-semibold mb-0.5 px-1 text-center overflow-hidden"
                          style={{
                            fontSize: screenSize === 'mobile' ? FONT_SIZES.center.secondary.mobile : FONT_SIZES.center.secondary.desktop,
                            color: itemData.color,
                            maxWidth: centerMaxWidth - 16,
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
                            className="text-gray-500 dark:text-gray-400 mb-0.5 px-1 text-center overflow-hidden"
                            style={{
                              fontSize: screenSize === 'mobile' ? FONT_SIZES.center.tertiary.mobile : FONT_SIZES.center.tertiary.desktop,
                              maxWidth: centerMaxWidth - 16,
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis'
                            }}
                            title={itemData.brand}
                          >
                            {itemData.brand}
                          </div>
                        )}
                        <div
                          className="text-gray-500 dark:text-gray-400"
                          style={{
                            fontSize: screenSize === 'mobile' ? FONT_SIZES.center.tertiary.mobile : FONT_SIZES.center.tertiary.desktop
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
                        className="font-bold mb-0.5 text-gray-900 dark:text-gray-100"
                        style={{
                          fontSize: screenSize === 'mobile' ? FONT_SIZES.center.primary.mobile : FONT_SIZES.center.primary.desktop
                        }}
                      >
                        {formatValue(selectedData.value, viewMode)}
                      </div>
                      <div
                        className="uppercase tracking-wide font-bold mb-1"
                        style={{
                          fontSize: screenSize === 'mobile' ? FONT_SIZES.center.secondary.mobile : FONT_SIZES.center.secondary.desktop,
                          color: selectedData.color
                        }}
                      >
                        {selectedCategoryFromChart}
                      </div>
                      <div
                        className="text-gray-500 dark:text-gray-400"
                        style={{
                          fontSize: screenSize === 'mobile' ? FONT_SIZES.center.tertiary.mobile : FONT_SIZES.center.tertiary.desktop
                        }}
                      >
                        {selectedData.percentage}% of total
                      </div>
                    </>
                  )
                }

                // レベル1: 未選択時
                // Weight-Classモード用中央表示（chartFocusに応じて表示切替）
                if (viewMode === 'weight-class' && weightBreakdown && ulStatus) {
                  const ulProgress = Math.min(100, (weightBreakdown.baseWeight / UL_THRESHOLDS.ultralight) * 100)
                  const ulBadgeColor = UL_BADGE_COLORS[ulStatus.classification]
                  const ulBadgeLabel = ulStatus.classification === 'ultralight'
                    ? 'UL'
                    : ulStatus.classification === 'lightweight'
                      ? 'LW'
                      : 'Trad'

                  // chartFocusに応じた値とラベル
                  const otherWeight = weightBreakdown.baseWeight - weightBreakdown.big3
                  const displayWeight = chartFocus === 'big3'
                    ? weightBreakdown.big3
                    : chartFocus === 'other'
                      ? otherWeight
                      : weightBreakdown.baseWeight
                  const displayLabel = chartFocus === 'big3'
                    ? 'BIG3'
                    : chartFocus === 'other'
                      ? 'OTHER'
                      : 'BASE WEIGHT'
                  const displayColor = chartFocus === 'big3'
                    ? DUAL_RING_COLORS.big3
                    : chartFocus === 'other'
                      ? DUAL_RING_COLORS.other
                      : undefined

                  return (
                    <>
                      <div
                        className="font-bold mb-0.5"
                        style={{
                          fontSize: screenSize === 'mobile' ? FONT_SIZES.center.primary.mobile : FONT_SIZES.center.primary.desktop,
                          color: displayColor || 'inherit'
                        }}
                      >
                        {(displayWeight / 1000).toFixed(2)}kg
                      </div>
                      <div
                        className="uppercase tracking-wide font-bold mb-1"
                        style={{
                          fontSize: screenSize === 'mobile' ? FONT_SIZES.center.tertiary.mobile : FONT_SIZES.center.tertiary.desktop,
                          color: displayColor || '#6B7280'
                        }}
                      >
                        {displayLabel}
                      </div>
                      {chartFocus === 'all' && (
                        <>
                          <span
                            className="px-1.5 py-0.5 rounded-full text-white font-bold"
                            style={{
                              fontSize: screenSize === 'mobile' ? FONT_SIZES.badge.mobile : FONT_SIZES.badge.desktop,
                              backgroundColor: ulBadgeColor
                            }}
                          >
                            {ulBadgeLabel}
                          </span>
                          <div
                            className="text-gray-400 dark:text-gray-500 mt-0.5"
                            style={{
                              fontSize: screenSize === 'mobile' ? FONT_SIZES.center.tertiary.mobile : FONT_SIZES.center.tertiary.desktop
                            }}
                          >
                            {Math.round(ulProgress)}% of UL
                          </div>
                        </>
                      )}
                      {chartFocus !== 'all' && (
                        <div
                          className="text-gray-400 dark:text-gray-500 mt-0.5"
                          style={{
                            fontSize: screenSize === 'mobile' ? FONT_SIZES.center.tertiary.mobile : FONT_SIZES.center.tertiary.desktop
                          }}
                        >
                          {weightBreakdown.baseWeight > 0
                            ? Math.round((displayWeight / weightBreakdown.baseWeight) * 100)
                            : 0}% of Base
                        </div>
                      )}
                    </>
                  )
                }

                return (
                  <>
                    <div
                      className="font-bold mb-0.5 text-gray-900 dark:text-gray-100"
                      style={{
                        fontSize: screenSize === 'mobile' ? FONT_SIZES.center.primary.mobile : FONT_SIZES.center.primary.desktop
                      }}
                    >
                      {formatValue(totalValue, viewMode)}
                    </div>
                    <div
                      className="uppercase tracking-wide font-bold text-gray-500 dark:text-gray-400"
                      style={{
                        fontSize: screenSize === 'mobile' ? FONT_SIZES.center.secondary.mobile : FONT_SIZES.center.secondary.desktop
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

        {/* ビューモード遷移バー + サマリーカード表示セクション */}
        <div className="px-2 py-1.5 border-t border-gray-200 dark:border-gray-700">
          {/* ビューモード遷移バー */}
          <div className="flex justify-center mb-1.5">
            <div className="inline-flex rounded-lg p-0.5 bg-gray-100 dark:bg-gray-800">
              <button
                onClick={() => onViewModeChange('weight')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all duration-200 inline-flex items-center gap-1 ${
                  viewMode === 'weight'
                    ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <ScaleIcon className="w-3 h-3" />
                Weight
              </button>
              <button
                onClick={() => onViewModeChange('cost')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all duration-200 inline-flex items-center gap-1 ${
                  viewMode === 'cost'
                    ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <YenIcon className="w-3 h-3" />
                Cost
              </button>
              <button
                onClick={() => onViewModeChange('weight-class')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all duration-200 inline-flex items-center gap-1 ${
                  viewMode === 'weight-class'
                    ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <BackpackIcon className="w-3 h-3" />
                Class
              </button>
            </div>
          </div>

          {/* サマリーフッター */}
          {viewMode === 'weight-class' && weightBreakdown ? (
            <>
              {/* Weight-Classモード: Big3 / Other - Inner ringの凡例と連動 */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setChartFocus(chartFocus === 'other' ? 'all' : 'other')}
                  className={`flex flex-col items-center p-2 rounded transition-all duration-200 ${
                    chartFocus === 'other'
                      ? 'bg-gray-200 dark:bg-gray-700 ring-2 ring-gray-500 dark:ring-gray-400'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-150 dark:hover:bg-gray-750'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: DUAL_RING_COLORS.other }}
                    />
                    <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Other</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {(weightBreakdown.baseWeight - weightBreakdown.big3).toLocaleString()}g
                  </span>
                  <span className="text-[9px] text-gray-500 dark:text-gray-400">
                    {weightBreakdown.baseWeight > 0
                      ? Math.round(((weightBreakdown.baseWeight - weightBreakdown.big3) / weightBreakdown.baseWeight) * 100)
                      : 0}%
                  </span>
                </button>
                <button
                  onClick={() => setChartFocus(chartFocus === 'big3' ? 'all' : 'big3')}
                  className={`flex flex-col items-center p-2 rounded transition-all duration-200 ${
                    chartFocus === 'big3'
                      ? 'bg-purple-100 dark:bg-purple-900/40 ring-2 ring-purple-500 dark:ring-purple-400'
                      : 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: DUAL_RING_COLORS.big3 }}
                    />
                    <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">Big3</span>
                  </div>
                  <span className="text-sm font-bold text-purple-800 dark:text-purple-200">
                    {weightBreakdown.big3.toLocaleString()}g
                  </span>
                  <span className="text-[9px] text-purple-600 dark:text-purple-400">
                    {weightBreakdown.baseWeight > 0
                      ? Math.round((weightBreakdown.big3 / weightBreakdown.baseWeight) * 100)
                      : 0}%
                  </span>
                </button>
              </div>
              {/* Big3内訳表示 */}
              <div className="grid grid-cols-3 gap-1 mt-1.5">
                <div className="flex flex-col items-center py-1 px-0.5 bg-purple-50/50 dark:bg-purple-900/10 rounded">
                  <span className="text-[9px] font-medium text-purple-600 dark:text-purple-400">Pack</span>
                  <span className="text-[11px] font-bold text-purple-800 dark:text-purple-200">
                    {weightBreakdown.big3Pack?.toLocaleString() ?? 0}g
                  </span>
                </div>
                <div className="flex flex-col items-center py-1 px-0.5 bg-purple-50/50 dark:bg-purple-900/10 rounded">
                  <span className="text-[9px] font-medium text-purple-600 dark:text-purple-400">Shelter</span>
                  <span className="text-[11px] font-bold text-purple-800 dark:text-purple-200">
                    {weightBreakdown.big3Shelter?.toLocaleString() ?? 0}g
                  </span>
                </div>
                <div className="flex flex-col items-center py-1 px-0.5 bg-purple-50/50 dark:bg-purple-900/10 rounded">
                  <span className="text-[9px] font-medium text-purple-600 dark:text-purple-400">Sleep</span>
                  <span className="text-[11px] font-bold text-purple-800 dark:text-purple-200">
                    {weightBreakdown.big3Sleep?.toLocaleString() ?? 0}g
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Weight/Costモード: 2カード（Weight-Classモードと同じ高さに統一） */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className={`flex flex-col items-center p-2 rounded transition-all duration-200 ${
                  viewMode === 'weight'
                    ? 'bg-gray-200 dark:bg-gray-700 ring-2 ring-gray-400 dark:ring-gray-500'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <ScaleIcon className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                    <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Weight</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {totalWeight.toLocaleString()}g
                  </span>
                  <span className="text-[9px] text-gray-500 dark:text-gray-400">
                    {(totalWeight / 1000).toFixed(2)}kg
                  </span>
                </div>
                <div className={`flex flex-col items-center p-2 rounded transition-all duration-200 ${
                  viewMode === 'cost'
                    ? 'bg-green-100 dark:bg-green-900/40 ring-2 ring-green-400 dark:ring-green-500'
                    : 'bg-green-50 dark:bg-green-900/20'
                }`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <YenIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    <span className="text-[11px] font-semibold text-green-700 dark:text-green-300">Price</span>
                  </div>
                  <span className="text-sm font-bold text-green-800 dark:text-green-200">
                    ¥{Math.round(totalCost / 100).toLocaleString()}
                  </span>
                  <span className="text-[9px] text-green-600 dark:text-green-400">
                    {items.length} items
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
            </>
          )}
      </Card>

        {/* Gear Detail Panel（右側パネル） */}
        <Card className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* パネルヘッダー */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 h-11">
            <div className="flex items-center gap-1 text-xs min-w-0">
              {/* DEBUG: 状態表示 */}
              <span className="text-[9px] text-red-500 font-mono mr-1">[{panelMode}{selectedItem ? '/item' : ''}{selectedCategoryFromChart ? `/${selectedCategoryFromChart}` : ''}]</span>
              {/* パンくずナビゲーション */}
              <button
                onClick={() => {
                  console.log('[DEBUG] Breadcrumb All clicked', { panelMode, selectedItem, selectedCategoryForPanel })
                  setSelectedItem(null)
                  setSelectedCategoryForPanel(null)
                  onCategorySelect([])
                  setPanelMode('overview')
                }}
                className={`flex-shrink-0 transition-colors ${
                  panelMode === 'overview'
                    ? 'text-gray-700 dark:text-gray-200 font-medium'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                All
              </button>
              {selectedCategoryFromChart && (
                <>
                  <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">/</span>
                  <button
                    onClick={() => {
                      setSelectedItem(null)
                      setPanelMode('category')
                    }}
                    className={`truncate max-w-[80px] transition-colors ${
                      panelMode === 'category'
                        ? 'text-gray-700 dark:text-gray-200 font-medium'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                    title={selectedCategoryFromChart}
                  >
                    {selectedCategoryFromChart}
                  </button>
                </>
              )}
              {selectedItem && selectedItemName && (
                <>
                  <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">/</span>
                  <span className="text-gray-700 dark:text-gray-200 font-medium truncate max-w-[80px]" title={selectedItemName}>
                    {selectedItemName}
                  </span>
                </>
              )}
            </div>

            {/* 右側ボタン群 */}
            <div className="flex items-center gap-1.5">
              {/* ビュー切替グループ */}
              <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-0.5">
                {/* ビュー切り替え (Card/Table) - Compareモードからも切り替え可能 */}
                {onGearViewModeChange && (
                  <div className="inline-flex rounded-md p-0.5 bg-gray-100 dark:bg-gray-800">
                    <button
                      onClick={() => onGearViewModeChange('card')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                        gearViewMode === 'card'
                          ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm'
                          : gearViewMode === 'compare'
                            ? 'text-gray-400 dark:text-gray-500'
                            : 'text-gray-500 dark:text-gray-400'
                      }`}
                      aria-label="Card view"
                    >
                      Card
                    </button>
                    <button
                      onClick={() => onGearViewModeChange('table')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                        gearViewMode === 'table'
                          ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm'
                          : gearViewMode === 'compare'
                            ? 'text-gray-400 dark:text-gray-500'
                            : 'text-gray-500 dark:text-gray-400'
                      }`}
                      aria-label="Table view"
                    >
                      Table
                    </button>
                  </div>
                )}

                {/* Compare(A/B)ボタン - 編集モード中は無効 */}
                {onGearViewModeChange && (
                  <button
                    onClick={() => {
                      if (gearViewMode === 'compare') {
                        onGearViewModeChange('table')
                      } else {
                        if (showCheckboxes) {
                          onToggleCheckboxes()
                        }
                        onGearViewModeChange('compare')
                      }
                    }}
                    disabled={showCheckboxes && gearViewMode !== 'compare'}
                    className={`px-1.5 py-1 rounded text-xs font-medium transition-all duration-200 ${
                      gearViewMode === 'compare'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : showCheckboxes
                          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    aria-label="Compare view"
                    title={showCheckboxes ? 'Exit Edit mode first' : 'Compare items'}
                  >
                    A/B
                  </button>
                )}
              </div>

              {/* セパレータ */}
              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

              {/* アクショングループ */}
              <div className="flex items-center gap-1">
              {/* アクションメニュー（ADD + Manage Categories） */}
              {onShowForm && (
                <div className="relative add-menu-container">
                  <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                    aria-label="Actions menu"
                    title="Actions"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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
                    </div>
                  )}
                </div>
              )}

              {/* Edit(✏️)ボタン - Compareモード中は無効 */}
              <button
                onClick={() => {
                  if (gearViewMode === 'compare') {
                    // Compareモード中は編集モードに入れない
                    return
                  }
                  onToggleCheckboxes()
                }}
                disabled={gearViewMode === 'compare'}
                className={`p-1.5 rounded-md transition-all duration-200 ${
                  showCheckboxes
                    ? 'bg-blue-600 text-white shadow-sm'
                    : gearViewMode === 'compare'
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                aria-label={showCheckboxes ? 'Exit edit mode' : 'Enter edit mode'}
                title={gearViewMode === 'compare' ? 'Exit Compare mode first' : showCheckboxes ? 'Exit Edit Mode' : 'Edit Mode'}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              </div>
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
                chartFocusFilter={viewMode === 'weight-class' ? chartFocus : 'all'}
                onCategoryClick={handleCategoryNavigate}
              />
          </div>
        </Card>
      </div>
    </div>
  )
})

GearChart.displayName = 'GearChart'

export default GearChart
