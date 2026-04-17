import React from 'react';
import { COLORS, SPACING_SCALE, COMPONENT_RADIUS } from '../utils/designSystem';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * アプリケーション全体の例外を捕捉して白画面を防ぐエラー境界。
 * React のレンダー/ライフサイクル中に throw された例外のみ捕捉する。
 * イベントハンドラや非同期処理の例外は捕捉しない（各呼び出し側で try/catch が必要）。
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: SPACING_SCALE.lg,
          backgroundColor: COLORS.background,
          color: COLORS.text.primary,
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: '100%',
            padding: SPACING_SCALE['2xl'],
            backgroundColor: COLORS.surface,
            borderRadius: COMPONENT_RADIUS.surface,
            borderLeft: `4px solid ${COLORS.error}`,
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: SPACING_SCALE.md }}>
            予期しないエラーが発生しました
          </h1>
          <p style={{ fontSize: 14, color: COLORS.text.secondary, marginBottom: SPACING_SCALE.lg }}>
            画面の再読み込みで復旧する場合があります。問題が続く場合は管理者にお問い合わせください。
          </p>
          {this.state.error?.message && (
            <pre
              style={{
                fontSize: 12,
                color: COLORS.text.muted,
                backgroundColor: COLORS.gray[100],
                padding: SPACING_SCALE.md,
                borderRadius: COMPONENT_RADIUS.control,
                marginBottom: SPACING_SCALE.lg,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              padding: `${SPACING_SCALE.sm}px ${SPACING_SCALE.lg}px`,
              backgroundColor: COLORS.accent.primary,
              color: COLORS.white,
              borderRadius: COMPONENT_RADIUS.control,
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            画面を再読み込み
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
