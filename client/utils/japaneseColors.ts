export const JAPANESE_COLOR_PALETTE = [
  { name: 'Asagi', hex: '#00A3AF' },
  { name: 'Yamabuki', hex: '#FFB11B' },
  { name: 'Ai', hex: '#274A78' },
  { name: 'Moegi', hex: '#7BA23F' },
  { name: 'Shu', hex: '#E2041B' },
  { name: 'Murasaki', hex: '#7058A3' },
  { name: 'Kikyo', hex: '#5654A2' },
  { name: 'Ainezumi', hex: '#5B6B73' },
  { name: 'Sumi', hex: '#1B1D1B' },
  { name: 'Sakura', hex: '#F7C6C7' },
  { name: 'Kohaku', hex: '#C37854' },
  { name: 'Byakuroku', hex: '#A8D8B9' }
] as const;

export const JAPANESE_COLOR_HEX_SET = new Set(
  JAPANESE_COLOR_PALETTE.map((color) => color.hex)
);

export const DEFAULT_JAPANESE_COLOR = '#5B6B73';
