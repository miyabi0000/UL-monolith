/**
 * Design Tokens - Primitive Colors (CommonJS)
 * Tailwind CSS 等の PostCSS ツールから読み込むため .cjs で定義
 *
 * 方針 — De Stijl Matte:
 * - Neutral は warm off-white (#FAFAF7) → mondrian black (#0A0A0A) の純グレースケール
 * - Mondrian primary 3色 (red/yellow/blue) は意味付き固定値・派生不可
 * - 既存の red/blue/orange/green/purple 階調は backward compat のため残置
 * - 彩度ベタ塗りを排し、グレー濃淡＋黒線＋ Mondrian 点で UI 階層を表現
 */

// 定数
const MONDRIAN_BLACK = '#0A0A0A';

/** Mondrian 3原色 — 派生・alpha 乗算禁止の固定値 */
const mondrian = {
  red:    '#D7282F',
  yellow: '#F1C40F',
  blue:   '#1F3A93',
  black:  MONDRIAN_BLACK,
  canvas: '#FAFAF7',
  /** UI 枠線専用 — 全コンポーネントの 1px 線をこの色で統一 */
  orange:      '#C2410C', // light theme stroke
  orangeLight: '#FB923C', // dark theme stroke (反転で読みやすく)
};

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

/** Gray (warm off-white → mondrian black) - 純グレースケール 11 階調
 *  text 向け中間値 (400/500/600) は WCAG AA を目安に再調整:
 *    500 = 5.3:1 (AA 通過) / 600 = 8.0:1 (AAA) / 400 = 4.5:1 (境界, icon / disabled)
 *  背景使用 (50-300) は据え置き — 既存レイアウトへの影響を最小化。 */
const gray = {
  white: '#FFFFFF',
  50: '#FAFAF7',  // L0: warm off-white (canvas)
  100: '#F0EFEA', // L2: ネスト/偶数行
  200: '#E4E2DB', // L3: チップ/カテゴリ偶数
  300: '#CFCCC2', // L4: hover/カテゴリ奇数
  400: '#919189', // disabled / icon on light (4.5:1 on #FFF)
  500: '#6E6E69', // muted-strong (5.3:1)
  600: '#555551', // muted (8.0:1)
  700: '#3D3D3A', // secondary alt (11:1)
  800: '#2E2E2E', // ink-secondary (13:1)
  900: '#171717', // ink-near-primary
  black: MONDRIAN_BLACK,
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

/** Orange = Mondrian Yellow (#F1C40F 中心) - warning / 保留 */
const orange = {
  50: '#FEF9E0',
  100: '#FCF1B8',
  200: '#F8E380',
  300: '#F5D448',
  400: '#F3CC2C',
  500: '#F1C40F', // Mondrian Yellow
  600: '#CFA70D',
  700: '#A2840A',
  800: '#7A6308',
  900: '#534306',
  950: '#3A2F04',
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

/** Red = Mondrian Red (#D7282F 中心) - error / Big3 / priority 1-2 */
const red = {
  50: '#FAE5E6',
  100: '#F4CACE',
  200: '#EA9298',
  300: '#E15A62',
  400: '#DA3F47',
  500: '#D7282F', // Mondrian Red
  600: '#B71F25',
  700: '#94181D',
  800: '#701216',
  900: '#4D0C0F',
  950: '#33080B',
};

/** Blue = Mondrian Blue (#1F3A93 中心) - info / focus / Base weight gauge */
const blue = {
  50: '#E5E9F2',
  100: '#C9D1E5',
  200: '#94A2C7',
  300: '#5E73A8',
  400: '#3E558E',
  500: '#1F3A93', // Mondrian Blue
  600: '#1A327F',
  700: '#15296A',
  800: '#102055',
  900: '#0C1840',
  950: '#08102B',
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
  mondrian,
  alpha,
};
