/**
 * Design Tokens - Colors (Japanese palette / Zen garden oriented)
 * カラートークンの定義（Single Source of Truth）
 */

import type { PrimitiveColors, SemanticColors } from './types';

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
 * Stone-garden rule:
 * - 通常は neutral(text/background/border) が主役
 * - 色は "意味" と "選択" に限定（primary=苔、error=朱 など）
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
    primary: green[700],
    error: red[600],
    warning: orange[700],
    success: green[700],
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

  // Success (萌黄)
  success: {
    main: green[500],
    background: alpha(green[500], 0.08),
    hover: alpha(green[500], 0.04),
    outlinedBorder: green[500],
    focusVisible: green[500],
  },

  // Primary (苔=萌黄) — 石庭の"苔"アクセント
  primary: {
    main: green[500],
    background: alpha(green[500], 0.06),
    hover: alpha(green[500], 0.04),
    focus: alpha(green[500], 0.12),
    outlinedBorder: green[400],
    dark: green[700],
    selected: alpha(green[500], 0.08),
    focusVisible: green[500],
  },

  // Secondary (藍)
  secondary: {
    main: blue[500],
    outlinedBorder: blue[500],
    background: alpha(blue[500], 0.06),
  },

  // Tertiary (山吹)
  tertiary: {
    main: orange[500],
    outlinedBorder: orange[500],
    background: alpha(orange[500], 0.06),
  },

  // Quaternary (紫)
  quaternary: {
    main: purple[500],
    outlinedBorder: purple[500],
    background: alpha(purple[500], 0.06),
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
    primaryVertical: `linear-gradient(180deg, ${green[400]} 0%, ${green[300]} 100%)`,
    secondaryVertical: `linear-gradient(180deg, ${blue[400]} 0%, ${blue[300]} 100%)`,
    tertiaryVertical: `linear-gradient(180deg, ${orange[400]} 0%, ${orange[300]} 100%)`,
    quaternaryVertical: `linear-gradient(180deg, ${purple[400]} 0%, ${purple[300]} 100%)`,
    quinaryVertical: `linear-gradient(180deg, ${red[400]} 0%, ${red[300]} 100%)`,
    senaryVertical: `linear-gradient(180deg, ${lightBlue[400]} 0%, ${lightBlue[300]} 100%)`,
  },

  // プログレスグラデーション（水平）
  progress: {
    primaryHorizontal: `linear-gradient(90deg, ${green[500]} 0%, ${green[300]} 100%)`,
    secondaryHorizontal: `linear-gradient(90deg, ${blue[500]} 0%, ${blue[300]} 100%)`,
    tertiaryHorizontal: `linear-gradient(90deg, ${orange[500]} 0%, ${orange[300]} 100%)`,
    lightSecondary: `linear-gradient(90deg, ${lightBlue[500]} 0%, ${lightBlue[300]} 100%)`,
    lightTertiary: `linear-gradient(90deg, ${purple[500]} 0%, ${purple[300]} 100%)`,
    lightPrimary: `linear-gradient(90deg, ${gray[700]} 0%, ${gray[300]} 100%)`,
  },

  // 共進化グラデーション
  evolution: {
    coEvolutionVertical: `linear-gradient(180deg, ${green[300]} 0%, ${blue[300]} 100%)`,
    coEvolutionHorizontal: `linear-gradient(90deg, ${green[300]} 0%, ${blue[300]} 100%)`,
  },
};

/**
 * Complete Color Tokens Export
 */
export const colors = {
  primitive: primitiveColors,
  semantic: semanticColors,
};
