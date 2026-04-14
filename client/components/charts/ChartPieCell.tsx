import React from 'react'
import { Cell } from 'recharts'
import { COLORS } from '../../utils/designSystem'
import { darkenColor, darkenHslColor } from '../../utils/colorHelpers'

/**
 * Chart の Pie セグメント共通セル。
 *
 * GearChart 内に散在していた 4 種の <Cell> 描画ロジックを 1 箇所に集約する。
 * バリアントごとに「色暗変化 / 不透明度 / 枠線 / drop-shadow」の規則が異なるため、
 * variant + state から視覚スタイルへの写像を内部で完結させる。
 */

export type CellVariant =
  /** 通常モードの内側円: カテゴリ */
  | 'category'
  /** 通常モードの外側円: 選択カテゴリ内のアイテム */
  | 'item'
  /** weight-class の外輪: カテゴリ or Big3 内訳 */
  | 'dualOuter'
  /** weight-class の内輪: Big3 / Other */
  | 'dualInner'

interface BaseProps {
  color: string
  variant: CellVariant
  /** このセグメントが選択されている */
  isSelected?: boolean
  /** 他のセグメントが選択されている (自分以外) */
  hasOtherSelection?: boolean
  /**
   * dualInner: chartFocus と id が一致しているか
   * dualOuter: chartFocus !== 'all' (薄く表示する)
   * 他 variant では無視
   */
  isFocused?: boolean
  isDimmedByFocus?: boolean
  /**
   * item variant のみ: 枠線用のベースカラー
   * (選択カテゴリの色をベースに暗くしたストローク)
   */
  strokeBase?: string
}

const transitionStyle = {
  transition: 'all 0.2s ease',
  outline: 'none',
  cursor: 'pointer',
} as const

const resolveStyle = (props: BaseProps): React.SVGProps<SVGPathElement> => {
  const { color, variant, isSelected, hasOtherSelection, isFocused, isDimmedByFocus, strokeBase } = props

  switch (variant) {
    case 'category': {
      const darkFill   = darkenColor(color, 0.15)
      const darkStroke = darkenColor(color, 0.2)
      return {
        fill:        isSelected ? darkFill : color,
        stroke:      isSelected ? darkStroke : COLORS.white,
        strokeWidth: isSelected ? 2 : 1,
        opacity:     hasOtherSelection && !isSelected ? 0.4 : 1,
        style: {
          ...transitionStyle,
          filter: isSelected ? `drop-shadow(0 0 6px ${darkStroke}99)` : 'none',
        },
      }
    }

    case 'item': {
      const darkFill   = darkenHslColor(color, 0.2)
      const darkStroke = darkenColor(strokeBase ?? color, 0.2)
      return {
        fill:        isSelected ? darkFill : color,
        stroke:      isSelected ? darkStroke : COLORS.white,
        strokeWidth: isSelected ? 2 : 1,
        opacity:     isSelected ? 1 : 0.85,
        style: {
          ...transitionStyle,
          filter: isSelected ? `drop-shadow(0 0 6px ${darkStroke}99)` : 'none',
        },
      }
    }

    case 'dualOuter': {
      const darkFill = darkenColor(color, 0.15)
      // focus 中は薄めに、未 focus は少し濃く
      const baseOpacity = isDimmedByFocus ? 0.5 : 0.7
      return {
        fill:        isSelected ? darkFill : color,
        stroke:      COLORS.white,
        strokeWidth: isSelected ? 2 : 1,
        opacity:     isSelected ? 0.95 : baseOpacity,
        style:       transitionStyle,
      }
    }

    case 'dualInner': {
      const darkFill = darkenColor(color, 0.25)
      return {
        fill:        isFocused ? darkFill : color,
        stroke:      isFocused ? darkFill : COLORS.white,
        strokeWidth: isFocused ? 3 : 2,
        opacity:     isFocused || !hasOtherSelection ? 1 : 0.35,
        style: {
          ...transitionStyle,
          filter: isFocused ? `drop-shadow(0 0 8px ${color}aa)` : 'none',
        },
      }
    }
  }
}

export const ChartPieCell: React.FC<BaseProps & { cellKey: string }> = (props) => {
  const style = resolveStyle(props)
  return <Cell key={props.cellKey} {...style} />
}

export default ChartPieCell
