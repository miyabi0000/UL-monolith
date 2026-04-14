import React from 'react'
import type { DonutSegment, ChartFocus } from '../../utils/types'
import InteractivePie from './InteractivePie'
import ChartPieCell from './ChartPieCell'
import { useChartGeometry } from './context/ChartGeometryContext'

interface DualRingPieBodyProps {
  innerData: DonutSegment[]
  outerData: DonutSegment[]
  selectedCategories: string[]
  chartFocus: ChartFocus
  outerActiveIndex: number | null
  innerActiveIndex: number | null
  setOuterActiveIndex: (idx: number | null) => void
  setInnerActiveIndex: (idx: number | null) => void
  onInnerClick: (segmentId: string) => void
  onOuterClick: (segmentId: string) => void
}

/**
 * weight-class モードの二重ドーナツ。
 * 内輪: Big3 / Other (chartFocus 切替)
 * 外輪: カテゴリ or Big3 内訳 (focus 依存)
 */
const DualRingPieBody: React.FC<DualRingPieBodyProps> = ({
  innerData,
  outerData,
  selectedCategories,
  chartFocus,
  outerActiveIndex,
  innerActiveIndex,
  setOuterActiveIndex,
  setInnerActiveIndex,
  onInnerClick,
  onOuterClick,
}) => {
  const { outerRadiusConfig, innerRadiusConfig } = useChartGeometry()
  const hasFocus = chartFocus !== 'all'

  return (
    <>
      {/* 外輪: 先に描画 */}
      <InteractivePie
        data={outerData}
        dataKey="value"
        outerRadius={outerRadiusConfig.outer}
        innerRadius={outerRadiusConfig.inner}
        activeIndex={outerActiveIndex}
        onActiveIndexChange={setOuterActiveIndex}
        onEntryClick={(entry) => onOuterClick(entry.id)}
        renderCell={(entry, index) => (
          <ChartPieCell
            key={`dual-outer-${index}`}
            cellKey={`dual-outer-${index}`}
            variant="dualOuter"
            color={entry.color}
            isSelected={selectedCategories.includes(entry.label)}
            isDimmedByFocus={hasFocus}
          />
        )}
      />

      {/* 内輪: 後に描画して前面に */}
      <InteractivePie
        data={innerData}
        dataKey="value"
        outerRadius={innerRadiusConfig.outer}
        innerRadius={innerRadiusConfig.inner}
        activeIndex={innerActiveIndex}
        onActiveIndexChange={setInnerActiveIndex}
        onEntryClick={(entry) => onInnerClick(entry.id)}
        renderCell={(entry, index) => (
          <ChartPieCell
            key={`dual-inner-${index}`}
            cellKey={`dual-inner-${index}`}
            variant="dualInner"
            color={entry.color}
            isFocused={chartFocus === entry.id}
            hasOtherSelection={chartFocus !== 'all' && chartFocus !== entry.id}
          />
        )}
      />
    </>
  )
}

export default DualRingPieBody
