import React from 'react';
import { COLORS, SPACING_SCALE } from '../../utils/designSystem';
import Button from './Button';

interface EmptyStateProps {
  /** メインメッセージ（例: "まだギアがありません"） */
  title: string;
  /** 補足説明（任意） */
  description?: string;
  /** アイコン（任意。SVG 要素を渡す） */
  icon?: React.ReactNode;
  /** CTA ボタンのラベル（任意） */
  actionLabel?: string;
  /** CTA クリック時の動作 */
  onAction?: () => void;
  /** 二次的な CTA（任意） */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  /** コンパクト表示（詳細パネル内などの小領域用） */
  compact?: boolean;
  className?: string;
}

/**
 * アイテム 0 件時の空状態 UI。
 * 初回ユーザーが「壊れている」と感じないよう、次のアクションに誘導する。
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
  className = '',
}) => {
  const padding = compact ? SPACING_SCALE.lg : SPACING_SCALE['2xl'];
  const titleSize = compact ? 14 : 16;
  const descSize = compact ? 12 : 13;

  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center text-center ${className}`}
      style={{ padding, gap: SPACING_SCALE.md }}
    >
      {icon && (
        <div style={{ color: COLORS.text.muted, marginBottom: SPACING_SCALE.xs }}>
          {icon}
        </div>
      )}
      <div style={{ fontSize: titleSize, fontWeight: 600, color: COLORS.text.primary }}>
        {title}
      </div>
      {description && (
        <p
          style={{
            fontSize: descSize,
            color: COLORS.text.muted,
            maxWidth: 360,
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2" style={{ marginTop: SPACING_SCALE.sm }}>
          {actionLabel && onAction && (
            <Button type="button" variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button type="button" variant="secondary" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
