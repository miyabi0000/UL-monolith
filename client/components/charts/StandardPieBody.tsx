import React from 'react'
import { generateItemColor } from '../../utils/colorHelpers'
import { COLORS, getCategoryColor } from '../../utils/designSystem'
import type { SortedChartCategory, OuterPieEntry } from '../../utils/chart/pipeline'
import InteractivePie from './InteractivePie'
import ChartPieCell from './ChartPieCell'
import { useChartGeometry } from './context/ChartGeometryContext'

const DEFAULT_COLOR = COLORS.gray[500]

interface StandardPieBodyProps {
  sortedData: SortedChartCategory[]
  outerPieData: OuterPieEntry[]
  selectedCategory: SortedChartCategory | null
  selectedCategoryName: string | null
  selectedItemId: string | null
  outerActiveIndex: number | null
  innerActiveIndex: number | null
  setOuterActiveIndex: (idx: number | null) => void
  setInnerActiveIndex: (idx: number | null) => void
  onCategoryClick: (name: string) => void
  onItemClick: (id: string) => void
  onItemHover?: (id: string | null) => void
}

/**
 * 通常モード (weight / cost) の Pie 本体。
 * 内側=カテゴリ、外側=選択カテゴリ内のアイテム。
 */
const StandardPieBody: React.FC<StandardPieBodyProps> = ({
  sortedData,
  outerPieData,
  selectedCategory,
  selectedCategoryName,
  selectedItemId,
  outerActiveIndex,
  innerActiveIndex,
  setOuterActiveIndex,
  setInnerActiveIndex,
  onCategoryClick,
  onItemClick,
  onItemHover,
}) => {
  const { outerRadiusConfig, innerRadiusConfig } = useChartGeometry()
  const hasCategorySelection = selectedCategoryName !== null
  const baseColor            = selectedCategory?.color ?? DEFAULT_COLOR
  const itemCount            = selectedCategory?.sortedItems?.length ?? 1

  return (
    <>
      {/* 外側円: 選択カテゴリのアイテム (先に描画して背面配置) */}
      {selectedCategoryName && (
        <InteractivePie
          data={outerPieData}
          dataKey="value"
          outerRadius={outerRadiusConfig.outer}
          innerRadius={outerRadiusConfig.inner}
          activeIndex={outerActiveIndex}
          onActiveIndexChange={setOuterActiveIndex}
          onEntryClick={(entry) => onItemClick(entry.id)}
          onEntryHover={(entry) => onItemHover?.(entry?.id ?? null)}
          renderCell={(item, index) => (
            <ChartPieCell
              key={`item-${index}`}
              cellKey={`item-${index}`}
              variant="item"
              color={generateItemColor(baseColor, index, itemCount)}
              strokeBase={baseColor}
              isSelected={selectedItemId === item.id}
            />
          )}
        />
      )}

      {/* 内側円: カテゴリ (最後に描画して前面配置)
       * Mondrian Matte: name から決定論的に Mondrian パレットの色を割当 */}
      <InteractivePie
        data={sortedData}
        dataKey="value"
        outerRadius={innerRadiusConfig.outer}
        innerRadius={innerRadiusConfig.inner}
        activeIndex={innerActiveIndex}
        onActiveIndexChange={setInnerActiveIndex}
        onEntryClick={(entry) => onCategoryClick(entry.name)}
        renderCell={(entry) => (
          <ChartPieCell
            key={`category-${entry.name}`}
            cellKey={`category-${entry.name}`}
            variant="category"
            color={getCategoryColor(entry.name)}
            isSelected={selectedCategoryName === entry.name}
            hasOtherSelection={hasCategorySelection}
          />
        )}
      />
    </>
  )
}

export default StandardPieBody
