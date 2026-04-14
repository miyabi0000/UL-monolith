import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useResponsiveSize } from '../hooks/useResponsiveSize'
import { Category, ChartData, ChartViewMode, GearFieldValue, GearItemWithCalculated, Pack, QuantityDisplayMode, WeightBreakdown, ULStatus, ChartFocus, ChartScope } from '../utils/types'
import { COLORS } from '../utils/designSystem'
import { generateItemColor } from '../utils/colorHelpers'
import {
  calculateInnerRingData,
  calculateOuterRingData,
  prepareSortedChartData,
  buildOuterPieData,
  getPayloadUnit,
} from '../utils/chartHelpers'
import Card from './ui/Card'
import GearDetailPanel from './GearDetailPanel'
import ChartSummaryFooter from './charts/ChartSummaryFooter'
import PackTabSection from './charts/PackTabSection'
import ChartHeader from './charts/ChartHeader'
import ChartBody from './charts/ChartBody'
import { ChartGeometryProvider } from './charts/context/ChartGeometryContext'
import ChartBreadcrumb from './charts/ChartBreadcrumb'
import GearActionMenu from './charts/GearActionMenu'
import GearViewToggle from './charts/GearViewToggle'
import { useCenterClickPulse } from './charts/hooks/useCenterClickPulse'
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
  const [centerPulse, triggerCenterPulse] = useCenterClickPulse()

  const screenSize = useResponsiveSize()
  const [isChartCollapsed, setIsChartCollapsed] = useState(false) // グラフ折りたたみ状態
  const [chartDisplayMode, setChartDisplayMode] = useState<'pie' | 'bar'>('pie') // チャート表示モード
  // 二重ドーナツ用状態
  const [chartFocus, setChartFocus] = useState<ChartFocus>('all')
  // Scopeは'base'固定（将来的にトグル復活の可能性あり）
  const chartScope: ChartScope = 'base'
  // hover callout 用 activeIndex は ChartBody 内に局在化済み

  // ジオメトリは ChartGeometryProvider 経由で配下コンポーネントに配布

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
    triggerCenterPulse()
  }, [viewMode, onViewModeChange, triggerCenterPulse])

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
        <ChartGeometryProvider screenSize={screenSize}>
          <ChartBody
            chartDisplayMode={chartDisplayMode}
            viewMode={viewMode}
            totalValue={totalValue}
            sortedData={sortedData}
            outerPieData={outerPieData}
            selectedCategory={selectedData ?? null}
            selectedCategoryName={selectedCategoryFromChart}
            selectedItemId={selectedItem}
            barData={barData}
            dualRingInnerData={dualRingInnerData}
            dualRingOuterData={dualRingOuterData}
            chartFocus={chartFocus}
            selectedCategories={selectedCategories}
            selectedItemData={selectedItemData}
            centerPulse={centerPulse}
            onCenterClick={handleCenterClick}
            weightBreakdown={weightBreakdown}
            ulStatus={ulStatus}
            onCategoryClick={handleCategoryClick}
            onItemClick={handleItemClick}
            onItemHover={onItemHover}
            onInnerRingClick={handleInnerRingClick}
            onDualRingOuterClick={handleDualRingOuterClick}
            onClearCategorySelection={() => selectedData && handleCategoryClick(selectedData.name)}
            hoveredItemId={hoveredItemId ?? null}
          />
        </ChartGeometryProvider>


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

                  <ChartBreadcrumb
                    packMode
                    selectedCategoryName={selectedCategoryFromChart}
                    selectedItemName={selectedItem ? selectedItemName : null}
                    onClearAll={() => { setSelectedItem(null); onCategorySelect([]) }}
                    onClearItem={() => setSelectedItem(null)}
                  />
                </>
              ) : (
                <ChartBreadcrumb
                  selectedCategoryName={selectedCategoryFromChart}
                  selectedItemName={selectedItem ? selectedItemName : null}
                  onClearAll={() => { setSelectedItem(null); onCategorySelect([]) }}
                  onClearItem={() => setSelectedItem(null)}
                />
              )}
            </div>

            {/* 右側: 統合ツールバー */}
            <div className="inline-flex items-center gap-1">
              {onGearViewModeChange && (
                <GearViewToggle
                  gearViewMode={gearViewMode ?? 'table'}
                  showCheckboxes={showCheckboxes}
                  onGearViewModeChange={onGearViewModeChange}
                  onToggleCheckboxes={onToggleCheckboxes}
                />
              )}

              <GearActionMenu
                onShowForm={onShowForm}
                onShowUrlImport={onShowUrlImport}
                onShowCategoryManager={onShowCategoryManager}
              />

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
