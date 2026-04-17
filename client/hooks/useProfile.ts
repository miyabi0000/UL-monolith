import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { callAPIWithRetry, API_CONFIG } from '../services/api.client';

const PROFILE_STORAGE_KEY = 'ul_profile_settings_v1';

// 画像サイズ制限: Base64 文字列長 137,000 ≒ 約 100KB
const MAX_IMAGE_BASE64_LENGTH = 137_000;

export interface ProfileSettings {
  headerTitle: string;
  headerImageUrl: string;
  displayName: string;
  handle: string;
  bio: string;
}

/** サーバーレスポンスの ProfileSettings（null 可能） */
interface ServerProfile {
  headerTitle: string | null;
  headerImageUrl: string | null;
  displayName: string | null;
  handle: string | null;
  bio: string | null;
  plan?: 'free' | 'pro' | null;
}

export type UserPlan = 'free' | 'pro';

const buildDefault = (fallbackName?: string): ProfileSettings => ({
  headerTitle: 'Packboard',
  headerImageUrl: '',
  displayName: fallbackName || 'Guest',
  handle: fallbackName ? `@${fallbackName.toLowerCase().replace(/\s+/g, '')}` : '@guest',
  bio: 'Inventory / Packs を切り替えて山行ごとの装備をまとめる。',
});

/** サーバーレスポンスをクライアント型に変換（null はデフォルト値で埋める） */
const fromServer = (data: ServerProfile | null, fallbackName?: string): ProfileSettings => {
  const defaults = buildDefault(fallbackName);
  if (!data) return defaults;
  return {
    headerTitle: data.headerTitle?.trim() || defaults.headerTitle,
    headerImageUrl: data.headerImageUrl?.trim() ?? defaults.headerImageUrl,
    displayName: data.displayName?.trim() || defaults.displayName,
    handle: data.handle?.trim() || defaults.handle,
    bio: data.bio?.trim() || defaults.bio,
  };
};

/** localStorage から旧プロフィールデータを読み出す */
const readLocalProfile = (fallbackName?: string): ProfileSettings | null => {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProfileSettings>;
    const defaults = buildDefault(fallbackName);
    return {
      headerTitle: parsed.headerTitle?.trim() || defaults.headerTitle,
      headerImageUrl: parsed.headerImageUrl?.trim() ?? defaults.headerImageUrl,
      displayName: parsed.displayName?.trim() || defaults.displayName,
      handle: parsed.handle?.trim() || defaults.handle,
      bio: parsed.bio?.trim() || defaults.bio,
    };
  } catch {
    return null;
  }
};

/** localStorage に保存（未認証モード用） */
const writeLocalProfile = (profile: ProfileSettings) => {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // localStorage アクセス失敗時は無視
  }
};

export function useProfile(fallbackName?: string) {
  const { isAuthenticated, user } = useAuth();
  const [profile, setProfile] = useState<ProfileSettings>(() =>
    readLocalProfile(fallbackName) ?? buildDefault(fallbackName),
  );
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<UserPlan>('free');

  // デバウンス用 ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestProfileRef = useRef<ProfileSettings>(profile);
  latestProfileRef.current = profile;
  const initializedRef = useRef(false);

  // --- 初期ロード + localStorage → DB 移行 ---
  useEffect(() => {
    // 未認証時は DB に触れない。localStorage のみ。
    if (!isAuthenticated) {
      initializedRef.current = false;
      return;
    }

    // 二重初期化防止
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initialize = async () => {
      setLoading(true);
      try {
        const res = await callAPIWithRetry('/profile', {}, API_CONFIG.timeout.standard, 'GET');
        const serverData: ServerProfile | null = res.data;

        const localProfile = readLocalProfile(fallbackName);
        const isServerEmpty = !serverData || Object.values(serverData).every((v) => v === null);

        if (isServerEmpty && localProfile) {
          // localStorage → DB 移行
          console.info('[Profile] localStorage → サーバーへ移行開始');
          const importRes = await callAPIWithRetry(
            '/profile/import',
            localProfile,
            API_CONFIG.timeout.standard,
            'POST',
          );
          localStorage.removeItem(PROFILE_STORAGE_KEY);
          console.info('[Profile] 移行完了');
          setProfile(fromServer(importRes.data, fallbackName));
        } else {
          setProfile(fromServer(serverData, fallbackName));
        }
        setPlan(serverData?.plan === 'pro' ? 'pro' : 'free');
        setError(null);
      } catch (err) {
        console.error('[Profile] 初期化エラー:', err);
        setError(err instanceof Error ? err.message : 'プロフィールの読み込みに失敗しました');
        // フォールバック: localStorage or デフォルト
        setProfile(readLocalProfile(fallbackName) ?? buildDefault(fallbackName));
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, [isAuthenticated, user?.id, fallbackName]);

  // --- 未認証時: profile 変更を localStorage に書き出し ---
  useEffect(() => {
    if (!isAuthenticated) {
      writeLocalProfile(profile);
    }
  }, [profile, isAuthenticated]);

  // --- デバウンス付き PUT ---
  const flushSave = useCallback(() => {
    if (!isAuthenticated) return;
    const data = latestProfileRef.current;
    void callAPIWithRetry('/profile', data, API_CONFIG.timeout.standard, 'PUT').catch((err) => {
      console.error('[Profile] 保存エラー:', err);
    });
  }, [isAuthenticated]);

  const scheduleSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      flushSave();
      debounceTimerRef.current = null;
    }, 300);
  }, [flushSave]);

  // Cleanup: unmount 時に未 flush のタイマーを即実行
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        flushSave();
      }
    };
  }, [flushSave]);

  // --- フィールド更新（楽観的 + デバウンス save） ---
  const updateField = useCallback(
    <K extends keyof ProfileSettings>(key: K, value: ProfileSettings[K]) => {
      // 画像サイズ制限: Base64 が約 100KB を超える場合は拒否
      if (key === 'headerImageUrl' && typeof value === 'string' && value.length > MAX_IMAGE_BASE64_LENGTH) {
        console.warn(`[Profile] 画像が大きすぎます (${Math.round(value.length / 1000)}KB相当)。100KB以下の画像を使用してください。`);
        return;
      }
      setProfile((prev) => ({ ...prev, [key]: value }));
      if (isAuthenticated) {
        scheduleSave();
      }
    },
    [isAuthenticated, scheduleSave],
  );

  return { profile, setProfile, updateField, showEditor, setShowEditor, loading, error, plan };
}
