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

// タイポグラフィスケール（白銀比ベース）
export const FONT_SCALE = {
  xs: 12,   // ベース
  sm: 17,   // 12 × 1.414
  base: 24, // 17 × 1.414
  lg: 34,   // 24 × 1.414
  xl: 48,   // 34 × 1.414
  '2xl': 68, // 48 × 1.414
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

// Base color palette
export const COLORS = {
  // Primary Colors
  primary: {
    light: '#F7FCFC',    // 最も薄い青白
    medium: '#A0D1D6',   // 中間の青緑
    dark: '#274345',     // 濃い青緑（メインカラー）
  },

  // Base Colors
  white: '#FFFFFF',      // 純白
  accent: '#F23A24',     // アクセント赤

  // Semantic Colors (派生色)
  background: '#F7FCFC',
  surface: '#FFFFFF',
  border: '#A0D1D6',
  text: {
    primary: '#274345',
    secondary: '#274345',
    muted: '#A0D1D6',
  },

  // State Colors
  success: '#A0D1D6',
  warning: '#F23A24',
  error: '#F23A24',
  info: '#A0D1D6',
} as const;

// Glass effect system
export const glassEffects = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px) saturate(180%) brightness(1.15)',
    WebkitBackdropFilter: 'blur(16px) saturate(180%) brightness(1.15)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: `
      0 4px 24px rgba(31, 38, 135, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.08)
    `,
    backgroundClip: 'padding-box' as const,
  },
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(12px) saturate(200%) brightness(1.2)',
    WebkitBackdropFilter: 'blur(12px) saturate(200%) brightness(1.2)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: `
      0 8px 32px rgba(31, 38, 135, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.1)
    `,
    backgroundClip: 'padding-box' as const,
  },
  heavy: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(16px) saturate(220%) brightness(1.25)',
    WebkitBackdropFilter: 'blur(16px) saturate(220%) brightness(1.25)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: `
      0 12px 48px rgba(31, 38, 135, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.15)
    `,
    backgroundClip: 'padding-box' as const,
  },
};

// Button variants
export const buttonVariants = {
  primary: {
    backgroundColor: COLORS.primary.dark,
    color: COLORS.white,
    border: `1px solid ${COLORS.primary.dark}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: COLORS.primary.medium,
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  },
  secondary: {
    backgroundColor: COLORS.white,
    color: COLORS.primary.dark,
    border: `1px solid ${COLORS.primary.medium}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: COLORS.primary.light,
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
  },
  glass: glassEffects.medium,
  danger: {
    backgroundColor: COLORS.accent,
    color: COLORS.white,
    border: `1px solid ${COLORS.accent}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: '#D12D1A',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(209, 45, 26, 0.3)',
    },
  },
};

// Input variants
export const inputVariants = {
  default: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary.medium,
    color: COLORS.text.primary,
    border: `1px solid ${COLORS.primary.medium}`,
  },
  focus: {
    borderColor: COLORS.primary.dark,
    outline: `2px solid ${COLORS.primary.light}`,
  },
  error: {
    borderColor: COLORS.accent,
    backgroundColor: '#FEF2F2',
  },
};

// Card variants
export const cardVariants = {
  default: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    border: `1px solid rgba(255, 255, 255, 0.3)`,
    backdropFilter: 'blur(10px) saturate(180%) brightness(1.15)',
    WebkitBackdropFilter: 'blur(10px) saturate(180%) brightness(1.15)',
    boxShadow: '0 4px 16px rgba(31, 38, 135, 0.08)',
  },
  selected: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(12px) saturate(200%) brightness(1.2)',
    WebkitBackdropFilter: 'blur(12px) saturate(200%) brightness(1.2)',
  },
  hover: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(12px) saturate(190%) brightness(1.18)',
    WebkitBackdropFilter: 'blur(12px) saturate(190%) brightness(1.18)',
  },
  square: glassEffects.light,
};

// Table variants
export const tableVariants = {
  header: {
    backgroundColor: COLORS.primary.light,
    color: COLORS.text.secondary,
    borderBottomColor: COLORS.primary.medium,
  },
  row: {
    default: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    selected: {
      backgroundColor: 'rgba(255, 255, 255, 0.35)',
      backdropFilter: 'blur(8px) saturate(180%) brightness(1.15)',
      WebkitBackdropFilter: 'blur(8px) saturate(180%) brightness(1.15)',
    },
    hover: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(6px) saturate(160%) brightness(1.1)',
      WebkitBackdropFilter: 'blur(6px) saturate(160%) brightness(1.1)',
    },
  },
};

// Message variants
export const messageVariants = {
  success: {
    backgroundColor: COLORS.primary.light,
    borderColor: COLORS.primary.medium,
    color: COLORS.primary.dark,
    border: `1px solid ${COLORS.primary.medium}`,
  },
  error: {
    backgroundColor: '#FEF2F2',
    borderColor: COLORS.accent,
    color: COLORS.accent,
    border: `1px solid ${COLORS.accent}`,
  },
  info: {
    backgroundColor: COLORS.primary.light,
    borderColor: COLORS.primary.medium,
    color: COLORS.primary.dark,
    border: `1px solid ${COLORS.primary.medium}`,
  },
  loading: {
    backgroundColor: COLORS.primary.light,
    borderColor: COLORS.primary.medium,
    color: COLORS.primary.dark,
    border: `1px solid ${COLORS.primary.medium}`,
  },
};

// Dropdown variants
export const dropdownVariants = {
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(12px) saturate(180%) brightness(1.15)',
    WebkitBackdropFilter: 'blur(12px) saturate(180%) brightness(1.15)',
    border: `1px solid rgba(255, 255, 255, 0.3)`,
    borderRadius: '0.375rem',
    boxShadow: '0 10px 25px -5px rgba(31, 38, 135, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
  item: {
    default: {
      color: COLORS.text.primary,
      backgroundColor: 'transparent',
    },
    hover: {
      backgroundColor: COLORS.primary.light,
    },
  },
};

// Utility functions
export const getPriorityColor = (priority: number) => {
  if (priority <= 2) return COLORS.accent; // 高優先度: 赤
  if (priority <= 3) return '#F59E0B'; // 中優先度: 黄色
  return COLORS.primary.medium; // 低優先度: 青緑
};

export const getCategoryBadgeStyle = (categoryColor?: string) => {
  const baseColor = categoryColor || COLORS.primary.medium;
  return {
    backgroundColor: `${baseColor}20`, // 20% opacity
    color: baseColor,
    border: `1px solid ${baseColor}40`, // 40% opacity border
  };
};

export const getTruncatedTextStyle = (maxWidth: string = '200px') => ({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
  maxWidth,
  display: 'inline-block',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
});

export const getExpandedTextStyle = () => ({
  whiteSpace: 'normal' as const,
  wordBreak: 'break-word' as const,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(12px) saturate(180%) brightness(1.1)',
  WebkitBackdropFilter: 'blur(12px) saturate(180%) brightness(1.1)',
  padding: '8px 12px',
  borderRadius: '6px',
  boxShadow: '0 4px 20px rgba(31, 38, 135, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  position: 'absolute' as const,
  zIndex: 1000,
  minWidth: '200px',
  maxWidth: '400px',
});

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

// Chart.js用カラーパレット
export const chartColors = {
  primary: COLORS.primary.dark,
  secondary: COLORS.primary.medium,
  accent: COLORS.accent,
  background: COLORS.primary.light,
  text: COLORS.text.primary,
};

// Type-safe style getters
export type GlassVariant = keyof typeof glassEffects;
export type ButtonVariant = keyof typeof buttonVariants;
export type InputVariant = keyof typeof inputVariants;
export type CardVariant = keyof typeof cardVariants;
export type MessageVariant = keyof typeof messageVariants;

export const getGlassStyle = (variant: GlassVariant = 'medium') => glassEffects[variant];
export const getButtonStyle = (variant: ButtonVariant = 'primary') => buttonVariants[variant];
export const getInputStyle = (variant: InputVariant = 'default') => inputVariants[variant];
export const getCardStyle = (variant: CardVariant = 'default') => cardVariants[variant];
export const getMessageStyle = (variant: MessageVariant = 'info') => messageVariants[variant];
export const getTableHeaderStyle = () => tableVariants.header;
export const getTableRowStyle = (selected = false, hover = false) => {
  if (selected) return tableVariants.row.selected;
  if (hover) return tableVariants.row.hover;
  return tableVariants.row.default;
};
export const getDropdownStyle = () => dropdownVariants.container;
export const getDropdownItemStyle = (hover = false) =>
  hover ? dropdownVariants.item.hover : dropdownVariants.item.default;

// Legacy compatibility exports
export const getSquareSeparatorStyle = () => getCardStyle('square');
export const getLiquidGlassStyle = (variant: 'default' | 'hover' | 'active' | 'focus' = 'default') => {
  switch (variant) {
    case 'hover':
      return { ...getGlassStyle('heavy'), transform: 'translateY(-2px)' };
    case 'active':
      return { ...getGlassStyle('light'), transform: 'translateY(1px)' };
    case 'focus':
      return { ...getGlassStyle('medium'), border: `1px solid ${COLORS.primary.medium}` };
    default:
      return getGlassStyle('medium');
  }
};