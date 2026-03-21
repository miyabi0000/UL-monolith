/**
 * Design Tokens - Primitive Colors (CommonJS)
 * Tailwind CSS 等の PostCSS ツールから読み込むため .cjs で定義
 *
 * 方針:
 * - Neutral は「胡粉(明) → 墨(暗)」の温ニュートラル
 * - Accents は日本の伝統色から UI 用の階調(50-950)を展開
 * - "石庭"の空気: ベタ塗りを減らし、border/alpha/余白でコントラストを作る
 */

// 定数
const SUMI_BLACK = '#1B1D1B'; // 墨

/**
 * Alpha helper - 色に透明度を追加 (#RRGGBB -> #RRGGBBAA)
 */
const alpha = (color, opacity) => {
  const o = Math.max(0, Math.min(1, opacity));
  if (color.startsWith('#') && color.length === 7) {
    const hex = Math.round(o * 255).toString(16).padStart(2, '0');
    return `${color}${hex}`;
  }
  return color;
};

/** Gray (胡粉→墨) - 砂/和紙/石のニュートラル */
const gray = {
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
};

/** lightBlue (浅葱 / Asagi) - 透明感のある青緑 */
const lightBlue = {
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
};

/** Orange (山吹 / Yamabuki) - 金/土の温度 */
const orange = {
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
};

/** Purple (紫 / Murasaki) */
const purple = {
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
};

/** Green (萌黄 / Moegi) - 苔のアクセント */
const green = {
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
};

/** Red (朱 / Shu) - 意味色(エラー/危険) */
const red = {
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
};

/** Blue (藍 / Ai) - 紺寄り */
const blue = {
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
};

/** BlueGray (藍鼠 / Ainezumi) - 影/境界/サブ背景の"空気" */
const blueGray = {
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
};

module.exports = {
  gray,
  lightBlue,
  orange,
  purple,
  green,
  red,
  blue,
  blueGray,
  alpha,
};
