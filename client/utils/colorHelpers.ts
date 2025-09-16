/**
 * カラー設定ユーティリティ関数
 * コンポーネント間で一貫したスタイリングを提供
 */

import { COLORS } from './colors';

/**
 * 背景色とボーダー色を組み合わせたカードスタイル
 */
export const getCardStyle = (variant: 'default' | 'selected' | 'hover' = 'default') => {
  const baseStyle = {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary.medium,
    border: `1px solid ${COLORS.primary.medium}`,
  };

  switch (variant) {
    case 'selected':
      return {
        ...baseStyle,
        backgroundColor: COLORS.primary.light,
        borderColor: COLORS.primary.dark,
      };
    case 'hover':
      return {
        ...baseStyle,
        backgroundColor: COLORS.primary.light,
      };
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
      backgroundColor: COLORS.primary.light,
    };
  }
  if (isHover) {
    return {
      backgroundColor: COLORS.primary.light,
    };
  }
  return {
    backgroundColor: COLORS.white,
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
 * ボタンのスタイル
 */
export const getButtonStyle = (variant: 'primary' | 'secondary' | 'accent' | 'danger' = 'primary') => {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: COLORS.primary.dark,
        color: COLORS.white,
        border: `1px solid ${COLORS.primary.dark}`,
        '&:hover': {
          backgroundColor: COLORS.primary.medium,
        },
      };
    case 'secondary':
      return {
        backgroundColor: COLORS.white,
        color: COLORS.primary.dark,
        border: `1px solid ${COLORS.primary.medium}`,
        '&:hover': {
          backgroundColor: COLORS.primary.light,
        },
      };
    case 'accent':
      return {
        backgroundColor: COLORS.accent,
        color: COLORS.white,
        border: `1px solid ${COLORS.accent}`,
        '&:hover': {
          backgroundColor: '#D12D1A', // より濃い赤
        },
      };
    case 'danger':
      return {
        backgroundColor: COLORS.accent,
        color: COLORS.white,
        border: `1px solid ${COLORS.accent}`,
        '&:hover': {
          backgroundColor: '#D12D1A',
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
  backgroundColor: COLORS.white,
  border: `1px solid ${COLORS.primary.medium}`,
  borderRadius: '0.375rem',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
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