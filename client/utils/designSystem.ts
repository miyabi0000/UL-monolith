/**
 * Unified Design System
 * Consolidates colors, styles, and utilities into a single source of truth
 *
 * 色値は client/styles/tokens/ のトークンから取得（互換シム）
 * スケール値（白銀比）は現在の値を維持
 */

import { primitiveColors, alpha } from '../styles/tokens';

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

  // Accent for interactive elements only
  accent: {
    primary: primitiveColors.gray[700],
    red: primitiveColors.red[500],
  },

  // Semantic Colors (Minimal)
  background: primitiveColors.gray[50],
  surface: primitiveColors.gray.white,
  text: {
    primary: primitiveColors.gray.black,
    secondary: primitiveColors.gray[600],
    muted: primitiveColors.gray[400],
  },

  // State Colors
  error: primitiveColors.red[500],
  danger: primitiveColors.red[500],
  warning: primitiveColors.orange[500],
  success: primitiveColors.green[500],
} as const;

type StatusTone = {
  text: string
  background: string
  border: string
  solid: string
}

export const STATUS_TONES: Record<'success' | 'warning' | 'info' | 'error', StatusTone> = {
  success: {
    text: primitiveColors.green[700],
    background: alpha(primitiveColors.green[500], 0.08),
    border: alpha(primitiveColors.green[500], 0.28),
    solid: primitiveColors.green[500]
  },
  warning: {
    text: primitiveColors.orange[700],
    background: alpha(primitiveColors.orange[500], 0.08),
    border: alpha(primitiveColors.orange[500], 0.28),
    solid: primitiveColors.orange[500]
  },
  info: {
    text: primitiveColors.blue[700],
    background: alpha(primitiveColors.blue[500], 0.08),
    border: alpha(primitiveColors.blue[500], 0.28),
    solid: primitiveColors.blue[500]
  },
  error: {
    text: primitiveColors.red[700],
    background: alpha(primitiveColors.red[500], 0.08),
    border: alpha(primitiveColors.red[500], 0.28),
    solid: primitiveColors.red[500]
  }
} as const

// Unified shadow system (single shadow variant)
export const SHADOW = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)' as const;

// Utility functions
export const getPriorityColor = (priority: number) => {
  if (priority <= 2) return COLORS.accent.red; // High priority: Red
  if (priority <= 3) return COLORS.warning; // Medium priority: Yellow
  return COLORS.gray[400]; // Low priority: Gray
};

export const getCategoryBadgeStyle = (categoryColor?: string) => {
  const baseColor = categoryColor || COLORS.gray[400];
  return {
    backgroundColor: `${baseColor}20`, // 20% opacity
    color: baseColor,
  };
};

// Color generation utility (extracted from GearChart)
export const generateItemColor = (baseColor: string, index: number, total: number) => {
  // HEXからRGBに変換
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // RGBからHSLに変換
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const diff = max - min;

  let h = 0;
  if (diff !== 0) {
    if (max === rNorm) h = ((gNorm - bNorm) / diff) % 6;
    else if (max === gNorm) h = (bNorm - rNorm) / diff + 2;
    else h = (rNorm - gNorm) / diff + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const l = (max + min) / 2;
  const s = diff === 0 ? 0 : diff / (1 - Math.abs(2 * l - 1));

  // 時計回りに彩度を落とす
  const progress = index / total; // 0から1の進行度
  const newSaturation = Math.max(0.3, Math.min(0.9, s * (1 - progress * 0.7))); // 彩度を徐々に下げる
  const newLightness = Math.max(0.4, Math.min(0.7, l + progress * 0.2)); // 明度を徐々に上げる

  return `hsl(${h}, ${Math.round(newSaturation * 100)}%, ${Math.round(newLightness * 100)}%)`;
};

// Chart.js color palette
export const chartColors = {
  primary: COLORS.gray[700],
  secondary: COLORS.gray[500],
  accent: COLORS.gray[400],
  background: COLORS.gray[50],
  text: COLORS.text.primary,
};
