/**
 * Unified Design System
 * Consolidates colors, styles, and utilities into a single source of truth
 *
 * 色値は client/styles/tokens/ のトークンから取得（互換シム）
 * スケール値（白銀比）は現在の値を維持
 */

import { primitiveColors, alpha, mondrian } from '../styles/tokens';

// Mondrian 3原色を designSystem 経由で再エクスポート（コンポーネント側 import を一本化）
export { mondrian };

// 白銀比（Silver Ratio）定数
export const SILVER_RATIO = 1.414;
export const BASE_UNIT = 8; // ベースユニット（px）

// 白銀比スケール（スペーシング用）
export const SPACING_SCALE = {
  xs: 4,    // 0.5 unit
  sm: 6,    // 0.75 unit
  base: 8,  // 1 unit
  md: 12,   // 1.5 unit
  lg: 16,   // 2 unit
  xl: 23,   // 2.875 unit (16 × 1.414)
  '2xl': 32,  // 4 unit
  '3xl': 46,  // 5.75 unit (32 × 1.414)
  '4xl': 64,  // 8 unit
} as const;

// Font Family
export const FONT_FAMILY = 'Inter, sans-serif' as const;

// Typography scale — tailwind.config.js fontSize と globals.css の --gear-font-* と整合
// 単一の真実: 値の変更は 3 ファイル全てに反映する
export const FONT_SCALE = {
  '3xs': 9,
  '2xs': 10,
  xs:    11,
  sm:    12,
  base:  14,
  lg:    16,
  xl:    18,
  '2xl': 20,
} as const;

/**
 * @deprecated Tailwind の `leading-*` ユーティリティを優先。
 * 既存のチャート系コンポーネントが参照しているため値は保持。
 */
export const LINE_HEIGHT_SCALE = {
  xs: 17,   // 12 × 1.414
  sm: 24,   // 17 × 1.414
  base: 34, // 24 × 1.414
  lg: 48,   // 34 × 1.414
  xl: 68,   // 48 × 1.414
  '2xl': 96, // 68 × 1.414
} as const;

// 角丸スケール（白銀比ベース）
export const RADIUS_SCALE = {
  none: 0,
  xs: 2,     // 極小
  sm: 4,     // 小
  base: 6,   // 基本
  md: 8,     // 中（6 × 1.414 ≈ 8）
  lg: 12,    // 大（8 × 1.414 ≈ 12）
  xl: 16,    // 特大（12 × 1.414 ≈ 17）
  '2xl': 24, // 超特大（16 × 1.414 ≈ 23）
  full: 9999, // 完全な円
} as const;

// コンポーネント角丸: 3層階層ルール
// CSS変数: --radius-surface / --radius-control / --radius-badge
export const COMPONENT_RADIUS = {
  /** L1 Surface: カード・モーダル・パネル・テーブルシェル (12px = rounded-lg) */
  surface: RADIUS_SCALE.lg,
  /** L2 Control: ボタン・入力・チップ・ドロップダウン・メニュー (8px = rounded-md) */
  control: RADIUS_SCALE.md,
  /** L3 Badge: 優先度トークン・カテゴリバッジ・ピル形状 (9999px = rounded-pill) */
  badge:   RADIUS_SCALE.full,
} as const;

// カラーパレット — トークンから取得（API 形状は維持）
export const COLORS = {
  // Base Colors
  white: primitiveColors.gray.white,
  gray: {
    50: primitiveColors.gray[50],
    100: primitiveColors.gray[100],
    200: primitiveColors.gray[200],
    300: primitiveColors.gray[300],
    400: primitiveColors.gray[400],
    500: primitiveColors.gray[500],
    600: primitiveColors.gray[600],
    700: primitiveColors.gray[700],
    800: primitiveColors.gray[800],
    900: primitiveColors.gray[900],
  },

  // Accent — Mondrian 3色 + 黒
  accent: {
    primary: mondrian.black,
    red:     mondrian.red,
    blue:    mondrian.blue,
    yellow:  mondrian.yellow,
  },

  // Semantic Colors (Minimal)
  background: mondrian.canvas,
  surface:    primitiveColors.gray.white,
  text: {
    primary:   mondrian.black,
    secondary: primitiveColors.gray[800],
    muted:     primitiveColors.gray[600],
  },

  // State Colors — Mondrian 3色に縮退（success は黒 + "OK"）
  error:   mondrian.red,
  danger:  mondrian.red,
  warning: mondrian.yellow,
  success: mondrian.black,
  info:    mondrian.blue,
} as const;

type StatusTone = {
  text: string
  background: string
  border: string
  solid: string
}

/**
 * STATUS_TONES — De Stijl 配色
 * 背景塗りは最小（ドット/ラベルだけで意味を伝える設計）
 * success は黒 + "OK"。緑は De Stijl にないため排除
 */
export const STATUS_TONES: Record<'success' | 'warning' | 'info' | 'error', StatusTone> = {
  success: {
    text:       mondrian.black,
    background: alpha(mondrian.black, 0.04),
    border:     mondrian.black,
    solid:      mondrian.black
  },
  warning: {
    text:       mondrian.black,
    background: alpha(mondrian.yellow, 0.18),
    border:     mondrian.yellow,
    solid:      mondrian.yellow
  },
  info: {
    text:       mondrian.blue,
    background: alpha(mondrian.blue, 0.08),
    border:     mondrian.blue,
    solid:      mondrian.blue
  },
  error: {
    text:       mondrian.red,
    background: alpha(mondrian.red, 0.10),
    border:     mondrian.red,
    solid:      mondrian.red
  }
} as const

// Unified shadow system (single shadow variant)
export const SHADOW = `0 1px 3px 0 ${alpha(primitiveColors.gray.black, 0.1)}, 0 1px 2px -1px ${alpha(primitiveColors.gray.black, 0.1)}` as const;

// Utility functions
/** Mondrian 配色: priority 1-2 = 赤, 3 = 黄, 4-5 = ミュート灰 */
export const getPriorityColor = (priority: number) => {
  if (priority <= 2) return mondrian.red;
  if (priority <= 3) return mondrian.yellow;
  return COLORS.gray[500];
};

/**
 * @deprecated CategoryBadge は category.color を使わずグレー2階調で描画する。
 * 互換目的のシムとして残置（将来削除）。
 */
export const getCategoryBadgeStyle = (_categoryColor?: string) => ({
  backgroundColor: COLORS.gray[200],
  color: COLORS.text.primary,
});

/**
 * @deprecated colorHelpers.ts に同名関数あり。新コードはそちらを使用。
 * 互換のため値を返すが、Mondrian 配色では grayscale を返す。
 */
export const generateItemColor = (_baseColor: string, index: number, total: number) => {
  const lightness = 30 + (index / Math.max(1, total)) * 40; // 30% → 70%
  return `hsl(0, 0%, ${Math.round(lightness)}%)`;
};

// Chart palette — グレー濃淡 + Mondrian アクセント
export const chartColors = {
  primary:    COLORS.gray[800],
  secondary:  COLORS.gray[600],
  accent:     COLORS.gray[400],
  background: mondrian.canvas,
  text:       COLORS.text.primary,
};

/**
 * チャートのカテゴリ別グレースケールパレット (循環使用)
 * 濃 → 中 → 薄 を循環。インデックス順に視覚的に判別しやすい順序
 */
export const CHART_GRAYSCALE = [
  COLORS.gray[800],
  COLORS.gray[500],
  COLORS.gray[300],
  COLORS.gray[700],
  COLORS.gray[400],
  COLORS.gray[600],
] as const;

/** カテゴリ index → グレー階調 (6 階調を循環) */
export const getChartGrayShade = (index: number): string =>
  CHART_GRAYSCALE[index % CHART_GRAYSCALE.length];

/** カテゴリ name → グレー2階調 (CategoryBadge の偶奇背景用) */
export const getCategoryBadgeShade = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(hash) % 2 === 0 ? COLORS.gray[200] : COLORS.gray[300];
};
