/**
 * カラー設定ユーティリティ関数
 * コンポーネント間で一貫したスタイリングを提供
 */

import { COLORS } from './colors';

/**
 * 背景色とボーダー色を組み合わせたカードスタイル
 */
export const getCardStyle = (variant: 'default' | 'selected' | 'hover' | 'square' = 'default') => {
  const baseStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // 高透明度
    borderColor: 'rgba(255, 255, 255, 0.3)',
    border: `1px solid rgba(255, 255, 255, 0.3)`,
    backdropFilter: 'blur(10px) saturate(180%) brightness(1.15)',
    WebkitBackdropFilter: 'blur(10px) saturate(180%) brightness(1.15)',
    boxShadow: '0 4px 16px rgba(31, 38, 135, 0.08)',
  };

  switch (variant) {
    case 'selected':
      return {
        ...baseStyle,
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(12px) saturate(200%) brightness(1.2)',
        WebkitBackdropFilter: 'blur(12px) saturate(200%) brightness(1.2)',
      };
    case 'hover':
      return {
        ...baseStyle,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(12px) saturate(190%) brightness(1.18)',
        WebkitBackdropFilter: 'blur(12px) saturate(190%) brightness(1.18)',
      };
    case 'square':
      return getSquareSeparatorStyle();
    default:
      return baseStyle;
  }
};

/**
 * テーブル行のスタイル
 */
export const getTableRowStyle = (isSelected: boolean = false, isHover: boolean = false) => {
  if (isSelected) {
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.35)',
      backdropFilter: 'blur(8px) saturate(180%) brightness(1.15)',
      WebkitBackdropFilter: 'blur(8px) saturate(180%) brightness(1.15)',
    };
  }
  if (isHover) {
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(6px) saturate(160%) brightness(1.1)',
      WebkitBackdropFilter: 'blur(6px) saturate(160%) brightness(1.1)',
    };
  }
  return {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  };
};

/**
 * テーブルヘッダーのスタイル
 */
export const getTableHeaderStyle = () => ({
  backgroundColor: COLORS.primary.light,
  color: COLORS.text.secondary,
  borderBottomColor: COLORS.primary.medium,
});

/**
 * 入力フィールドのスタイル
 */
export const getInputStyle = (variant: 'default' | 'focus' | 'error' = 'default') => {
  const baseStyle = {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary.medium,
    color: COLORS.text.primary,
    border: `1px solid ${COLORS.primary.medium}`,
  };

  switch (variant) {
    case 'focus':
      return {
        ...baseStyle,
        borderColor: COLORS.primary.dark,
        outline: `2px solid ${COLORS.primary.light}`,
      };
    case 'error':
      return {
        ...baseStyle,
        borderColor: COLORS.accent,
        backgroundColor: '#FEF2F2', // 薄い赤背景
      };
    default:
      return baseStyle;
  }
};

/**
 * ボタンのスタイル（Liquid Glass対応）
 */
export const getButtonStyle = (variant: 'primary' | 'secondary' | 'accent' | 'danger' | 'glass' = 'primary') => {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: COLORS.primary.dark,
        color: COLORS.white,
        border: `1px solid ${COLORS.primary.dark}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          backgroundColor: COLORS.primary.medium,
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
      };
    case 'secondary':
      return {
        backgroundColor: COLORS.white,
        color: COLORS.primary.dark,
        border: `1px solid ${COLORS.primary.medium}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          backgroundColor: COLORS.primary.light,
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
      };
    case 'glass':
      return getLiquidGlassStyle();
    case 'accent':
      return {
        backgroundColor: COLORS.accent,
        color: COLORS.white,
        border: `1px solid ${COLORS.accent}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          backgroundColor: '#D12D1A', // より濃い赤
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(209, 45, 26, 0.3)',
        },
      };
    case 'danger':
      return {
        backgroundColor: COLORS.accent,
        color: COLORS.white,
        border: `1px solid ${COLORS.accent}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          backgroundColor: '#D12D1A',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(209, 45, 26, 0.3)',
        },
      };
    default:
      return getButtonStyle('primary');
  }
};

/**
 * ドロップダウンメニューのスタイル
 */
export const getDropdownStyle = () => ({
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(12px) saturate(180%) brightness(1.15)',
  WebkitBackdropFilter: 'blur(12px) saturate(180%) brightness(1.15)',
  border: `1px solid rgba(255, 255, 255, 0.3)`,
  borderRadius: '0.375rem',
  boxShadow: '0 10px 25px -5px rgba(31, 38, 135, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
});

/**
 * ドロップダウンアイテムのスタイル
 */
export const getDropdownItemStyle = (isHover: boolean = false) => ({
  color: COLORS.text.primary,
  backgroundColor: isHover ? COLORS.primary.light : 'transparent',
  '&:hover': {
    backgroundColor: COLORS.primary.light,
  },
});

/**
 * ステータス表示用の色を取得
 */
export const getStatusColor = (status: 'success' | 'warning' | 'error' | 'info') => {
  switch (status) {
    case 'success':
      return COLORS.success;
    case 'warning':
      return COLORS.warning;
    case 'error':
      return COLORS.error;
    case 'info':
      return COLORS.info;
    default:
      return COLORS.primary.medium;
  }
};

/**
 * 優先度に基づく色を取得
 */
export const getPriorityColor = (priority: number) => {
  if (priority <= 2) return COLORS.accent; // 高優先度: 赤
  if (priority <= 3) return '#F59E0B'; // 中優先度: 黄色
  return COLORS.primary.medium; // 低優先度: 青緑
};

/**
 * カテゴリバッジのスタイル
 */
export const getCategoryBadgeStyle = (categoryColor?: string) => {
  const baseColor = categoryColor || COLORS.primary.medium;
  return {
    backgroundColor: `${baseColor}20`, // 20% opacity
    color: baseColor,
    border: `1px solid ${baseColor}40`, // 40% opacity border
  };
};

/**
 * リンクのスタイル
 */
export const getLinkStyle = (variant: 'default' | 'hover' = 'default') => {
  const baseStyle = {
    color: COLORS.primary.dark,
    textDecoration: 'none',
  };

  switch (variant) {
    case 'hover':
      return {
        ...baseStyle,
        color: COLORS.primary.medium,
        textDecoration: 'underline',
      };
    default:
      return baseStyle;
  }
};

/**
 * メッセージボックスのスタイル
 */
export const getMessageStyle = (type: 'success' | 'error' | 'info' | 'loading') => {
  switch (type) {
    case 'success':
      return {
        backgroundColor: COLORS.primary.light,
        borderColor: COLORS.primary.medium,
        color: COLORS.primary.dark,
        border: `1px solid ${COLORS.primary.medium}`,
      };
    case 'error':
      return {
        backgroundColor: '#FEF2F2',
        borderColor: COLORS.accent,
        color: COLORS.accent,
        border: `1px solid ${COLORS.accent}`,
      };
    case 'info':
      return {
        backgroundColor: COLORS.primary.light,
        borderColor: COLORS.primary.medium,
        color: COLORS.primary.dark,
        border: `1px solid ${COLORS.primary.medium}`,
      };
    case 'loading':
      return {
        backgroundColor: COLORS.primary.light,
        borderColor: COLORS.primary.medium,
        color: COLORS.primary.dark,
        border: `1px solid ${COLORS.primary.medium}`,
      };
    default:
      return getMessageStyle('info');
  }
};

/**
 * Squareコンポーネント区切り用スタイル（Apple Liquid Glass効果）
 * 2025年のベストプラクティスに基づいた実装
 */
export const getSquareSeparatorStyle = () => ({
  backgroundColor: 'rgba(255, 255, 255, 0.08)', // 極高透明度
  backdropFilter: 'blur(16px) saturate(180%) brightness(1.15)', // より洗練されたガラス効果
  WebkitBackdropFilter: 'blur(16px) saturate(180%) brightness(1.15)', // Safari support
  border: `1px solid rgba(255, 255, 255, 0.12)`, // より繊細な境界線
  borderRadius: '0px', // Square design
  boxShadow: `
    0 4px 24px rgba(31, 38, 135, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.08)
  `, // より微細な影効果
  backgroundClip: 'padding-box', // クリーンエッジ
});

/**
 * 高度なLiquid Glass効果（インタラクティブ要素用）
 */
export const getLiquidGlassStyle = (variant: 'default' | 'hover' | 'active' | 'focus' = 'default') => {
  const baseStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // より高い透明度
    backdropFilter: 'blur(12px) saturate(200%) brightness(1.2)',
    WebkitBackdropFilter: 'blur(12px) saturate(200%) brightness(1.2)',
    border: `1px solid rgba(255, 255, 255, 0.2)`,
    boxShadow: `
      0 8px 32px rgba(31, 38, 135, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.1)
    `,
    backgroundClip: 'padding-box' as const,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  switch (variant) {
    case 'hover':
      return {
        ...baseStyle,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(16px) saturate(220%) brightness(1.25)',
        WebkitBackdropFilter: 'blur(16px) saturate(220%) brightness(1.25)',
        boxShadow: `
          0 12px 48px rgba(31, 38, 135, 0.12),
          inset 0 1px 0 rgba(255, 255, 255, 0.5),
          0 0 0 1px rgba(255, 255, 255, 0.15)
        `,
        transform: 'translateY(-2px)',
      };
    case 'active':
      return {
        ...baseStyle,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(8px) saturate(180%) brightness(1.1)',
        WebkitBackdropFilter: 'blur(8px) saturate(180%) brightness(1.1)',
        boxShadow: `
          0 4px 16px rgba(31, 38, 135, 0.06),
          inset 0 1px 0 rgba(255, 255, 255, 0.2)
        `,
        transform: 'translateY(1px)',
      };
    case 'focus':
      return {
        ...baseStyle,
        border: `1px solid ${COLORS.primary.medium}`,
        boxShadow: `
          0 8px 32px rgba(31, 38, 135, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.3),
          0 0 0 3px ${COLORS.primary.light}
        `,
      };
    default:
      return baseStyle;
  }
};

/**
 * テキスト省略とホバー展開のスタイル
 */
export const getTruncatedTextStyle = (maxWidth: string = '200px') => ({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
  maxWidth,
  display: 'inline-block',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
});

/**
 * ホバー時のテキスト展開スタイル
 */
export const getExpandedTextStyle = () => ({
  whiteSpace: 'normal' as const,
  maxWidth: 'none',
  wordBreak: 'break-word' as const,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(12px) saturate(180%) brightness(1.1)',
  WebkitBackdropFilter: 'blur(12px) saturate(180%) brightness(1.1)',
  padding: '8px 12px',
  borderRadius: '6px',
  boxShadow: '0 4px 20px rgba(31, 38, 135, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  position: 'absolute' as const,
  zIndex: 1000,
  minWidth: '200px',
  maxWidth: '400px',
});