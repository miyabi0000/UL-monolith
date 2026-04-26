import React, { useState } from 'react';
import type { ProfileSettings, UserPlan } from '../hooks/useProfile';
import { ProfileEditorForm } from './ProfileEditorModal';
import { createCheckoutSession, createPortalSession } from '../services/billingService';

interface SettingsModalProps {
  profile: ProfileSettings;
  onUpdate: <K extends keyof ProfileSettings>(key: K, value: ProfileSettings[K]) => void;
  onClose: () => void;
  plan?: UserPlan;
  isAuthenticated: boolean;
  userName?: string;
  onLogout: () => void;
}

type SettingsTab = 'profile' | 'account' | 'plan';

const TABS: ReadonlyArray<{ key: SettingsTab; label: string }> = [
  { key: 'profile', label: 'Profile' },
  { key: 'account', label: 'Account' },
  { key: 'plan',    label: 'Plan' },
];

/**
 * Settings モーダル — Profile / Account / Plan を segmented tab で統合。
 *
 * Profile tab は既存の `ProfileEditorForm` を再利用。
 * Account tab はログイン済みユーザー情報 + Logout。
 * Plan tab は契約プラン (free / pro) の表示 + アップグレード導線のプレースホルダ。
 *
 * Tab UI は globals.css の `.segmented` 共通スタイルに揃え、
 * 選択中は surface-level-0 + shadow-sm で明示的に浮かせる。
 */
const SettingsModal: React.FC<SettingsModalProps> = ({
  profile,
  onUpdate,
  onClose,
  plan = 'free',
  isAuthenticated,
  userName,
  onLogout,
}) => {
  const [tab, setTab] = useState<SettingsTab>('profile');
  const [billingLoading, setBillingLoading] = useState(false);

  const goToBilling = async (getUrl: () => Promise<string>, errorMessage: string) => {
    setBillingLoading(true);
    try {
      window.location.href = await getUrl();
    } catch (err) {
      console.error('[Billing]', err);
      alert(errorMessage);
      setBillingLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel-md" onClick={(e) => e.stopPropagation()}>
        {/* Header: segmented tab bar + close */}
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{ borderBottom: 'var(--border-divider)' }}
        >
          <div role="tablist" aria-label="Settings section" className="segmented">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-pressed={tab === key}
                aria-selected={tab === key}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="icon-btn"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          {tab === 'profile' && (
            <ProfileEditorForm profile={profile} onUpdate={onUpdate} />
          )}
          {tab === 'account' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--ink-muted)' }}>
                  Signed in as
                </label>
                <p className="text-sm" style={{ color: 'var(--ink-primary)' }}>
                  {isAuthenticated ? (userName ?? 'User') : 'Not signed in'}
                </p>
              </div>
              {isAuthenticated && (
                <div className="pt-2">
                  <button
                    type="button"
                    className="btn-secondary w-full"
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
          {tab === 'plan' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--ink-muted)' }}>
                  Current plan
                </label>
                <p className="text-sm font-medium" style={{ color: 'var(--ink-primary)' }}>
                  {plan === 'pro' ? 'Pro' : 'Free'}
                </p>
              </div>
              {plan === 'free' ? (
                <div className="pt-2 space-y-2">
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                    Upgrade to Pro for unlimited AI advisor usage and richer gear analytics.
                  </p>
                  <button
                    type="button"
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={billingLoading}
                    onClick={() =>
                      goToBilling(
                        createCheckoutSession,
                        '決済ページを開けませんでした。時間をおいて再試行してください。',
                      )
                    }
                  >
                    {billingLoading ? 'Loading…' : 'Upgrade to Pro'}
                  </button>
                </div>
              ) : (
                <div className="pt-2 space-y-2">
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                    You&apos;re on Pro. Manage billing in the billing portal.
                  </p>
                  <button
                    type="button"
                    className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={billingLoading}
                    onClick={() =>
                      goToBilling(
                        createPortalSession,
                        'サブスクリプション管理ページを開けませんでした。',
                      )
                    }
                  >
                    {billingLoading ? 'Loading…' : 'Manage subscription'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3 flex justify-end"
          style={{ borderTop: 'var(--border-divider)' }}
        >
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SettingsModal);
