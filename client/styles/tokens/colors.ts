/**
 * Design Tokens - Colors (Japanese palette / Zen garden oriented)
 * カラートークンの定義（Single Source of Truth）
 *
 * 使用色ファミリー: gray, red, blue, orange のみ
 */

import type { PrimitiveColors, SemanticColors, ThemeColors } from './types';

import { gray, lightBlue, orange, purple, green, red, blue, blueGray } from './primitives';

/**
 * Alpha helper - 色に透明度を追加 (#RRGGBB -> #RRGGBBAA)
 */
export const alpha = (color: string, opacity: number): string => {
  const o = Math.max(0, Math.min(1, opacity));
  if (color.startsWith('#') && color.length === 7) {
    const hex = Math.round(o * 255).toString(16).padStart(2, '0');
    return `${color}${hex}`;
  }
  return color;
};

/**
 * Primitive Colors（8色ファミリー）
 * ※ UI で使用するのは gray, red, blue, orange のみ。
 *   残りはチャート・カテゴリバッジ等のデータ可視化用に保持。
 */
export const primitiveColors: PrimitiveColors = {
  gray: {
    white: gray.white,
    50: gray[50],
    100: gray[100],
    200: gray[200],
    300: gray[300],
    400: gray[400],
    500: gray[500],
    600: gray[600],
    700: gray[700],
    800: gray[800],
    900: gray[900],
    black: gray.black,
  },
  lightBlue: { ...lightBlue },
  orange: { ...orange },
  purple: { ...purple },
  green: { ...green },
  red: { ...red },
  blue: { ...blue },
  blueGray: { ...blueGray },
};

/**
 * Semantic Colors
 * 用途に基づいたカラートークン
 *
 * 使用色ルール:
 * - モノクロ(gray) が主役
 * - 色は "意味" に限定: error=赤, warning=橙, info/success=藍, primary=藍
 */
export const semanticColors: SemanticColors = {
  // テキストカラー
  text: {
    title: gray.black,
    body: gray[900],
    sub: gray[600],
    white: gray.white,
    disable: gray[400],
    placeholder: gray[500],
    primary: blue[700],
    error: red[600],
    warning: orange[700],
    success: blue[600],
    info: blue[600],
  },

  // Error (朱)
  error: {
    main: red[500],
    background: alpha(red[500], 0.06),
    hover: alpha(red[500], 0.04),
    outlinedBorder: red[500],
    dark: red[600],
    focusVisible: red[500],
  },

  // Warning (山吹)
  warning: {
    main: orange[500],
    background: alpha(orange[500], 0.08),
    hover: alpha(orange[500], 0.04),
    outlinedBorder: orange[500],
    focusVisible: orange[500],
  },

  // Info (藍)
  info: {
    main: blue[500],
    background: alpha(blue[500], 0.08),
    hover: alpha(blue[500], 0.04),
    outlinedBorder: blue[500],
    pressed: blue[700],
    focus: alpha(blue[500], 0.12),
    focusVisible: blue[500],
  },

  // Success (藍 — green 廃止のため blue で代替)
  success: {
    main: blue[500],
    background: alpha(blue[500], 0.08),
    hover: alpha(blue[500], 0.04),
    outlinedBorder: blue[500],
    focusVisible: blue[500],
  },

  // Primary (藍)
  primary: {
    main: blue[500],
    background: alpha(blue[500], 0.06),
    hover: alpha(blue[500], 0.04),
    focus: alpha(blue[500], 0.12),
    outlinedBorder: blue[400],
    dark: blue[700],
    selected: alpha(blue[500], 0.08),
    focusVisible: blue[500],
  },

  // Secondary (橙)
  secondary: {
    main: orange[500],
    outlinedBorder: orange[500],
    background: alpha(orange[500], 0.06),
  },

  // Tertiary (赤)
  tertiary: {
    main: red[500],
    outlinedBorder: red[500],
    background: alpha(red[500], 0.06),
  },

  // Quaternary (gray)
  quaternary: {
    main: gray[500],
    outlinedBorder: gray[500],
    background: alpha(gray[500], 0.06),
  },

  // 共通カラー
  common: {
    white: {
      main: gray.white,
      hover: gray[100],
      border: gray[200],
      focusVisible: gray.white,
      selected: gray[200],
    },
    black: {
      main: gray.black,
      tertiary: gray[600],
      border: gray[300],
      secondary: gray[900],
      hover: gray.black,
    },
    disable: {
      contents: gray[400],
      background: gray[100],
      focus: alpha(gray.black, 0.10),
      outlined: gray[300],
      hover: alpha(gray.black, 0.04),
    },
    background: {
      default: gray[50],
      paper0: gray[100],
      paper1: gray.white,
      paper2: gray[50],
      paper3: gray.white,
    },
  },

  // チャートグラデーション（垂直）
  chart: {
    primaryVertical: `linear-gradient(180deg, ${blue[400]} 0%, ${blue[300]} 100%)`,
    secondaryVertical: `linear-gradient(180deg, ${orange[400]} 0%, ${orange[300]} 100%)`,
    tertiaryVertical: `linear-gradient(180deg, ${red[400]} 0%, ${red[300]} 100%)`,
    quaternaryVertical: `linear-gradient(180deg, ${gray[400]} 0%, ${gray[300]} 100%)`,
    quinaryVertical: `linear-gradient(180deg, ${gray[600]} 0%, ${gray[500]} 100%)`,
    senaryVertical: `linear-gradient(180deg, ${gray[300]} 0%, ${gray[200]} 100%)`,
  },

  // プログレスグラデーション（水平）
  progress: {
    primaryHorizontal: `linear-gradient(90deg, ${blue[500]} 0%, ${blue[300]} 100%)`,
    secondaryHorizontal: `linear-gradient(90deg, ${orange[500]} 0%, ${orange[300]} 100%)`,
    tertiaryHorizontal: `linear-gradient(90deg, ${red[500]} 0%, ${red[300]} 100%)`,
    lightSecondary: `linear-gradient(90deg, ${gray[500]} 0%, ${gray[300]} 100%)`,
    lightTertiary: `linear-gradient(90deg, ${gray[700]} 0%, ${gray[500]} 100%)`,
    lightPrimary: `linear-gradient(90deg, ${gray[700]} 0%, ${gray[300]} 100%)`,
  },

  // 共進化グラデーション
  evolution: {
    coEvolutionVertical: `linear-gradient(180deg, ${blue[300]} 0%, ${orange[300]} 100%)`,
    coEvolutionHorizontal: `linear-gradient(90deg, ${blue[300]} 0%, ${orange[300]} 100%)`,
  },
};

/**
 * Complete Color Tokens Export
 */
export const colors = {
  primitive: primitiveColors,
  semantic: semanticColors,
};

/**
 * UI Theme Tokens
 * CSS変数へ投影する色定義（light/dark）
 * フラット+影デザイン
 */
export const theme: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    page: {
      bg: gray[50],
    },
    surface: {
      border: 'transparent',
    },
    shadow: {
      sm: `0 1px 2px ${alpha(gray.black, 0.05)}`,
      md: `0 1px 3px ${alpha(gray.black, 0.1)}, 0 1px 2px -1px ${alpha(gray.black, 0.1)}`,
      lg: `0 4px 6px -1px ${alpha(gray.black, 0.1)}, 0 2px 4px -2px ${alpha(gray.black, 0.1)}`,
    },
    surfaceLevel: {
      0: gray.white,
      1: gray[50],
      2: gray[100],
    },
    ink: {
      primary: gray[900],
      secondary: gray[700],
      muted: gray[500],
      inverse: gray.white,
      icon: gray[700],
      iconMuted: gray[500],
    },
    stroke: {
      subtle: alpha(gray[300], 0.48),
      default: alpha(gray[400], 0.7),
      strong: gray[500],
      divider: alpha(gray[300], 0.62),
    },
    focus: {
      ring: blue[600],
      ringOffset: gray.white,
    },
    overlay: {
      hover: alpha(gray[900], 0.04),
      active: alpha(gray[900], 0.08),
      scrim: alpha(gray.black, 0.46),
    },
    state: {
      success: {
        fg: blue[700],
        bg: alpha(blue[500], 0.12),
        border: alpha(blue[600], 0.45),
      },
      warning: {
        fg: orange[700],
        bg: alpha(orange[500], 0.14),
        border: alpha(orange[600], 0.5),
      },
      danger: {
        fg: red[700],
        bg: alpha(red[500], 0.12),
        border: alpha(red[600], 0.45),
      },
      info: {
        fg: blue[700],
        bg: alpha(blue[500], 0.12),
        border: alpha(blue[600], 0.45),
      },
    },
    text: {
      tableHead: gray[600],
      tableMain: gray[900],
      tableSub: gray[500],
      tableNum: gray[800],
      tableMicro: gray[500],
    },
  },
  dark: {
    page: {
      bg: gray[900],
    },
    surface: {
      border: 'transparent',
    },
    shadow: {
      sm: `0 1px 2px ${alpha(gray.black, 0.15)}`,
      md: `0 1px 3px ${alpha(gray.black, 0.25)}, 0 1px 2px -1px ${alpha(gray.black, 0.15)}`,
      lg: `0 4px 6px -1px ${alpha(gray.black, 0.25)}, 0 2px 4px -2px ${alpha(gray.black, 0.15)}`,
    },
    surfaceLevel: {
      0: gray[800],
      1: gray[900],
      2: gray.black,
    },
    ink: {
      primary: gray[50],
      secondary: gray[200],
      muted: gray[400],
      inverse: gray[900],
      icon: gray[200],
      iconMuted: gray[400],
    },
    stroke: {
      subtle: alpha(gray[500], 0.34),
      default: alpha(gray[400], 0.52),
      strong: gray[300],
      divider: alpha(gray[400], 0.42),
    },
    focus: {
      ring: blue[400],
      ringOffset: gray[900],
    },
    overlay: {
      hover: alpha(gray.white, 0.06),
      active: alpha(gray.white, 0.12),
      scrim: alpha(gray.black, 0.62),
    },
    state: {
      success: {
        fg: blue[300],
        bg: alpha(blue[500], 0.2),
        border: alpha(blue[300], 0.5),
      },
      warning: {
        fg: orange[300],
        bg: alpha(orange[500], 0.2),
        border: alpha(orange[300], 0.52),
      },
      danger: {
        fg: red[300],
        bg: alpha(red[500], 0.2),
        border: alpha(red[300], 0.5),
      },
      info: {
        fg: blue[300],
        bg: alpha(blue[500], 0.2),
        border: alpha(blue[300], 0.5),
      },
    },
    text: {
      tableHead: gray[300],
      tableMain: gray[50],
      tableSub: gray[400],
      tableNum: gray[100],
      tableMicro: gray[400],
    },
  },
};

const toThemeCssVariables = (tokens: ThemeColors): Record<string, string> => ({
  '--page-bg': tokens.page.bg,
  '--surface-border': tokens.surface.border,
  '--shadow-sm': tokens.shadow.sm,
  '--shadow-md': tokens.shadow.md,
  '--shadow-lg': tokens.shadow.lg,
  '--surface-level-0': tokens.surfaceLevel[0],
  '--surface-level-1': tokens.surfaceLevel[1],
  '--surface-level-2': tokens.surfaceLevel[2],
  '--ink-primary': tokens.ink.primary,
  '--ink-secondary': tokens.ink.secondary,
  '--ink-muted': tokens.ink.muted,
  '--ink-inverse': tokens.ink.inverse,
  '--icon-default': tokens.ink.icon,
  '--icon-muted': tokens.ink.iconMuted,
  '--stroke-subtle': tokens.stroke.subtle,
  '--stroke-default': tokens.stroke.default,
  '--stroke-strong': tokens.stroke.strong,
  '--stroke-divider': tokens.stroke.divider,
  '--focus-ring': tokens.focus.ring,
  '--focus-ring-offset': tokens.focus.ringOffset,
  '--overlay-hover': tokens.overlay.hover,
  '--overlay-active': tokens.overlay.active,
  '--overlay-scrim': tokens.overlay.scrim,
  '--state-success-fg': tokens.state.success.fg,
  '--state-success-bg': tokens.state.success.bg,
  '--state-success-border': tokens.state.success.border,
  '--state-warning-fg': tokens.state.warning.fg,
  '--state-warning-bg': tokens.state.warning.bg,
  '--state-warning-border': tokens.state.warning.border,
  '--state-danger-fg': tokens.state.danger.fg,
  '--state-danger-bg': tokens.state.danger.bg,
  '--state-danger-border': tokens.state.danger.border,
  '--state-info-fg': tokens.state.info.fg,
  '--state-info-bg': tokens.state.info.bg,
  '--state-info-border': tokens.state.info.border,
  '--text-table-head': tokens.text.tableHead,
  '--text-table-main': tokens.text.tableMain,
  '--text-table-sub': tokens.text.tableSub,
  '--text-table-num': tokens.text.tableNum,
  '--text-table-micro': tokens.text.tableMicro,
});

export const themeCssVariables = {
  light: toThemeCssVariables(theme.light),
  dark: toThemeCssVariables(theme.dark),
};
