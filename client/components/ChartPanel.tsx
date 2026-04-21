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
  gearViewMode?: 'table' | 'card' | 'compare' // ギア表示モード
  onGearViewModeChange?: (mode: 'table' | 'card' | 'compare') => void // モード変更ハンドラ
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
  gearViewMode,
  onGearViewModeChange,
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
  // モバイルではデフォルトで折りたたんでリストを優先表示。ユーザーが展開したら
  // 以降は localStorage で記憶する。
  const [isChartCollapsed, setIsChartCollapsed] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('chartCollapsed') : null
    if (saved === '0') return false
    if (saved === '1') return true
    // 初期値: モバイル幅は折りたたみ、デスクトップは展開
    return typeof window !== 'undefined' && window.innerWidth < 640
  })
  // 展開状態の永続化
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chartCollapsed', isChartCollapsed ? '1' : '0')
    }
  }, [isChartCollapsed])
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

  // ==================== イベントハンドラー（memo化） ====================
  //
  // 設計原則: 各クリックは "atomic transition" — 選択状態 (category / item /
  // classFocus) を 1 回の操作で完全に定義する。クリック後に useEffect で他の
  // 状態を後追い変更しない (旧状態と新状態の競合を防ぐ)。
  //
  // 遷移ルール:
  //   - category 選択/解除  → item / classFocus を常に clear
  //   - item 選択            → その item の category を自動で選択 + classFocus clear
  //   - classFocus toggle    → category / item を clear
  //   - view / display mode 切替 → 既存値を維持 (ユーザーの選択は保持)

  const handleCategoryClick = useCallback((categoryName: string) => {
    const isDeselect = selectedCategories.includes(categoryName)
    onCategorySelect(isDeselect ? [] : [categoryName])
    setSelectedItem(null)
    setChartFocus('all')
  }, [selectedCategories, onCategorySelect, setSelectedItem])

  const handleItemClick = useCallback((itemId: string) => {
    const isDeselect = selectedItem === itemId
    const nextItem = isDeselect ? null : itemId
    setSelectedItem(nextItem)
    setChartFocus('all')
    // 選択時: item が属する category を自動で選択状態に
    if (nextItem) {
      const item = items.find(i => i.id === nextItem)
      const categoryName = item?.category?.name
      if (categoryName && !selectedCategories.includes(categoryName)) {
        onCategorySelect([categoryName])
      }
    }
  }, [selectedItem, items, selectedCategories, onCategorySelect, setSelectedItem])

  const handleCenterClick = useCallback(() => {
    const nextMode: ChartViewMode = viewMode === 'weight' ? 'cost' : 'weight'
    onViewModeChange(nextMode)
    triggerCenterPulse()
  }, [viewMode, onViewModeChange, triggerCenterPulse])

  // 二重ドーナツ: Inner ringクリック（Big3 vs Other 切替）
  // 競合回避のため他の選択を解除する
  const handleInnerRingClick = useCallback((segmentId: string) => {
    onCategorySelect([])
    setSelectedItem(null)
    if (segmentId === 'big3') {
      setChartFocus(chartFocus === 'big3' ? 'all' : 'big3')
    } else if (segmentId === 'other') {
      setChartFocus(chartFocus === 'other' ? 'all' : 'other')
    }
  }, [chartFocus, onCategorySelect, setSelectedItem])

  // 二重ドーナツ: Outer ringクリック（カテゴリ選択）
  const handleDualRingOuterClick = useCallback((segmentId: string) => {
    const segment = dualRingOuterData?.find(s => s.id === segmentId)
    if (!segment) return
    const isDeselect = selectedCategories.includes(segment.label)
    onCategorySelect(isDeselect ? [] : [segment.label])
    setSelectedItem(null)
    setChartFocus('all')
  }, [dualRingOuterData, selectedCategories, onCategorySelect, setSelectedItem])

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
        />
            </>
          )}
      </Card>

        {/* Gear Detail Panel（右側パネル） */}
        <Card className="flat-panel flex-1 flex flex-col min-w-0 overflow-visible">
          {/* パネルヘッダー */}
          <div className="relative z-[60] flex items-center justify-between px-3 py-2 border-b border-gray-200 flex-shrink-0 h-11 overflow-visible">
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

            {/* 右側ツールバー: 表示切替 (Card / Table / Compare)
             * 旧 Edit (✏️) ボタンは廃止。編集は各行の ⋯ メニュー → Edit で per-row に実行する。 */}
            {onGearViewModeChange && (
              <div className="inline-flex items-center">
                <GearViewToggle
                  gearViewMode={gearViewMode ?? 'table'}
                  onGearViewModeChange={onGearViewModeChange}
                />
              </div>
            )}
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
