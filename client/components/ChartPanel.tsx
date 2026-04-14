import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useResponsiveSize } from '../hooks/useResponsiveSize'
import { Category, ChartData, ChartViewMode, GearFieldValue, GearItemWithCalculated, Pack, QuantityDisplayMode, WeightBreakdown, ULStatus, ChartFocus, ChartScope } from '../utils/types'
import { COLORS } from '../utils/designSystem'
import { deriveChartSelection } from '../utils/chart/chartTypes'
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
import { useChartCalculations } from './charts/hooks/useChartCalculations'
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
interface ChartPanelProps {
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

const ChartPanel: React.FC<ChartPanelProps> = React.memo(({
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

  // ==================== データ処理 (useChartCalculations に集約) ====================

  const {
    totalValue,
    sortedData,
    selectedCategoryFromChart,
    selectedData,
    outerPieData,
    selectedItemData,
    barData,
    dualRingInnerData,
    dualRingOuterData,
  } = useChartCalculations({
    data,
    analysisItems,
    categories,
    viewMode,
    quantityDisplayMode,
    selectedCategories,
    selectedItem,
    chartFocus,
    chartScope,
    totalWeight,
    totalCost,
    weightUnit,
    defaultColor: DEFAULT_COLOR,
  })

  // Card/Listからアイテム選択された場合、対応カテゴリも自動選択
  const selectedItemCategoryRef = useRef<string | null>(null)
  useEffect(() => {
    if (!selectedItem) {
      selectedItemCategoryRef.current = null
      return
    }
    const item = items.find(i => i.id === selectedItem)
    const categoryName = item?.category?.name ?? null
    if (categoryName && categoryName !== selectedItemCategoryRef.current && !selectedCategories.includes(categoryName)) {
      selectedItemCategoryRef.current = categoryName
      onCategorySelect([categoryName])
    }
  }, [selectedItem, items, selectedCategories, onCategorySelect])

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

  // パンくずリスト用の選択中アイテム名を取得 (items prop から検索)
  const selectedItemName = useMemo(() => {
    if (!selectedItem || !items) return null
    return items.find((i) => i.id === selectedItem)?.name ?? null
  }, [selectedItem, items])

  // 散在した選択ソースを 1 つの ChartSelection union に集約
  // (下流コンポーネントでは selection.kind の switch で網羅判定可能に)
  // selectedItem は必ず selectedCategoryFromChart の文脈下で発生するため
  // categoryName は単一カテゴリ選択値をそのまま使う
  const chartSelection = useMemo(
    () =>
      deriveChartSelection(
        selectedCategories,
        selectedItem ?? null,
        selectedCategoryFromChart,
        chartFocus,
        viewMode === 'weight-class',
      ),
    [selectedCategories, selectedItem, selectedCategoryFromChart, chartFocus, viewMode],
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
            selection={chartSelection}
            selectedCategories={selectedCategories}
            sortedData={sortedData}
            outerPieData={outerPieData}
            selectedCategory={selectedData ?? null}
            barData={barData}
            dualRingInnerData={dualRingInnerData}
            dualRingOuterData={dualRingOuterData}
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
                className={`icon-btn ${
                  showCheckboxes
                    ? 'bg-gray-700 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm'
                    : gearViewMode === 'compare'
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
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

ChartPanel.displayName = 'ChartPanel'

export default ChartPanel
