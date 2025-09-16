/**
 * UL Gear Manager - 統一カラーパレット
 * 
 * 全コンポーネントで使用する共通カラーシステム
 */

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

/**
 * Tailwind CSS用のカラークラス生成
 */
export const getColorClasses = () => ({
  // Background classes
  'bg-primary-light': { backgroundColor: COLORS.primary.light },
  'bg-primary-medium': { backgroundColor: COLORS.primary.medium },
  'bg-primary-dark': { backgroundColor: COLORS.primary.dark },
  'bg-white': { backgroundColor: COLORS.white },
  'bg-accent': { backgroundColor: COLORS.accent },
  
  // Text classes
  'text-primary-light': { color: COLORS.primary.light },
  'text-primary-medium': { color: COLORS.primary.medium },
  'text-primary-dark': { color: COLORS.primary.dark },
  'text-white': { color: COLORS.white },
  'text-accent': { color: COLORS.accent },
  
  // Border classes
  'border-primary-light': { borderColor: COLORS.primary.light },
  'border-primary-medium': { borderColor: COLORS.primary.medium },
  'border-primary-dark': { borderColor: COLORS.primary.dark },
  'border-white': { borderColor: COLORS.white },
  'border-accent': { borderColor: COLORS.accent },
});

/**
 * インラインスタイル用のカラーヘルパー
 */
export const inlineStyles = {
  primaryButton: {
    backgroundColor: COLORS.primary.dark,
    color: COLORS.white,
    border: `1px solid ${COLORS.primary.dark}`,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    color: COLORS.primary.dark,
    border: `1px solid ${COLORS.primary.medium}`,
  },
  accentButton: {
    backgroundColor: COLORS.accent,
    color: COLORS.white,
    border: `1px solid ${COLORS.accent}`,
  },
  card: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary.medium,
  },
  background: {
    backgroundColor: COLORS.background,
  }
};

/**
 * Chart.js用カラーパレット
 */
export const chartColors = {
  primary: COLORS.primary.dark,
  secondary: COLORS.primary.medium,
  accent: COLORS.accent,
  background: COLORS.primary.light,
  text: COLORS.text.primary,
};