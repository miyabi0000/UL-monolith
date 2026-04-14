import React from 'react'
import { Pie } from 'recharts'
import ActiveCalloutShape from './ActiveCalloutShape'

/**
 * Recharts `<Pie>` の型安全ラッパ。
 *
 * GearChart 内で 4 箇所繰り返されていた共通プロパティ
 *   cx="50%", cy="50%", activeShape=ActiveCalloutShape, className="cursor-pointer"
 *   onMouseEnter / onMouseLeave でのアクティブ index 管理
 * を内部に隠蔽し、呼び出し側は「データ」「半径」「クリック/ホバー時の副作用」だけ渡す。
 *
 * 子要素 (Cell) は renderCell callback で供給する (children 方式は Recharts の型と相性悪)。
 */

interface InteractivePieProps<E extends object> {
  data: readonly E[]
  dataKey: string
  outerRadius: number
  innerRadius: number
  activeIndex: number | null
  onActiveIndexChange: (index: number | null) => void
  onEntryClick?: (entry: E) => void
  onEntryHover?: (entry: E | null) => void
  renderCell: (entry: E, index: number) => React.ReactElement
}

export function InteractivePie<E extends object>({
  data,
  dataKey,
  outerRadius,
  innerRadius,
  activeIndex,
  onActiveIndexChange,
  onEntryClick,
  onEntryHover,
  renderCell,
}: InteractivePieProps<E>) {
  return (
    <Pie
      data={data as E[]}
      dataKey={dataKey}
      cx="50%"
      cy="50%"
      outerRadius={outerRadius}
      innerRadius={innerRadius}
      // biome-ignore lint/suspicious/noExplicitAny: Recharts の activeShape 型が緩い
      activeShape={ActiveCalloutShape as any}
      activeIndex={activeIndex ?? undefined}
      onClick={onEntryClick ? (entry: E) => onEntryClick(entry) : undefined}
      onMouseEnter={(entry: E, idx: number) => {
        onActiveIndexChange(idx)
        onEntryHover?.(entry)
      }}
      onMouseLeave={() => {
        onActiveIndexChange(null)
        onEntryHover?.(null)
      }}
      className="cursor-pointer"
    >
      {data.map((entry, index) => renderCell(entry, index))}
    </Pie>
  )
}

export default InteractivePie
