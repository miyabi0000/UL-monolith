import React, { useState } from 'react';
import type { ProfileSettings, UserPlan } from '../hooks/useProfile';
import { ProfileEditorForm } from './ProfileEditorModal';

interface SettingsModalProps {
  profile: ProfileSettings;
  onUpdate: <K extends keyof ProfileSettings>(key: K, value: ProfileSettings[K]) => void;
  onClose: () => void;
  plan?: UserPlan;
  isAuthenticated: boolean;
  userName?: string;
  onLogout: () => void;
}

type SettingsTab = 'profile' | 'account';

/**
 * Settings モーダル — Profile / Account を tab で統合。
 *
 * Profile tab は既存の `ProfileEditorForm` を再利用。
 * Account tab はログイン済みユーザー情報 + Logout。
 *
 * Tab UI は `ChatSidebar` の Add / Advisor と同じ視覚言語を踏襲。
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel-md" onClick={(e) => e.stopPropagation()}>
        {/* Header: tab bar + close */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <div role="tablist" aria-label="Settings section" className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-gray-100 dark:bg-gray-700">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'profile'}
              onClick={() => setTab('profile')}
              className={`px-3 h-8 inline-flex items-center rounded text-xs font-semibold transition-colors
                          ${tab === 'profile'
                            ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100'}`}
            >
              Profile
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'account'}
              onClick={() => setTab('account')}
              className={`px-3 h-8 inline-flex items-center rounded text-xs font-semibold transition-colors
                          ${tab === 'account'
                            ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100'}`}
            >
              Account
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          {tab === 'profile' && (
            <ProfileEditorForm profile={profile} onUpdate={onUpdate} plan={plan} />
          )}
          {tab === 'account' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Signed in as
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
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
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SettingsModal);
