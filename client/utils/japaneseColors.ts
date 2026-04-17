export const JAPANESE_COLOR_PALETTE = [
  { name: 'Asagi', hex: '#00BCC9' },
  { name: 'Yamabuki', hex: '#FFAA00' },
  { name: 'Ai', hex: '#2E5FA1' },
  { name: 'Moegi', hex: '#6AB528' },
  { name: 'Shu', hex: '#F01030' },
  { name: 'Murasaki', hex: '#8255CC' },
  { name: 'Kikyo', hex: '#5F5DD6' },
  { name: 'Ainezumi', hex: '#5B7A8A' },
  { name: 'Sumi', hex: '#1B1D1B' },
  { name: 'Sakura', hex: '#FF9EAB' },
  { name: 'Kohaku', hex: '#E07030' },
  { name: 'Byakuroku', hex: '#44D4A0' }
] as const;

export const JAPANESE_COLOR_HEX_SET = new Set(
  JAPANESE_COLOR_PALETTE.map((color) => color.hex)
);

// カテゴリのデフォルト色。和カラーパレット範囲内で選んだ中性 blue-gray。
// tokens.primitives 側の blueGray は Mondrian パレットから外れたため参照を切っている。
export const DEFAULT_JAPANESE_COLOR = '#5B6B73' as const;
