import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import HorizontalBarChart from './charts/HorizontalBarChart'
import BackpackIcon from './icons/BackpackIcon'
import ScaleIcon from './icons/ScaleIcon'
import YenIcon from './icons/YenIcon'
import { useResponsiveSize } from '../hooks/useResponsiveSize'
import { Category, ChartData, ChartViewMode, GearFieldValue, GearItemWithCalculated, QuantityDisplayMode, WeightBreakdown, ULStatus, UL_THRESHOLDS, ChartFocus, ChartScope, DUAL_RING_COLORS } from '../utils/types'
import { COLORS } from '../utils/designSystem'
import { alpha } from '../styles/tokens'
import { darkenColor, darkenHslColor, generateItemColor } from '../utils/colorHelpers'
import { getQuantityForDisplayMode, calculateInnerRingData, calculateOuterRingData } from '../utils/chartHelpers'
import Card from './ui/Card'
import GearDetailPanel from './GearDetailPanel'
import ActiveCalloutShape from './charts/ActiveCalloutShape'

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

const DEFAULT_COLOR = COLORS.gray[500]

// UL分類カラートークン
const UL_BADGE_COLORS = {
  ultralight: COLORS.success,
  lightweight: COLORS.warning,
  traditional: COLORS.error
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

type GearItemWithPercentages = GearItemWithCalculated & {
  systemPercentage: number
  totalPercentage: number
  displayValue: number
}

const VIEW_MODE_OPTIONS = [
  { mode: 'weight', label: 'Weight', icon: ScaleIcon },
  { mode: 'cost', label: 'Cost', icon: YenIcon },
  { mode: 'weight-class', label: 'Class', icon: BackpackIcon }
] as const

interface SegmentedOption {
  key: string
  label: React.ReactNode
  onClick: () => void
  isActive: boolean
  isDisabled?: boolean
  title?: string
  ariaLabel?: string
  activeClassName?: string
  inactiveClassName?: string
  disabledClassName?: string
}

interface SegmentedControlProps {
  options: SegmentedOption[]
  className?: string
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, className = '' }) => (
  <div className={`inline-flex items-center gap-1 ${className}`}>
    {options.map((option) => {
      const activeClass = option.activeClassName ?? 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 shadow-sm'
      const inactiveClass = option.inactiveClassName ?? 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-100'
      const disabledClass = option.disabledClassName ?? 'text-gray-300 dark:text-gray-500 cursor-not-allowed'
      const stateClass = option.isDisabled ? disabledClass : option.isActive ? activeClass : inactiveClass

      return (
        <button
          key={option.key}
          onClick={option.onClick}
          disabled={option.isDisabled}
          title={option.title}
          aria-label={option.ariaLabel}
          className={`gear-glass-chip h-6 px-2 rounded-md text-[10px] font-medium transition-all duration-200 inline-flex items-center gap-1 ${stateClass}`}
        >
          {option.label}
        </button>
      )
    })}
  </div>
)

type OuterPieDataItem = {
  id: string
  name: string
  value: number
  color: string
  brand?: string
  percentage: number
}

type SelectedCategoryInfo = {
  value: number
  color: string
  percentage: number
}

interface ChartCenterDisplayProps {
  selectedItemData: OuterPieDataItem | null
  selectedCategoryFromChart: string | null
  selectedCategoryData: SelectedCategoryInfo | null
  viewMode: ChartViewMode
  screenSize: 'mobile' | 'tablet' | 'desktop'
  centerMaxWidth: number
  chartFocus: ChartFocus
  weightBreakdown?: WeightBreakdown | null
  ulStatus?: ULStatus | null
  totalValue: number
}

const ChartCenterDisplay: React.FC<ChartCenterDisplayProps> = ({
  selectedItemData,
  selectedCategoryFromChart,
  selectedCategoryData,
  viewMode,
  screenSize,
  centerMaxWidth,
  chartFocus,
  weightBreakdown,
  ulStatus,
  totalValue
}) => {
  if (selectedItemData) {
    return (
      <>
        <div
          className="font-bold mb-0.5 text-gray-900 dark:text-gray-100"
          style={{
            fontSize: screenSize === 'mobile' ? FONT_SIZES.center.primary.mobile : FONT_SIZES.center.primary.desktop
          }}
        >
          {formatValue(selectedItemData.value, viewMode)}
        </div>
        <div
          className="font-semibold mb-0.5 px-1 text-center overflow-hidden"
          style={{
            fontSize: screenSize === 'mobile' ? FONT_SIZES.center.secondary.mobile : FONT_SIZES.center.secondary.desktop,
            color: selectedItemData.color,
            maxWidth: centerMaxWidth - 16,
            lineHeight: '1.2',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
          }}
          title={selectedItemData.name}
        >
          {selectedItemData.name}
        </div>
        {selectedItemData.brand && (
          <div
            className="text-gray-500 dark:text-gray-400 mb-0.5 px-1 text-center overflow-hidden"
            style={{
              fontSize: screenSize === 'mobile' ? FONT_SIZES.center.tertiary.mobile : FONT_SIZES.center.tertiary.desktop,
              maxWidth: centerMaxWidth - 16,
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis'
            }}
            title={selectedItemData.brand}
          >
            {selectedItemData.brand}
          </div>
        )}
        <div
          className="text-gray-500 dark:text-gray-400"
          style={{
            fontSize: screenSize === 'mobile' ? FONT_SIZES.center.tertiary.mobile : FONT_SIZES.center.tertiary.desktop
          }}
        >
          {selectedItemData.percentage}% of total
        </div>
      </>
    )
  }

  if (selectedCategoryFromChart && selectedCategoryData) {
    return (
      <>
        <div
          className="font-bold mb-0.5 text-gray-900 dark:text-gray-100"
          style={{
            fontSize: screenSize === 'mobile' ? FONT_SIZES.center.primary.mobile : FONT_SIZES.center.primary.desktop
          }}
        >
          {formatValue(selectedCategoryData.value, viewMode)}
        </div>
        <div
          className="uppercase tracking-wide font-bold mb-1"
          style={{
            fontSize: screenSize === 'mobile' ? FONT_SIZES.center.secondary.mobile : FONT_SIZES.center.secondary.desktop,
            color: selectedCategoryData.color
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
          {selectedCategoryData.percentage}% of total
        </div>
      </>
    )
  }

  if (viewMode === 'weight-class' && weightBreakdown && ulStatus) {
    const ulProgress = Math.min(100, (weightBreakdown.baseWeight / UL_THRESHOLDS.ultralight) * 100)
    const ulBadgeColor = UL_BADGE_COLORS[ulStatus.classification]
    const ulBadgeLabel = ulStatus.classification === 'ultralight'
      ? 'UL'
      : ulStatus.classification === 'lightweight'
        ? 'LW'
        : 'Trad'

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
            color: displayColor || DEFAULT_COLOR
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
}

interface ChartSummaryFooterProps {
  viewMode: ChartViewMode
  onViewModeChange: (mode: ChartViewMode) => void
  weightBreakdown?: WeightBreakdown | null
  weightClassSummaryCards: Array<{ key: string; label: string; value: number; focus: ChartFocus }>
  chartFocus: ChartFocus
  onToggleChartFocus: (focus: ChartFocus) => void
  totalWeight: number
  totalCost: number
  itemCount: number
}

interface SummaryStatCardProps {
  label: string
  value: string
  subValue?: string
  icon?: React.ReactNode
  isActive?: boolean
  onClick?: () => void
}

const SummaryStatCard: React.FC<SummaryStatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  isActive = false,
  onClick,
}) => {
  const cardClass = `flex flex-col items-center justify-center px-1 h-[72px] rounded-md transition-all duration-200 ${
    isActive
      ? 'bg-gray-200 dark:bg-slate-600 ring-1 ring-gray-400 dark:ring-slate-500'
      : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
  }`

  const content = (
    <>
      <div className="flex items-center gap-1.5 mb-0.5 leading-none">
        {icon}
        <span className="text-[10px] leading-none font-medium text-gray-600 dark:text-gray-300">{label}</span>
      </div>
      <span className="text-[11px] leading-none font-bold text-gray-900 dark:text-gray-100">{value}</span>
      {subValue && <span className="text-[9px] leading-none mt-1 text-gray-500 dark:text-gray-400">{subValue}</span>}
    </>
  )

  if (onClick) {
    return (
      <button onClick={onClick} className={cardClass}>
        {content}
      </button>
    )
  }

  return <div className={cardClass}>{content}</div>
}

const ChartSummaryFooter: React.FC<ChartSummaryFooterProps> = ({
  viewMode,
  onViewModeChange,
  weightBreakdown,
  weightClassSummaryCards,
  chartFocus,
  onToggleChartFocus,
  totalWeight,
  totalCost,
  itemCount
}) => {
  return (
    <div className="px-2 py-1.5 border-t border-gray-200 dark:border-slate-600">
      <div className="flex justify-center mb-1.5">
        <SegmentedControl
          options={VIEW_MODE_OPTIONS.map(({ mode, label, icon: Icon }) => ({
            key: mode,
            onClick: () => onViewModeChange(mode),
            isActive: viewMode === mode,
            ariaLabel: `${label} mode`,
            label: (
              <>
                <Icon className="w-3 h-3" />
                {label}
              </>
            ),
          }))}
        />
      </div>

      <div className="min-h-[72px]">
        {viewMode === 'weight-class' && weightBreakdown ? (
          <div className="grid grid-cols-4 gap-1 h-[72px]">
            {weightClassSummaryCards.map(card => (
              <SummaryStatCard
                key={card.key}
                label={card.label}
                value={`${card.value.toLocaleString()}g`}
                isActive={chartFocus === card.focus}
                onClick={() => onToggleChartFocus(card.focus)}
              />
            ))}
          </div>
      ) : (
          <div className="grid grid-cols-2 gap-1.5 h-[72px]">
            <SummaryStatCard
              label="Weight"
              value={`${totalWeight.toLocaleString()}g`}
              subValue={`${(totalWeight / 1000).toFixed(2)}kg`}
              isActive={viewMode === 'weight'}
              icon={<ScaleIcon className="w-3.5 h-3.5 flex-shrink-0 text-gray-600 dark:text-gray-300" />}
            />
            <SummaryStatCard
              label="Price"
              value={`¥${Math.round(totalCost / 100).toLocaleString()}`}
              subValue={`${itemCount} items`}
              isActive={viewMode === 'cost'}
              icon={<YenIcon className="w-3.5 h-3.5 flex-shrink-0 text-gray-600 dark:text-gray-300" />}
            />
          </div>
      )}
      </div>
    </div>
  )
}

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
  const [centerPulse, setCenterPulse] = useState(false)
  const screenSize = useResponsiveSize()
  const [showAddMenu, setShowAddMenu] = useState(false) // アクションメニュー用
  const [isChartCollapsed, setIsChartCollapsed] = useState(false) // グラフ折りたたみ状態
  const [chartDisplayMode, setChartDisplayMode] = useState<'pie' | 'bar'>('pie') // チャート表示モード
  // 二重ドーナツ用状態
  const [chartFocus, setChartFocus] = useState<ChartFocus>('all')
  // Scopeは'base'固定（将来的にトグル復活の可能性あり）
  const chartScope: ChartScope = 'base'
  // hover callout用activeIndex
  const [innerActiveIndex, setInnerActiveIndex] = useState<number | null>(null)
  const [outerActiveIndex, setOuterActiveIndex] = useState<number | null>(null)

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
    const data = calculateOuterRingData(items, chartScope, chartFocus)
    const total = data.reduce((sum, d) => sum + d.value, 0)
    return data.map(d => ({ ...d, ratio: total > 0 ? d.value / total : 0, unit: 'g' }))
  }, [viewMode, items, chartScope, chartFocus, categories])

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
        .map(item => ({ item, itemValue: getItemValue(item, viewMode, quantityDisplayMode) }))
        .filter(({ itemValue }) => itemValue > 0)
        .sort((a, b) => b.itemValue - a.itemValue)
        .map(({ item, itemValue }) => {
          return {
            ...item,
            systemPercentage: category.value > 0 ? Math.round((itemValue / category.value) * 100) : 0,
            totalPercentage: totalValue > 0 ? Math.round((itemValue / totalValue) * 100) : 0,
            displayValue: itemValue
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

  // バーチャート用データ: カテゴリ選択時はそのアイテム一覧、未選択時はカテゴリ一覧
  const barData = useMemo(() => {
    const unit = viewMode === 'cost' ? '¥' : 'g'
    if (selectedData && selectedData.sortedItems.length > 0) {
      return selectedData.sortedItems.map((item, index) => ({
        id: item.id,
        name: item.name,
        value: item.displayValue,
        color: generateItemColor(selectedData.color, index, selectedData.sortedItems.length),
        percentage: item.systemPercentage,
        unit,
      }))
    }
    return sortedData.map(cat => ({
      name: cat.name,
      value: cat.value,
      color: cat.color,
      percentage: cat.percentage,
      unit,
    }))
  }, [selectedData, sortedData, viewMode])

  const outerPieData = useMemo(() => {
    const items = selectedData?.sortedItems || []
    const categoryTotal = items.reduce((sum, item) => sum + item.displayValue, 0)
    const unit = viewMode === 'cost' ? '¥' : 'g'
    return items.map((item, index) => {
      const itemValue = item.displayValue
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
  }, [selectedData, viewMode])

  // ==================== イベントハンドラー（memo化） ====================
  const handleCategoryClick = useCallback((categoryName: string) => {
    if (selectedCategories.includes(categoryName)) {
      onCategorySelect([])
    } else {
      onCategorySelect([categoryName])
    }
    setSelectedItem(null)
  }, [selectedCategories, onCategorySelect])

  const handleItemClick = useCallback((itemId: string) => {
    setSelectedItem(prev => prev === itemId ? null : itemId)
  }, [])

  const handleCenterClick = useCallback(() => {
    const nextMode: ChartViewMode = viewMode === 'weight' ? 'cost' : 'weight'
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
    const segment = dualRingOuterData?.find(s => s.id === segmentId)
    if (segment) {
      if (selectedCategories.includes(segment.label)) {
        onCategorySelect([])
      } else {
        onCategorySelect([segment.label])
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

  const selectedItemData = useMemo(
    () => (selectedItem ? outerPieData.find(item => item.id === selectedItem) || null : null),
    [selectedItem, outerPieData]
  )

  const weightClassSummaryCards = useMemo(() => {
    if (!weightBreakdown) return []
    return [
      {
        key: 'pack',
        label: 'Pack',
        value: weightBreakdown.big3Pack ?? 0,
        focus: 'big3' as ChartFocus
      },
      {
        key: 'shelter',
        label: 'Shelter',
        value: weightBreakdown.big3Shelter ?? 0,
        focus: 'big3' as ChartFocus
      },
      {
        key: 'sleep',
        label: 'Sleep',
        value: weightBreakdown.big3Sleep ?? 0,
        focus: 'big3' as ChartFocus
      },
      {
        key: 'other',
        label: 'Other',
        value: weightBreakdown.baseWeight - weightBreakdown.big3,
        focus: 'other' as ChartFocus
      }
    ]
  }, [weightBreakdown])

  const handleToggleChartFocus = useCallback((focus: ChartFocus) => {
    setChartFocus(prev => prev === focus ? 'all' : focus)
  }, [])

  // ==================== レンダリング ====================
  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      {/* メインコンテンツ - 統合レイアウト */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 overflow-hidden">
        {/* グラフエリア */}
        <Card className={`flat-panel flex flex-col min-w-0 flex-shrink-0 transition-all duration-300 ${isChartCollapsed ? 'w-12 shadow-none border-gray-300 dark:border-slate-500' : 'w-full lg:w-[40%]'}`}>
          {/* グラフヘッダー */}
          <div className={`flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-slate-600 flex-shrink-0 ${isChartCollapsed ? '' : 'h-11'}`}>
            {isChartCollapsed ? (
              <div className="flex items-center justify-center w-full">
                <button
                  onClick={() => setIsChartCollapsed(false)}
                  className="w-full flex flex-col items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-700 rounded transition-colors py-2"
                  aria-label="Expand chart"
                >
                  <svg
                    className="w-4 h-4 text-gray-600 dark:text-gray-300 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8M12 8l4 4-4 4" />
                  </svg>
                  <span className="text-xs text-gray-600 dark:text-gray-300 font-medium" style={{ writingMode: 'vertical-rl' }}>
                    Chart
                  </span>
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Chart</h3>
                  <div className="inline-flex items-center gap-0.5 bg-gray-100 dark:bg-slate-700 rounded-md p-0.5">
                    <button
                      type="button"
                      onClick={() => setChartDisplayMode('pie')}
                      className={`h-5 px-1.5 rounded text-[10px] font-medium transition-all duration-150 inline-flex items-center gap-1 ${
                        chartDisplayMode === 'pie'
                          ? 'bg-white dark:bg-slate-600 text-gray-700 dark:text-gray-200 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                      aria-label="Pie chart"
                      title="Donut chart"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 1a7 7 0 1 0 7 7A7 7 0 0 0 8 1zm0 12A5 5 0 1 1 13 8 5 5 0 0 1 8 13zm0-8a3 3 0 1 0 3 3A3 3 0 0 0 8 5z"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartDisplayMode('bar')}
                      className={`h-5 px-1.5 rounded text-[10px] font-medium transition-all duration-150 inline-flex items-center gap-1 ${
                        chartDisplayMode === 'bar'
                          ? 'bg-white dark:bg-slate-600 text-gray-700 dark:text-gray-200 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                      aria-label="Bar chart"
                      title="Horizontal bar chart"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                        <rect x="1" y="2" width="10" height="3" rx="1"/>
                        <rect x="1" y="6.5" width="14" height="3" rx="1"/>
                        <rect x="1" y="11" width="7" height="3" rx="1"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setIsChartCollapsed(true)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-700 rounded transition-colors"
                  aria-label="Collapse chart"
                >
                  <svg
                    className="w-4 h-4 text-gray-600 dark:text-gray-300"
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
        {chartDisplayMode === 'bar' ? (
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* ドリルダウン時のブレッドクラム */}
            {selectedData && (
              <div className="flex items-center gap-1.5 px-3 pt-2 pb-0">
                <button
                  type="button"
                  onClick={() => handleCategoryClick(selectedData.name)}
                  className="flex items-center gap-0.5 text-[10px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 12L6 8l4-4"/>
                  </svg>
                  All
                </button>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">/</span>
                <span className="text-[10px] font-medium truncate" style={{ color: selectedData.color }}>
                  {selectedData.name}
                </span>
              </div>
            )}
            <div className="flex-1 w-full px-3 py-2 flex flex-col justify-center">
              <HorizontalBarChart
                data={barData}
                totalValue={totalValue}
                viewMode={viewMode}
                selectedCategories={selectedCategories}
                onCategoryClick={handleCategoryClick}
                onItemClick={handleItemClick}
              />
            </div>
          </div>
        ) : (
        <div className="relative flex items-center justify-center p-2 flex-1" style={{ minHeight: chartHeight }}>
          <>
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
                backgroundColor: centerPulse ? alpha(COLORS.gray[800], 0.05) : 'transparent',
                transform: centerPulse ? 'scale(1.05)' : 'scale(1)',
                boxShadow: centerPulse ? `0 0 20px ${alpha(COLORS.gray[800], 0.3)}` : 'none'
              }}
              onClick={handleCenterClick}
            >
              <ChartCenterDisplay
                selectedItemData={selectedItemData}
                selectedCategoryFromChart={selectedCategoryFromChart}
                selectedCategoryData={
                  selectedData
                    ? {
                      value: selectedData.value,
                      color: selectedData.color,
                      percentage: selectedData.percentage
                    }
                    : null
                }
                viewMode={viewMode}
                screenSize={screenSize}
                centerMaxWidth={centerMaxWidth}
                chartFocus={chartFocus}
                weightBreakdown={weightBreakdown}
                ulStatus={ulStatus}
                totalValue={totalValue}
              />
            </div>
          </div>
          </>
        </div>
        )}

        <ChartSummaryFooter
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          weightBreakdown={weightBreakdown}
          weightClassSummaryCards={weightClassSummaryCards}
          chartFocus={chartFocus}
          onToggleChartFocus={handleToggleChartFocus}
          totalWeight={totalWeight}
          totalCost={totalCost}
          itemCount={items.length}
        />
            </>
          )}
      </Card>

        {/* Gear Detail Panel（右側パネル） */}
        <Card className="flat-panel flex-1 flex flex-col min-w-0 overflow-visible">
          {/* パネルヘッダー */}
          <div className="relative z-[60] flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-slate-600 flex-shrink-0 h-11 overflow-visible">
            <div className="flex items-center gap-1 text-xs min-w-0">
              {/* パンくずナビゲーション */}
              <button
                onClick={() => {
                  setSelectedItem(null)
                  onCategorySelect([])
                }}
                className={`flex-shrink-0 transition-colors ${
                  !selectedCategoryFromChart && !selectedItem
                    ? 'text-gray-700 dark:text-gray-200 font-medium'
                    : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                All
              </button>
              {selectedCategoryFromChart && (
                <>
                  <span className="text-gray-300 dark:text-gray-500 flex-shrink-0">/</span>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className={`truncate max-w-[80px] transition-colors ${
                      !selectedItem
                        ? 'text-gray-700 dark:text-gray-200 font-medium'
                        : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                    }`}
                    title={selectedCategoryFromChart}
                  >
                    {selectedCategoryFromChart}
                  </button>
                </>
              )}
              {selectedItem && selectedItemName && (
                <>
                  <span className="text-gray-300 dark:text-gray-500 flex-shrink-0">/</span>
                  <span className="text-gray-700 dark:text-gray-200 font-medium truncate max-w-[80px]" title={selectedItemName}>
                    {selectedItemName}
                  </span>
                </>
              )}
            </div>

            {/* 右側: 統合ツールバー */}
            <div className="inline-flex items-center gap-1">
              {onGearViewModeChange && (
                <SegmentedControl
                  options={[
                    {
                      key: 'card',
                      label: 'Card',
                      onClick: () => onGearViewModeChange('card'),
                      isActive: gearViewMode === 'card',
                      inactiveClassName: gearViewMode === 'compare' ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-100',
                      ariaLabel: 'Card view',
                    },
                    {
                      key: 'table',
                      label: 'Table',
                      onClick: () => onGearViewModeChange('table'),
                      isActive: gearViewMode === 'table',
                      inactiveClassName: gearViewMode === 'compare' ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-100',
                      ariaLabel: 'Table view',
                    },
                    {
                      key: 'compare',
                      label: 'A|B',
                      onClick: () => {
                        if (gearViewMode === 'compare') {
                          onGearViewModeChange('table')
                        } else {
                          if (showCheckboxes) {
                            onToggleCheckboxes()
                          }
                          onGearViewModeChange('compare')
                        }
                      },
                      isActive: gearViewMode === 'compare',
                      isDisabled: showCheckboxes && gearViewMode !== 'compare',
                      activeClassName: 'bg-gray-700 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm',
                      ariaLabel: 'Compare view',
                      title: showCheckboxes ? 'Exit Edit mode first' : 'Compare items',
                    },
                  ]}
                />
              )}

              {/* アクションメニュー（ADD + Manage Categories） */}
              {onShowForm && (
                <div className="relative add-menu-container z-[200] isolate">
                  <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="p-1.5 rounded-md bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-slate-500 shadow-sm hover:bg-gray-300 dark:hover:bg-slate-500 hover:text-gray-900 dark:hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-slate-400"
                    aria-label="Actions menu"
                    title="Actions"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>

                  {/* ドロップダウンメニュー */}
                  {showAddMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-600 py-1 z-[1000]">
                      <button
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
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
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
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
                          <div className="border-t border-gray-200 dark:border-slate-600 my-1"></div>
                          <button
                            className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
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
                    ? 'bg-gray-700 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                    : gearViewMode === 'compare'
                      ? 'bg-gray-100 dark:bg-slate-700 text-gray-300 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
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

          {/* パネルコンテンツ */}
          <div className="flex-1 min-h-0 overflow-hidden">
              <GearDetailPanel
                items={items}
                categories={categories}
                viewMode={viewMode}
                gearViewMode={gearViewMode}
                quantityDisplayMode={quantityDisplayMode}
                onQuantityDisplayModeChange={onQuantityDisplayModeChange}
                onEdit={onEdit}
                onDelete={onDelete}
                onUpdateItem={onUpdateItem}
                showCheckboxes={showCheckboxes}
                onToggleCheckboxes={onToggleCheckboxes}
                filteredByCategory={selectedCategories}
                chartFocusFilter={viewMode === 'weight-class' ? chartFocus : 'all'}
                selectedItemId={selectedItem}
              />
          </div>
        </Card>
      </div>
    </div>
  )
})

GearChart.displayName = 'GearChart'

export default GearChart
