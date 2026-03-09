import React from 'react';
import type { ProfileSettings } from '../hooks/useProfile';

interface ProfileHeaderProps {
  profile: ProfileSettings;
  onEditProfile: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, onEditProfile }) => (
  <section className="rounded-2xl border border-gray-200/70 bg-white/75 shadow-sm backdrop-blur dark:border-slate-600/80 dark:bg-slate-800/70 overflow-hidden">
    {profile.headerImageUrl && (
      <div className="h-24 sm:h-32 w-full bg-gray-100 dark:bg-slate-700">
        <img src={profile.headerImageUrl} alt="" className="h-full w-full object-cover" />
      </div>
    )}
    <div className="p-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{profile.headerTitle}</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="h-10 w-10 rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-sm font-semibold inline-flex items-center justify-center">
            {(profile.displayName?.trim()?.charAt(0) || 'U').toUpperCase()}
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{profile.displayName}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{profile.handle}</p>
          </div>
        </div>
        {profile.bio && (
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 max-w-2xl">{profile.bio}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onEditProfile}
        className="p-1.5 rounded-md bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-slate-500 shadow-sm hover:bg-gray-300 dark:hover:bg-slate-500 hover:text-gray-900 dark:hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-slate-400"
        aria-label="Edit Profile"
        title="Edit Profile"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  </section>
);

export default React.memo(ProfileHeader);
