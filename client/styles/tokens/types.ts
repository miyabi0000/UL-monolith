/**
 * Design Tokens - Type Definitions
 * トークンシステムの型定義
 */

// 数値ステップ共通型
type NumericSteps = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

/** ニュートラルスケール（white/black + 50〜900） */
export type NeutralScale = NumericSteps & {
  white: string;
  black: string;
};

/** アクセントスケール（50〜950） */
export type AccentScale = NumericSteps & {
  950: string;
};

/** プリミティブカラー（8色ファミリー） */
export type PrimitiveColors = {
  gray: NeutralScale;
  lightBlue: AccentScale;
  orange: AccentScale;
  purple: AccentScale;
  green: AccentScale;
  red: AccentScale;
  blue: AccentScale;
  blueGray: AccentScale;
};

/** テキストカラー */
export type TextColors = {
  title: string;
  body: string;
  sub: string;
  white: string;
  disable: string;
  placeholder: string;
  primary: string;
  error: string;
  warning: string;
  success: string;
  info: string;
};

/** アラート状態カラー */
export type AlertStateColors = {
  main: string;
  background: string;
  hover: string;
  outlinedBorder: string;
  focusVisible: string;
};

/** コンポーネント状態カラー */
export type ComponentStateColors = {
  main: string;
  background: string;
  hover: string;
  outlinedBorder: string;
  focusVisible: string;
  focus?: string;
  dark?: string;
  selected?: string;
  pressed?: string;
};

/** アラートカラー */
export type AlertColors = {
  error: AlertStateColors & { dark: string };
  warning: AlertStateColors;
  info: AlertStateColors & { pressed: string; focus: string };
  success: AlertStateColors;
};

/** コンポーネントカラー */
export type ComponentColors = {
  primary: ComponentStateColors;
  secondary: Pick<ComponentStateColors, 'main' | 'outlinedBorder' | 'background'>;
  tertiary: Pick<ComponentStateColors, 'main' | 'outlinedBorder' | 'background'>;
  quaternary: Pick<ComponentStateColors, 'main' | 'outlinedBorder' | 'background'>;
};

/** 共通カラー */
export type CommonColors = {
  white: {
    main: string;
    hover: string;
    border: string;
    focusVisible: string;
    selected: string;
  };
  black: {
    main: string;
    tertiary: string;
    border: string;
    secondary: string;
    hover: string;
  };
  disable: {
    contents: string;
    background: string;
    focus: string;
    outlined: string;
    hover: string;
  };
  background: {
    default: string;
    paper0: string;
    paper1: string;
    paper2: string;
    paper3: string;
  };
};

/** グラデーションカラー */
export type GradientColors = {
  chart: {
    primaryVertical: string;
    secondaryVertical: string;
    tertiaryVertical: string;
    quaternaryVertical: string;
    quinaryVertical: string;
    senaryVertical: string;
  };
  progress: {
    primaryHorizontal: string;
    secondaryHorizontal: string;
    tertiaryHorizontal: string;
    lightSecondary: string;
    lightTertiary: string;
    lightPrimary: string;
  };
  evolution: {
    coEvolutionVertical: string;
    coEvolutionHorizontal: string;
  };
};

/** セマンティックカラー（統合型） */
export type SemanticColors = AlertColors &
  ComponentColors & {
    text: TextColors;
    common: CommonColors;
  } & GradientColors;
