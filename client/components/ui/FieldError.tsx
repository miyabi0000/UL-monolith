import React from 'react';

interface FieldErrorProps {
  /** エラーメッセージ。undefined / 空文字なら何もレンダーしない */
  message?: string;
  /** input の aria-describedby と紐づける場合の id */
  id?: string;
  className?: string;
}

/**
 * フィールド下のインラインエラー表示。
 *
 * 色は `globals.css` の `.form-error-text` (= var(--state-danger-fg)) に統一。
 * role="alert" でスクリーンリーダーへ通知する。
 */
export const FieldError: React.FC<FieldErrorProps> = ({
  message,
  id,
  className = '',
}) => {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className={`form-error-text mt-1 text-xs ${className}`.trim()}
    >
      {message}
    </p>
  );
};

export default FieldError;
