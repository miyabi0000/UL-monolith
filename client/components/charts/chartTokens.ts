/**
 * チャート全体で共有する視覚トークン。
 * Pie / Bar / Center overlay で同じ値を参照することで、状態遷移や配色の
 * 一貫性を保つ。
 */

/** セクター / バーの状態遷移 (opacity + fill) */
export const CHART_CELL_TRANSITION = 'opacity 0.5s ease, fill 0.5s ease' as const

/** 選択中に dim される側の opacity */
export const CHART_OPACITY_DIMMED = 0.55
/** 通常 / 選択中の opacity */
export const CHART_OPACITY_BASE = 1
