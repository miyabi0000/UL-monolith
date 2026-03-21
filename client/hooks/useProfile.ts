import { useEffect, useState } from 'react';

const PROFILE_STORAGE_KEY = 'ul_profile_settings_v1';

export interface ProfileSettings {
  headerTitle: string;
  headerImageUrl: string;
  displayName: string;
  handle: string;
  bio: string;
}

const readProfile = (fallbackName?: string): ProfileSettings => {
  const defaultProfile: ProfileSettings = {
    headerTitle: 'Packboard',
    headerImageUrl: '',
    displayName: fallbackName || 'Guest',
    handle: fallbackName ? `@${fallbackName.toLowerCase().replace(/\s+/g, '')}` : '@guest',
    bio: 'Inventory / Packs を切り替えて山行ごとの装備をまとめる。'
  };

  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return defaultProfile;
    const parsed = JSON.parse(raw) as Partial<ProfileSettings>;
    return {
      headerTitle: parsed.headerTitle?.trim() || defaultProfile.headerTitle,
      headerImageUrl: parsed.headerImageUrl?.trim() ?? defaultProfile.headerImageUrl,
      displayName: parsed.displayName?.trim() || defaultProfile.displayName,
      handle: parsed.handle?.trim() || defaultProfile.handle,
      bio: parsed.bio?.trim() || defaultProfile.bio
    };
  } catch {
    return defaultProfile;
  }
};

export function useProfile(fallbackName?: string) {
  const [profile, setProfile] = useState<ProfileSettings>(() => readProfile(fallbackName));
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const updateField = <K extends keyof ProfileSettings>(key: K, value: ProfileSettings[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  return { profile, setProfile, updateField, showEditor, setShowEditor };
}
