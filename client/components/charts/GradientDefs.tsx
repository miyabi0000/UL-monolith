import React from 'react'
import { toShades } from './gradientHelpers'

/**
 * SVG <defs> — カテゴリ別グラデーション + 有機的ノイズフィルター
 *
 * 各エントリ色を 3 段階 (highlight / base / shadow) の radialGradient に展開し、
 * ドーナツのセル毎に立体感・マテリアル感を与える。
 * 境界は feTurbulence + feDisplacementMap で有機的に揺らがせ、
 * 「隣のセルへ溶け込む」雰囲気を作る。
 *
 * `<PieChart>` の最初の子として差し込めば、Recharts が同じ <svg>
 * 内にレンダリングするので `<Cell fill="url(#<id>)">` から参照できる。
 */

export interface GradientColorEntry {
  /** 一意 ID (セル側で url(#...) で参照する裸 ID) */
  id: string
  /** ベース色 (HEX `#RRGGBB` / `hsl(...)` どちらも可) */
  color: string
}

interface GradientDefsProps {
  /** グラデーションを定義する対象エントリ群 */
  entries: readonly GradientColorEntry[]
  /** filter の強度 (0-1)。既定 0.5 で有機的な揺らぎ */
  noiseStrength?: number
  /** radialGradient の中心オフセット (Mondrian 風マテリアル感用) */
  highlightCenter?: { cx: string; cy: string; fx: string; fy: string; r: string }
}

const DEFAULT_NOISE_STRENGTH = 0.5
const DEFAULT_HIGHLIGHT = { cx: '32%', cy: '26%', fx: '28%', fy: '22%', r: '90%' } as const

const GradientDefs: React.FC<GradientDefsProps> = ({
  entries,
  noiseStrength = DEFAULT_NOISE_STRENGTH,
  highlightCenter = DEFAULT_HIGHLIGHT,
}) => {
  const scale = Math.max(0, Math.min(1, noiseStrength)) * 5

  return (
    <defs>
      {/* 有機的ノイズ: 境界をわずかに揺らす */}
      <filter id="chart-organic-noise" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves={2}
          seed={11}
          result="noise"
        />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale={scale} />
      </filter>

      {/* ソフトブラー: セルの縁を僅かに溶かす */}
      <filter id="chart-soft-blur" x="-5%" y="-5%" width="110%" height="110%">
        <feGaussianBlur stdDeviation="0.4" />
      </filter>

      {/* 選択時の外側グロー: 彩度を上げて放射状に光らせる */}
      <filter id="chart-select-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1.8 0"
          result="glow"
        />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* エントリ別 radial gradient: highlight → base → shadow の 3 段階 */}
      {entries.map((entry) => {
        const { highlight, base, shadow } = toShades(entry.color)
        return (
          <radialGradient
            key={entry.id}
            id={entry.id}
            cx={highlightCenter.cx}
            cy={highlightCenter.cy}
            r={highlightCenter.r}
            fx={highlightCenter.fx}
            fy={highlightCenter.fy}
          >
            <stop offset="0%" stopColor={highlight} stopOpacity={1} />
            <stop offset="55%" stopColor={base} stopOpacity={1} />
            <stop offset="100%" stopColor={shadow} stopOpacity={1} />
          </radialGradient>
        )
      })}
    </defs>
  )
}

export default GradientDefs
