import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import HorizontalBarChart from './charts/HorizontalBarChart'
import { useResponsiveSize } from '../hooks/useResponsiveSize'
import { Category, ChartData, ChartViewMode, GearFieldValue, GearItemWithCalculated, Pack, QuantityDisplayMode, WeightBreakdown, ULStatus, ChartFocus, ChartScope } from '../utils/types'
import { COLORS } from '../utils/designSystem'
import { alpha } from '../styles/tokens'
import { darkenColor, darkenHslColor, generateItemColor } from '../utils/colorHelpers'
import {
  calculateInnerRingData,
  calculateOuterRingData,
  prepareSortedChartData,
  buildOuterPieData,
  getPayloadUnit,
} from '../utils/chartHelpers'
import Card from './ui/Card'
import GearDetailPanel from './GearDetailPanel'
import ActiveCalloutShape from './charts/ActiveCalloutShape'
import SegmentedControl from './ui/SegmentedControl'
import ChartCenterDisplay from './charts/ChartCenterDisplay'
import { CHART_CONFIG } from '../utils/chartConfig'
import ChartSummaryFooter from './charts/ChartSummaryFooter'
import PackTabSection from './charts/PackTabSection'
import ChartHeader from './charts/ChartHeader'
import { useWeightUnit } from '../contexts/WeightUnitContext'

const DEFAULT_COLOR = COLORS.gray[500]

type GearItemWithPercentages = GearItemWithCalculated & {
  systemPercentage: number
  totalPercentage: number
  displayValue: number
}

type OuterPieDataItem = {
  id: string
  name: string
  value: number
  color: string
  brand?: string
  percentage: number
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
  items: GearItemWithCalculated[] // ギアリスト（右ペイン表示用）
  analysisItems?: GearItemWithCalculated[] // チャート集計用
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
  activePack?: Pack | null
  activePackItemIds?: string[]
  onTogglePackItem?: (itemId: string) => void
  onAddItemsToPack?: (itemIds: string[]) => void
  // Pack タブ（detail panel ヘッダーに統合）
  packList?: Array<{ id: string; name: string }>
  selectedPackId?: string | null
  onSelectPack?: (packId: string | null) => void
  onCreatePack?: (name: string) => void
  onOpenPackSettings?: () => void
  // Chart ↔ Table/Card の双方向連動
  selectedItemId?: string | null
  onItemSelect?: (id: string | null) => void
  hoveredItemId?: string | null
  onItemHover?: (id: string | null) => void
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
  analysisItems = items,
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
  ulStatus,
  activePack,
  activePackItemIds = [],
  onTogglePackItem,
  onAddItemsToPack,
  packList,
  selectedPackId,
  onSelectPack,
  onCreatePack,
  onOpenPackSettings,
  selectedItemId = null,
  onItemSelect,
  hoveredItemId = null,
  onItemHover,
}) => {
  const { unit: weightUnit } = useWeightUnit()
  // 親 (InventoryWorkspace) から制御される選択 ID。onItemSelect が無ければ local state にフォールバック
  // (旧来の呼び出し元の後方互換)
  const [localSelectedItem, setLocalSelectedItem] = useState<string | null>(null)
  const selectedItem = onItemSelect ? selectedItemId : localSelectedItem
  const selectedItemRef = useRef(selectedItem)
  selectedItemRef.current = selectedItem
  const setSelectedItem = useCallback(
    (next: string | null | ((prev: string | null) => string | null)) => {
      const resolved = typeof next === 'function' ? next(selectedItemRef.current ?? null) : next
      if (onItemSelect) {
        onItemSelect(resolved)
      } else {
        setLocalSelectedItem(resolved)
      }
    },
    [onItemSelect],
  )
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
    const data = calculateInnerRingData(analysisItems, chartScope)
    const total = data.reduce((sum, d) => sum + d.value, 0)
    return data.map(d => ({ ...d, ratio: total > 0 ? d.value / total : 0, unit: weightUnit }))
  }, [viewMode, analysisItems, chartScope, weightUnit])

  // 二重ドーナツ: Outer ring (カテゴリ or Big3内訳) - ratioを含む
  const dualRingOuterData = useMemo(() => {
    if (viewMode !== 'weight-class') return null
    const data = calculateOuterRingData(analysisItems, chartScope, chartFocus)
    const total = data.reduce((sum, d) => sum + d.value, 0)
    return data.map(d => ({ ...d, ratio: total > 0 ? d.value / total : 0, unit: weightUnit }))
  }, [viewMode, analysisItems, chartScope, chartFocus, categories, weightUnit])

  const totalValue = viewMode === 'cost' ? totalCost : totalWeight
  const payloadUnit = getPayloadUnit(viewMode, weightUnit)

  // カテゴリ別ソート + 各アイテムの percentage 計算 (helpers に集約)
  const sortedData = useMemo(
    () => prepareSortedChartData(data, viewMode, quantityDisplayMode, totalValue, payloadUnit),
    [data, viewMode, quantityDisplayMode, totalValue, payloadUnit],
  )

  // チャートで選択中のカテゴリ
  const selectedCategoryFromChart = selectedCategories.length === 1 ? selectedCategories[0] : null
  const selectedData = useMemo(
    () => (selectedCategoryFromChart ? sortedData.find(d => d.name === selectedCategoryFromChart) : null),
    [sortedData, selectedCategoryFromChart]
  )

  // バーチャート用データ: カテゴリ選択時はそのアイテム一覧、未選択時はカテゴリ一覧
  const barData = useMemo(() => {
    if (selectedData && selectedData.sortedItems.length > 0) {
      return selectedData.sortedItems.map((item, index) => ({
        id: item.id,
        name: item.name,
        value: item.displayValue,
        color: generateItemColor(selectedData.color, index, selectedData.sortedItems.length),
        percentage: item.systemPercentage,
        unit: payloadUnit,
      }))
    }
    return sortedData.map(cat => ({
      name: cat.name,
      value: cat.value,
      color: cat.color,
      percentage: cat.percentage,
      unit: payloadUnit,
    }))
  }, [selectedData, sortedData, payloadUnit])

  const outerPieData = useMemo(
    () => buildOuterPieData(selectedData, payloadUnit, DEFAULT_COLOR),
    [selectedData, payloadUnit],
  )

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
    <div className="lg:h-[calc(100vh-100px)] flex flex-col">
      {/* メインコンテンツ - 統合レイアウト */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 lg:overflow-hidden">
        {/* グラフエリア */}
        <Card className={`flat-panel flex flex-col min-w-0 flex-shrink-0 transition-all duration-300 ${
          isChartCollapsed
            ? screenSize === 'mobile' ? 'w-full shadow-none' : 'w-12 shadow-none'
            : 'w-full lg:w-[40%]'
        }`}>
          {/* グラフヘッダー */}
          <ChartHeader
            isCollapsed={isChartCollapsed}
            onToggleCollapsed={setIsChartCollapsed}
            chartDisplayMode={chartDisplayMode}
            onChartDisplayModeChange={setChartDisplayMode}
            screenSize={screenSize}
          />


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
                  className="flex items-center gap-0.5 text-2xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 12L6 8l4-4"/>
                  </svg>
                  All
                </button>
                <span className="text-2xs text-gray-400 dark:text-gray-500">/</span>
                <span className="text-2xs font-medium truncate" style={{ color: selectedData.color }}>
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
                onItemHover={onItemHover}
                hoveredItemId={hoveredItemId}
              />
            </div>
          </div>
        ) : (
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
                    activeShape={ActiveCalloutShape as any}
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
                    activeShape={ActiveCalloutShape as any}
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
                      activeShape={ActiveCalloutShape as any}
                      onMouseEnter={(entry, idx) => {
                        setOuterActiveIndex(idx)
                        if (entry?.id) onItemHover?.(entry.id)
                      }}
                      onMouseLeave={() => {
                        setOuterActiveIndex(null)
                        onItemHover?.(null)
                      }}
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
                    activeShape={ActiveCalloutShape as any}
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
          itemCount={analysisItems.length}
        />
            </>
          )}
      </Card>

        {/* Gear Detail Panel（右側パネル） */}
        <Card className="flat-panel flex-1 flex flex-col min-w-0 overflow-visible">
          {/* パネルヘッダー */}
          <div className="relative z-[60] flex items-center justify-between px-3 py-2 neu-divider flex-shrink-0 h-11 overflow-visible">
            <div className="flex items-center gap-1 text-xs min-w-0 overflow-x-auto">
              {packList !== undefined ? (
                /* Pack タブモード */
                <>
                  <PackTabSection
                    packList={packList}
                    selectedPackId={selectedPackId}
                    onSelectPack={onSelectPack}
                    onCreatePack={onCreatePack}
                    onOpenPackSettings={onOpenPackSettings}
                    onPackChange={() => { setSelectedItem(null); onCategorySelect([]) }}
                  />

                  {/* カテゴリ/アイテムのパンくず */}
                  {selectedCategoryFromChart && (
                    <>
                      <span className="text-gray-300 dark:text-gray-500 flex-shrink-0">/</span>
                      <button
                        onClick={() => setSelectedItem(null)}
                        className={`truncate max-w-[80px] transition-colors flex-shrink-0 ${
                          !selectedItem
                            ? 'text-gray-700 dark:text-gray-200 font-medium'
                            : 'text-gray-400 dark:text-gray-400 hover:text-gray-600'
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
                </>
              ) : (
                /* 通常のパンくずモード */
                <>
                  <button
                    onClick={() => { setSelectedItem(null); onCategorySelect([]); }}
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
                    className="p-1.5 rounded-md bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-100 neu-raised hover:bg-gray-300 dark:hover:bg-slate-500 hover:text-gray-900 dark:hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-slate-400"
                    aria-label="Actions menu"
                    title="Actions"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>

                  {/* ドロップダウンメニュー */}
                  {showAddMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg neu-raised py-1 z-[1000]">
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
                          <div className="my-1 neu-divider"></div>
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
                hoveredItemId={hoveredItemId}
                onItemSelect={onItemSelect ? onItemSelect : setSelectedItem}
                onItemHover={onItemHover}
                activePack={activePack}
                activePackItemIds={activePackItemIds}
                onTogglePackItem={onTogglePackItem}
                onAddItemsToPack={onAddItemsToPack}
              />
          </div>
        </Card>
      </div>
    </div>
  )
})

GearChart.displayName = 'GearChart'

export default GearChart
