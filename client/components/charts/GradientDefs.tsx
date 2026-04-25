import React from 'react'

/**
 * SVG <defs> — グレインテクスチャフィルター
 *
 * feTurbulence ベースの grain フィルター (3 seed 循環) で、各セクターに
 * マットな粒子テクスチャを与える。カラーバリエーションは generateItemColor
 * の HSL 変化で表現するので、ここでは linearGradient は生成しない。
 *
 * このノイズはデザインシステム全体 (UI サーフェス側) と視覚言語を共有する:
 *   - JS トークン:  client/utils/designSystem.ts の `NOISE`
 *   - CSS 変数:     client/styles/globals.css の `--noise-url-{a,b,c}` /
 *                   `--noise-opacity-*` / `.noise-{surface,control,prominent}`
 *   - SVG defs:     当ファイル (チャートセクター用)
 *
 * baseFrequency / numOctaves / seed 値を変更する場合は、上記 3 箇所を
 * 必ず同期させること。GRAIN_SEEDS は CSS 側の seed=3/11/29 と一致。
 */

interface GradientDefsProps {
  /** グレインの粗さ (0.5=粗め, 1.5=細かめ) */
  baseFrequency?: number
  /** ダークグレインの強度 (0-0.6) */
  darkStrength?: number
  /** ライトグレインの強度 (0-0.4) */
  lightStrength?: number
}

const GRAIN_SEEDS = [3, 11, 29] as const

const GrainFilter: React.FC<{
  id: string
  seed: number
  baseFrequency: number
  darkStrength: number
  lightStrength: number
}> = ({ id, seed, baseFrequency, darkStrength, lightStrength }) => (
  <filter id={id} x="0%" y="0%" width="100%" height="100%">
    <feTurbulence
      type="fractalNoise"
      baseFrequency={baseFrequency}
      numOctaves={2}
      seed={seed}
      stitchTiles="stitch"
      result="noise"
    />
    <feColorMatrix
      in="noise"
      type="matrix"
      values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${darkStrength} 0 0 0 0`}
      result="darkGrain"
    />
    <feColorMatrix
      in="noise"
      type="matrix"
      values={`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  ${-lightStrength} 0 0 0 ${lightStrength}`}
      result="lightGrain"
    />
    <feComposite in="darkGrain" in2="SourceGraphic" operator="in" result="darkMasked" />
    <feComposite in="lightGrain" in2="SourceGraphic" operator="in" result="lightMasked" />
    <feMerge>
      <feMergeNode in="SourceGraphic" />
      <feMergeNode in="lightMasked" />
      <feMergeNode in="darkMasked" />
    </feMerge>
  </filter>
)

const GradientDefs: React.FC<GradientDefsProps> = ({
  baseFrequency = 1.1,
  darkStrength = 0.32,
  lightStrength = 0.18,
}) => (
  <defs>
    {GRAIN_SEEDS.map((seed, idx) => (
      <GrainFilter
        key={seed}
        id={`chart-grain-${idx}`}
        seed={seed}
        baseFrequency={baseFrequency}
        darkStrength={darkStrength}
        lightStrength={lightStrength}
      />
    ))}
    {/* 選択時の外側グロー (残置) */}
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
  </defs>
)

export default GradientDefs
/** フィルター ID を index から循環参照するためのヘルパー */
export const grainFilterId = (index: number): string => `chart-grain-${index % GRAIN_SEEDS.length}`
