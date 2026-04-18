import React, { useState } from 'react';
import { STATUS_TONES } from '../utils/designSystem';

interface LandingProps {
  /** メアド送信時の処理。成功で true を返すこと。 */
  onLogin: (email: string) => Promise<boolean>;
}

/**
 * 未認証時に表示される CTA ランディング
 *
 * - キャッチコピー + 特徴 3 つ
 * - メールアドレス入力欄 + 「はじめる」ボタン（パスワードレス）
 * - デモモードでは即座にログイン、Cognito モードでは送信後 false でエラー表示
 */
export default function Landing({ onLogin }: LandingProps) {
  const errorTone = STATUS_TONES.error;

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = email.trim();
    if (!trimmed) {
      setError('メールアドレスを入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const success = await onLogin(trimmed);
      if (!success) {
        setError('ログインに失敗しました。メールアドレスをご確認ください。');
      }
      // 成功時は AuthContext が user を更新し、App が Landing を unmount する
    } catch (err) {
      console.error('Landing login error:', err);
      setError('エラーが発生しました。時間をおいて再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-xl">
        {/* ヒーロー */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            UL Gear Manager
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            ウルトラライトハイキングのギアを、もっと軽く、もっと賢く。
          </p>
        </div>

        {/* 特徴 3 つ */}
        <ul className="space-y-3 mb-10 text-sm sm:text-base text-gray-700">
          <li className="flex items-start gap-3">
            <span aria-hidden className="mt-1 shrink-0 w-2 h-2 rounded-full bg-mondrian-black" />
            <span><strong>重量とコストを一元管理</strong> — パックごとの総重量・価格を自動集計</span>
          </li>
          <li className="flex items-start gap-3">
            <span aria-hidden className="mt-1 shrink-0 w-2 h-2 rounded-full bg-mondrian-black" />
            <span><strong>パック別のセットアップ保存</strong> — 行き先・季節ごとに装備を切替</span>
          </li>
          <li className="flex items-start gap-3">
            <span aria-hidden className="mt-1 shrink-0 w-2 h-2 rounded-full bg-mondrian-black" />
            <span><strong>AI アドバイザー</strong> — Big 3 の最適化・軽量化の提案を会話で取得</span>
          </li>
        </ul>

        {/* メール入力フォーム */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          <label htmlFor="landing-email" className="block text-sm font-medium text-gray-900 mb-2">
            メールアドレスではじめる
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="landing-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input flex-1 rounded-md px-3 py-2 focus:outline-none"
              required
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="btn-primary px-5 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isLoading ? '処理中…' : 'はじめる'}
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-3 text-sm p-2 rounded-md border"
              style={{
                backgroundColor: errorTone.background,
                borderColor: errorTone.border,
                color: errorTone.text,
              }}
            >
              {error}
            </div>
          )}

          <p className="mt-3 text-xs text-gray-500">
            パスワードは不要です。メールアドレスのみでご利用いただけます。
          </p>
        </form>
      </div>
    </div>
  );
}
