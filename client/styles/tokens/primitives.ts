/**
 * Runtime Primitive Tokens (ESM)
 * ブラウザ実行時はこちらを参照し、Tailwind側は primitives.cjs を参照する
 */

const SUMI_BLACK = '#1B1D1B';

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
  50: '#F7F6F3',
  100: '#EEEDEA',
  200: '#E0DFDD',
  300: '#CAC9C7',
  400: '#AFAFAC',
  500: '#949492',
  600: '#797A77',
  700: '#5E5F5D',
  800: '#434543',
  900: '#2D2F2D',
  black: SUMI_BLACK,
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

export const orange = {
  50: '#FFF9ED',
  100: '#FFF3DB',
  200: '#FFE6B6',
  300: '#FFD688',
  400: '#FFC75B',
  500: '#FFB11B',
  600: '#DD9B1A',
  700: '#BC8418',
  800: '#956B17',
  900: '#6E5115',
  950: '#4D3B14',
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

export const red = {
  50: '#FDEBED',
  100: '#FAD7DB',
  200: '#F6AFB6',
  300: '#F07C88',
  400: '#EA4A5B',
  500: '#E2041B',
  600: '#C4061A',
  700: '#A70818',
  800: '#850A17',
  900: '#630C15',
  950: '#450E14',
} as const;

export const blue = {
  50: '#EEF1F4',
  100: '#DCE2E9',
  200: '#BAC5D4',
  300: '#8FA1B9',
  400: '#637D9E',
  500: '#274A78',
  600: '#24426A',
  700: '#203A5B',
  800: '#1B314D',
  900: '#15273F',
  950: '#101E30',
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

