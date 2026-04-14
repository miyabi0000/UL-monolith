/**
 * Design Tokens - Colors (Japanese palette / Zen garden oriented)
 * カラートークンの定義（Single Source of Truth）
 *
 * 使用色ファミリー: gray, red, blue, orange のみ
 */

import type { PrimitiveColors, SemanticColors, ThemeColors } from './types';

import { gray, lightBlue, orange, purple, green, red, blue, blueGray, mondrian } from './primitives';

export { mondrian };

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
      bg: mondrian.canvas, // flat warm off-white
    },
    surface: {
      border: mondrian.orange, // Mondrian Orange 1px 線で全枠線統一
    },
    // 影は最小限。マット質感のため強い shadow は禁止
    shadow: {
      sm: `0 1px 0 ${alpha(mondrian.black, 0.04)}`,
      md: `0 1px 0 ${alpha(mondrian.black, 0.06)}`,
      lg: `0 2px 0 ${alpha(mondrian.black, 0.08)}`,
    },
    surfaceLevel: {
      0: gray.white,        // L1: card / modal
      1: mondrian.canvas,   // L0: page / nest 薄
      2: gray[100],         // L2: テーブル偶数行 / nest 濃
    },
    ink: {
      primary:   mondrian.black,
      secondary: gray[800],
      muted:     gray[600],
      inverse:   mondrian.canvas,
      icon:      gray[800],
      iconMuted: gray[600],
    },
    stroke: {
      subtle:  alpha(mondrian.orange, 0.20),
      default: mondrian.orange, // Mondrian Orange — 全枠線統一
      strong:  mondrian.orange,
      divider: alpha(mondrian.orange, 0.28),
    },
    focus: {
      ring:       mondrian.blue,
      ringOffset: mondrian.canvas,
    },
    overlay: {
      hover:  alpha(mondrian.black, 0.04),
      active: alpha(mondrian.black, 0.08),
      scrim:  alpha(mondrian.black, 0.5),
    },
    state: {
      // 全 state も border は Mondrian Orange で統一。
      // 区別は背景 tint と前景色（fg）で表現する。
      success: {
        fg:     mondrian.black,
        bg:     alpha(mondrian.black, 0.04),
        border: mondrian.orange,
      },
      warning: {
        fg:     mondrian.black,
        bg:     alpha(mondrian.yellow, 0.20),
        border: mondrian.orange,
      },
      danger: {
        fg:     mondrian.red,
        bg:     alpha(mondrian.red, 0.10),
        border: mondrian.orange,
      },
      info: {
        fg:     mondrian.blue,
        bg:     alpha(mondrian.blue, 0.08),
        border: mondrian.orange,
      },
    },
    text: {
      tableHead:  gray[700],
      tableMain:  mondrian.black,
      tableSub:   gray[600],
      tableNum:   mondrian.black,
      tableMicro: gray[600],
    },
  },
  dark: {
    page: {
      bg: '#121212', // pure dark canvas
    },
    surface: {
      border: mondrian.orangeLight, // Mondrian Orange (Dark: 明るめ)
    },
    shadow: {
      sm: `0 1px 0 ${alpha(mondrian.black, 0.6)}`,
      md: `0 1px 0 ${alpha(mondrian.black, 0.7)}`,
      lg: `0 2px 0 ${alpha(mondrian.black, 0.8)}`,
    },
    surfaceLevel: {
      0: '#1C1C1C', // L1: card / modal
      1: '#121212', // L0: page bg
      2: '#242424', // L2: テーブル偶数行
    },
    ink: {
      primary:   mondrian.canvas,
      secondary: '#E0E0DC',
      muted:     '#9C9C98',
      inverse:   mondrian.black,
      icon:      '#E0E0DC',
      iconMuted: '#9C9C98',
    },
    stroke: {
      subtle:  alpha(mondrian.orangeLight, 0.25),
      default: mondrian.orangeLight, // Mondrian Orange (Dark)
      strong:  mondrian.orangeLight,
      divider: alpha(mondrian.orangeLight, 0.32),
    },
    focus: {
      ring:       '#5E73A8', // mondrian blue は dark で見えにくいので明るめ
      ringOffset: '#121212',
    },
    overlay: {
      hover:  alpha(mondrian.canvas, 0.06),
      active: alpha(mondrian.canvas, 0.12),
      scrim:  alpha(mondrian.black, 0.7),
    },
    state: {
      // 全 state border は Mondrian Orange (Dark: 明るめ) で統一
      success: {
        fg:     mondrian.canvas,
        bg:     alpha(mondrian.canvas, 0.06),
        border: mondrian.orangeLight,
      },
      warning: {
        fg:     mondrian.yellow,
        bg:     alpha(mondrian.yellow, 0.18),
        border: mondrian.orangeLight,
      },
      danger: {
        fg:     '#E15A62',
        bg:     alpha(mondrian.red, 0.18),
        border: mondrian.orangeLight,
      },
      info: {
        fg:     '#5E73A8',
        bg:     alpha(mondrian.blue, 0.20),
        border: mondrian.orangeLight,
      },
    },
    text: {
      tableHead:  '#CFCCC2',
      tableMain:  mondrian.canvas,
      tableSub:   '#9C9C98',
      tableNum:   mondrian.canvas,
      tableMicro: '#9C9C98',
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
