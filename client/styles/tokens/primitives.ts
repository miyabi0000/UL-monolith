/**
 * Runtime Primitive Tokens (ESM)
 * ブラウザ実行時はこちらを参照し、Tailwind側は primitives.cjs を参照する
 *
 * 値は primitives.cjs と完全一致 (De Stijl Matte palette)
 */

const MONDRIAN_BLACK = '#0A0A0A';

/** Mondrian 3原色 — 派生・alpha 乗算禁止の固定値 */
export const mondrian = {
  red:    '#D7282F',
  yellow: '#F1C40F',
  blue:   '#1F3A93',
  black:  MONDRIAN_BLACK,
  canvas: '#FAFAF7',
  /** UI 枠線専用 — 全コンポーネントの 1px 線をこの色で統一 */
  orange:      '#C2410C', // light theme stroke
  orangeLight: '#FB923C', // dark theme stroke (反転で読みやすく)
} as const;

export const alpha = (color: string, opacity: number): string => {
  const o = Math.max(0, Math.min(1, opacity));
  if (color.startsWith('#') && color.length === 7) {
    const hex = Math.round(o * 255).toString(16).padStart(2, '0');
    return `${color}${hex}`;
  }
  return color;
};

export const gray = {
  white: '#FFFFFF',
  50:  '#FAFAF7',
  100: '#F0EFEA',
  200: '#E4E2DB',
  300: '#CFCCC2',
  400: '#ADADA8',
  500: '#888884',
  600: '#6B6B66',
  700: '#4A4A47',
  800: '#2E2E2E',
  900: '#171717',
  black: MONDRIAN_BLACK,
} as const;

export const lightBlue = {
  50: '#EBF8F9',
  100: '#D6F0F2',
  200: '#ADE2E5',
  300: '#7ACFD5',
  400: '#47BDC5',
  500: '#00A3AF',
  600: '#028F99',
  700: '#047A83',
  800: '#066369',
  900: '#084B50',
  950: '#0A373A',
} as const;

/** orange = Mondrian Yellow ramp */
export const orange = {
  50:  '#FEF9E0',
  100: '#FCF1B8',
  200: '#F8E380',
  300: '#F5D448',
  400: '#F3CC2C',
  500: '#F1C40F',
  600: '#CFA70D',
  700: '#A2840A',
  800: '#7A6308',
  900: '#534306',
  950: '#3A2F04',
} as const;

export const purple = {
  50: '#F5F2F9',
  100: '#EBE5F2',
  200: '#D1CAE2',
  300: '#B5A8CF',
  400: '#9887BD',
  500: '#7058A3',
  600: '#624E8F',
  700: '#55447A',
  800: '#453963',
  900: '#352D4B',
  950: '#272337',
} as const;

export const green = {
  50: '#F4F8F0',
  100: '#EAF0E0',
  200: '#D5E1C2',
  300: '#BACF9B',
  400: '#A0BC75',
  500: '#7BA23F',
  600: '#6C8E39',
  700: '#5C7932',
  800: '#4B622B',
  900: '#3A4B23',
  950: '#2A371D',
} as const;

/** red = Mondrian Red ramp */
export const red = {
  50:  '#FAE5E6',
  100: '#F4CACE',
  200: '#EA9298',
  300: '#E15A62',
  400: '#DA3F47',
  500: '#D7282F',
  600: '#B71F25',
  700: '#94181D',
  800: '#701216',
  900: '#4D0C0F',
  950: '#33080B',
} as const;

/** blue = Mondrian Blue ramp */
export const blue = {
  50:  '#E5E9F2',
  100: '#C9D1E5',
  200: '#94A2C7',
  300: '#5E73A8',
  400: '#3E558E',
  500: '#1F3A93',
  600: '#1A327F',
  700: '#15296A',
  800: '#102055',
  900: '#0C1840',
  950: '#08102B',
} as const;

export const blueGray = {
  50: '#F2F3F4',
  100: '#E5E7E9',
  200: '#CBD0D2',
  300: '#AAB2B6',
  400: '#89949A',
  500: '#5B6B73',
  600: '#505E65',
  700: '#455258',
  800: '#394348',
  900: '#2D3538',
  950: '#22282A',
} as const;

