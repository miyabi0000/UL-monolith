import React from 'react';

/**
 * STG 環境であることをユーザーに明示するバナー。
 * VITE_APP_ENV=staging のときのみ表示する。
 * 誤操作 (本番と STG の取り違え) 防止が目的。
 */
export default function StagingBanner() {
  if (import.meta.env.VITE_APP_ENV !== 'staging') {
    return null;
  }

  return (
    <div
      role="status"
      aria-label="staging environment"
      className="w-full bg-mondrian-yellow text-mondrian-black text-center text-sm font-semibold py-1 px-2 select-none"
    >
      STAGING ENVIRONMENT — テスト用です。データはいつでも消える可能性があります。
    </div>
  );
}
