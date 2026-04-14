/**
 * Chart 層のコア型定義
 *
 * 責務: チャートの「モード」「選択状態」「ホバー状態」を discriminated union で表現し、
 *       同時に成立しない状態の組み合わせを型レベルで排除する。
 *
 * - ChartMode: 表示モードと表示形式の関係性を型で縛る (weight-class は bar 不可)
 * - ChartSelection: 3 系統に分散していた選択状態を 1 union に統合
 * - CategoryId / ItemId: brand 型で取り違えを防止
 */

// ==================== Brand 型 ====================

declare const brand: unique symbol
type Brand<T, B> = T & { readonly [brand]: B }

export type CategoryId = Brand<string, 'CategoryId'>
export type ItemId     = Brand<string, 'ItemId'>

export const asCategoryId = (raw: string): CategoryId => raw as CategoryId
export const asItemId     = (raw: string): ItemId     => raw as ItemId

// ==================== 表示モード ====================

/**
 * Chart の表示設定
 * - weight / cost: Pie / Bar どちらも可
 * - class (weight-class): Pie のみ (Bar は UI 上未対応)
 */
export type ChartMode =
  | { readonly metric: 'weight'; readonly display: 'pie' | 'bar' }
  | { readonly metric: 'cost';   readonly display: 'pie' | 'bar' }
  | { readonly metric: 'class';  readonly focus:   'all' | 'big3' | 'other' }

export const isClassMode = (mode: ChartMode): mode is Extract<ChartMode, { metric: 'class' }> =>
  mode.metric === 'class'

// ==================== 選択状態 ====================

/**
 * Chart の選択状態
 *
 * - none: 何も選ばれていない
 * - category: カテゴリを選択 (→ 外輪 Pie / バー drill-down)
 * - item: 特定アイテムを選択 (→ 強調、中央表示変更)
 * - classFocus: weight-class モードでの big3/other フォーカス
 *
 * kind を switch で網羅するため exhaustiveness チェックが効く。
 */
export type ChartSelection =
  | { readonly kind: 'none' }
  | { readonly kind: 'category';   readonly categoryName: string }
  | { readonly kind: 'item';       readonly itemId: ItemId; readonly categoryName: string }
  | { readonly kind: 'classFocus'; readonly focus: 'big3' | 'other' }

export const SELECTION_NONE: ChartSelection = { kind: 'none' }
