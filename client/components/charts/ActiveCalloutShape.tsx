import React from 'react'
import { Sector } from 'recharts'
import { COLORS } from '../../utils/designSystem'
import { alpha } from '../../styles/tokens'
import { formatWeight, WeightUnit } from '../../utils/weightUnit'

const CALLOUT_THRESHOLD = 0.03 // 3%未満はcallout非表示

export interface ActiveShapeProps {
  cx: number
  cy: number
  innerRadius: number
  outerRadius: number
  startAngle: number
  endAngle: number
  fill: string
  payload: {
    label?: string
    value: number
    ratio?: number
    color?: string
    unit?: string // 'g' | '¥' など
  }
}

const ActiveCalloutShape: React.FC<ActiveShapeProps> = (props) => {
  const {
    cx, cy,
    innerRadius, outerRadius,
    startAngle, endAngle,
    fill,
    payload
  } = props

  const ratio = payload.ratio ?? 0

  // 3%未満はcallout出さない（セクターのみ）
  if (ratio < CALLOUT_THRESHOLD) {
    return (
      <g style={{ outline: 'none' }}>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{ outline: 'none' }}
        />
      </g>
    )
  }

  const RAD = Math.PI / 180
  const midAngle = (startAngle + endAngle) / 2
  const cos = Math.cos(-midAngle * RAD)
  const sin = Math.sin(-midAngle * RAD)

  // 引き出し線の各点
  const r1 = outerRadius + 4
  const r2 = outerRadius + 16
  const x1 = cx + r1 * cos
  const y1 = cy + r1 * sin
  const x2 = cx + r2 * cos
  const y2 = cy + r2 * sin
  const x3 = x2 + (cos >= 0 ? 14 : -14)
  const y3 = y2

  const textAnchor = cos >= 0 ? 'start' : 'end'

  // ラベル位置
  const labelX = x3 + (cos >= 0 ? 6 : -6)
  const labelY = y3

  // 単位に応じた値テキスト（payload.unit に 'g' / 'oz' / '¥' いずれかが入る）
  const unit = payload.unit ?? 'g'
  const valueText = unit === '¥'
    ? `¥${Math.round(payload.value / 100).toLocaleString()}`
    : formatWeight(payload.value, unit as WeightUnit)
  const labelText = payload.label ?? ''
  const textWidth = Math.max(valueText.length * 7, labelText.length * 5.5) + 8
  const textHeight = 28
  const rectX = cos >= 0 ? labelX - 4 : labelX - textWidth + 4
  const rectY = labelY - 10

  return (
    <g style={{ outline: 'none' }}>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 2}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ outline: 'none' }}
      />
      {/* 引き出し線 */}
      <polyline
        points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
        fill="none"
        stroke={COLORS.gray[500]}
        strokeWidth={2}
      />
      {/* ラベル背景 */}
      <rect
        x={rectX}
        y={rectY}
        width={textWidth}
        height={textHeight}
        rx={4}
        fill={alpha(COLORS.gray[900], 0.85)}
      />
      {/* 値ラベル */}
      <text
        x={labelX}
        y={labelY}
        textAnchor={textAnchor}
        dominantBaseline="middle"
        fontSize={11}
        fontWeight="bold"
        fill={COLORS.white}
      >
        {valueText}
      </text>
      {/* 名前ラベル */}
      <text
        x={labelX}
        y={labelY + 12}
        textAnchor={textAnchor}
        dominantBaseline="middle"
        fontSize={9}
        fill={alpha(COLORS.white, 0.7)}
      >
        {labelText}
      </text>
    </g>
  )
}

export default ActiveCalloutShape
