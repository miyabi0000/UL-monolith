/**
 * Unified Design System
 * Consolidates colors, styles, and utilities into a single source of truth
 */

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

// Minimal Typography (3 sizes only)
export const FONT_SCALE = {
  sm: 12,   // Small text (captions, labels)
  base: 14, // Base text (body, inputs)
  lg: 18,   // Large text (headings)
} as const;

// 行間（フォントサイズ × 白銀比）
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

// Minimal color palette - White base with monochrome
export const COLORS = {
  // Base Colors (Monochrome)
  white: '#FFFFFF',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Accent for interactive elements only
  accent: {
    primary: '#404040',   // Gray for links and primary actions (gray.700)
    red: '#EF4444',       // For errors and delete actions
  },

  // Semantic Colors (Minimal)
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: {
    primary: '#171717',
    secondary: '#525252',
    muted: '#A3A3A3',
  },

  // State Colors
  error: '#EF4444',
} as const;

// Unified shadow system (single shadow variant)
export const SHADOW = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)' as const;

// Utility functions
export const getPriorityColor = (priority: number) => {
  if (priority <= 2) return COLORS.accent.red; // High priority: Red
  if (priority <= 3) return '#F59E0B'; // Medium priority: Yellow
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

// Chart.js color palette (grayscale)
export const chartColors = {
  primary: COLORS.gray[700],
  secondary: COLORS.gray[500],
  accent: COLORS.gray[400],
  background: COLORS.gray[50],
  text: COLORS.text.primary,
};
