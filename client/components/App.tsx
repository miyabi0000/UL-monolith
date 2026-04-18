import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { useAppState } from '../hooks/useAppState';
import { useNotifications } from '../hooks/useNotifications';
import NotificationPopup from './NotificationPopup';
import PacksPage from './PacksPage';
import PackDetailPage from './PackDetailPage';
import AppDock from './AppDock';
import Landing from './Landing';

export default function App() {
  const location = useLocation();
  const { user, isAuthenticated, logout, loginWithEmail } = useAuth();
  const appState = useAppState();
  const { setShowChat } = appState;

  const { messages, removeNotification, showError } = useNotifications();

  // クォータ超過の全局通知 (api.client から CustomEvent で通知される)
  React.useEffect(() => {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<{ plan?: string; message?: string }>).detail ?? {};
      const base = detail.message ?? '月の利用上限に達しました。';
      const suffix = detail.plan === 'free' ? ' Pro にアップグレードすると継続利用できます。' : '';
      showError(`${base}${suffix}`, 8000);
    };
    window.addEventListener('quota-exceeded', handler);
    return () => window.removeEventListener('quota-exceeded', handler);
  }, [showError]);

  // URLハッシュによるスクロール
  React.useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace('#', '');
    const element = document.getElementById(id);
    if (!element) return;
    window.requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [location.hash]);

  // 未認証時は CTA ランディングを表示して早期 return
  // (パスワードレス: Landing の onLogin で loginWithEmail を呼び、
  //  成功すると isAuthenticated が true になってこの分岐を抜ける)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Landing onLogin={loginWithEmail} />
        <NotificationPopup messages={messages} onRemove={removeNotification} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ルーティング */}
      <Routes>
        <Route
          path="/"
          element={
            <PacksPage
              appState={appState}
              isAuthenticated={isAuthenticated}
              userName={user?.name}
              onLogout={logout}
              onShowChat={() => setShowChat((prev) => !prev)}
            />
          }
        />
        <Route path="/all" element={<Navigate to="/" replace />} />
        <Route path="/packs" element={<Navigate to="/" replace />} />
        <Route path="/p/:packId" element={<PackDetailPage />} />
      </Routes>

      {/* PacksPage(/) 以外のルート（/p/:packId など）でのみ表示 */}
      {location.pathname !== '/' && (
        <AppDock
          onLogout={logout}
          isAuthenticated={isAuthenticated}
          userName={user?.name}
          onShowChat={() => setShowChat((prev) => !prev)}
        />
      )}

      {/* 右端通知ポップアップ */}
      <NotificationPopup
        messages={messages}
        onRemove={removeNotification}
      />
    </div>
  );
}
