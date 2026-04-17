import React from 'react'
import { BORDERS } from '../../../utils/designSystem'
import { alpha } from '../../../styles/tokens'
import { blue, orange, red } from '../../../styles/tokens/primitives'

/**
 * 優先度トークンのカラー定義。1-5 の段階で青→橙→赤へ段階的に移行する。
 *
 * NOTE: `GearInfoSummary.tsx` 側に Mondrian 縮退版（赤/黄/黒）の同名定義があり、
 * そちらはカード詳細用の別見た目。用途が異なるため各々独立に維持する。
 */
const PRIORITY_STYLE: Record<number, { color: string; bg: string; border: string }> = {
  1: { color: blue[700], bg: alpha(blue[500], 0.12), border: alpha(blue[500], 0.3) },
  2: { color: blue[600], bg: alpha(blue[500], 0.08), border: alpha(blue[500], 0.2) },
  3: { color: orange[700], bg: alpha(orange[500], 0.12), border: alpha(orange[500], 0.3) },
  4: { color: orange[800], bg: alpha(orange[500], 0.18), border: alpha(orange[500], 0.4) },
  5: { color: red[700], bg: alpha(red[500], 0.12), border: alpha(red[500], 0.3) },
}

interface PrioritySelectorProps {
  priority: number
  onChange: (value: number) => void
}

/** 優先度セレクタ（1-5）。表示は色付きのコンパクトなトークン。 */
export const PrioritySelector: React.FC<PrioritySelectorProps> = ({ priority, onChange }) => {
  const style = PRIORITY_STYLE[priority] ?? PRIORITY_STYLE[3]

  return (
    <div className="flex h-6 items-center justify-center">
      <select
        value={priority}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="gear-priority-token h-6 w-6"
        style={{
          color: style.color,
          backgroundColor: style.bg,
          border: BORDERS.default,
          borderColor: style.border,
        }}
        aria-label="Priority"
        title={`Priority ${priority}`}
      >
        <option value={1}>1</option>
        <option value={2}>2</option>
        <option value={3}>3</option>
        <option value={4}>4</option>
        <option value={5}>5</option>
      </select>
    </div>
  )
}
