import React from 'react'
import { Sector } from 'recharts'
import { COLORS } from '../../utils/designSystem'
import { formatWeight, WeightUnit } from '../../utils/weightUnit'

const CALLOUT_THRESHOLD = 0.03 // 3% 未満はラベル非表示

export interface ActiveShapeProps {
  cx: number
  cy: number
  innerRadius: number
  outerRadius: number
  startAngle: number
  endAngle: number
  fill: string
  cornerRadius?: number
  paddingAngle?: number
  /** Recharts が activeShape コールバックに渡す index */
  index?: number
  payload: {
    label?: string
    value: number
    ratio?: number
    color?: string
    unit?: string // 'g' | '¥' など
  }
}

/** Hover 時の拡大量 (px)。角丸を保ったままほんのり大きくなる感じ */
const HOVER_BULGE = 8

/** grain フィルター ID を index から循環参照（ChartBody と同じロジック） */
const GRAIN_SEED_COUNT = 3
const grainFilterIdForIndex = (idx: number | undefined): string =>
  `url(#chart-grain-${((idx ?? 0) % GRAIN_SEED_COUNT + GRAIN_SEED_COUNT) % GRAIN_SEED_COUNT})`

/** label を chart 範囲内に収めるクランプ計算 */
const clampLabelPosition = (
  cx: number,
  cy: number,
  outerRadius: number,
  x: number,
  y: number,
): { x: number; y: number } => {
  // 許容範囲: chart 中心から outerRadius + α 以内に収める
  const maxReach = outerRadius + 20
  const dx = x - cx
  const dy = y - cy
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist <= maxReach) return { x, y }
  const scale = maxReach / dist
  return { x: cx + dx * scale, y: cy + dy * scale }
}

const ActiveCalloutShape: React.FC<ActiveShapeProps> = (props) => {
  const {
    cx, cy,
    innerRadius, outerRadius,
    startAngle, endAngle,
    fill,
    cornerRadius,
    paddingAngle,
    index,
    payload,
  } = props
  const grainFilter = grainFilterIdForIndex(index)

  const ratio = payload.ratio ?? 0

  // 3% 未満はセクターを膨らますだけでラベルは出さない
  if (ratio < CALLOUT_THRESHOLD) {
    return (
      <g style={{ outline: 'none' }}>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + HOVER_BULGE}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          cornerRadius={cornerRadius}
          paddingAngle={paddingAngle}
          stroke="none"
          style={{ outline: 'none', filter: grainFilter }}
        />
      </g>
    )
  }

  const RAD = Math.PI / 180
  const midAngle = (startAngle + endAngle) / 2
  const cos = Math.cos(-midAngle * RAD)
  const sin = Math.sin(-midAngle * RAD)

  // ラベル位置: セクター外周すぐ隣に配置 (leader line 撤去)。
  // chart の半径 + 小さなオフセットで収める → overflow を防ぐ。
  const labelOffset = 6
  const rawX = cx + (outerRadius + HOVER_BULGE + labelOffset) * cos
  const rawY = cy + (outerRadius + HOVER_BULGE + labelOffset) * sin
  const { x: labelX, y: labelY } = clampLabelPosition(cx, cy, outerRadius, rawX, rawY)

  const textAnchor = cos >= 0 ? 'start' : 'end'

  // 単位に応じた値テキスト（payload.unit に 'g' / 'oz' / '¥' いずれかが入る）
  const unit = payload.unit ?? 'g'
  const valueText =
    unit === '¥'
      ? `¥${Math.round(payload.value / 100).toLocaleString()}`
      : formatWeight(payload.value, unit as WeightUnit)
  const labelText = payload.label ?? ''

  return (
    <g style={{ outline: 'none' }}>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + HOVER_BULGE}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={cornerRadius}
        paddingAngle={paddingAngle}
        stroke="none"
        style={{ outline: 'none', filter: grainFilter }}
      />
      {/* 値ラベル: マット背景に馴染むよう chrome を排し、text-stroke で
          コントラストを確保する。(paint-order: stroke fill で縁取り) */}
      <text
        x={labelX}
        y={labelY}
        textAnchor={textAnchor}
        dominantBaseline="middle"
        fontSize={11}
        fontWeight={700}
        fill={COLORS.gray[900]}
        stroke="rgba(255,255,255,0.85)"
        strokeWidth={3}
        paintOrder="stroke"
        style={{ letterSpacing: '0.01em' }}
      >
        {valueText}
      </text>
      {/* 名前 (小さめ、控えめ) */}
      {labelText && (
        <text
          x={labelX}
          y={labelY + 12}
          textAnchor={textAnchor}
          dominantBaseline="middle"
          fontSize={9}
          fontWeight={500}
          fill={COLORS.gray[600]}
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={2.5}
          paintOrder="stroke"
        >
          {labelText}
        </text>
      )}
    </g>
  )
}

export default ActiveCalloutShape
