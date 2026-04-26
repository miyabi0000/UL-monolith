import { callAPIWithRetry, API_CONFIG } from './api.client';
import type { SuggestedEdit, GearRef } from './llmAdvisor';

// --- 型定義 ---

export interface AdvisorSession {
  id: string;
  pack_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AdvisorMessageRow {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedEdits: SuggestedEdit[] | null;
  gearRefs: GearRef[] | null;
  createdAt: string;
}

export interface MessagesPage {
  /** 最新→古い順（DESC）。表示時は逆順にする */
  messages: AdvisorMessageRow[];
  hasMore: boolean;
  nextCursor: string | null;
}

// --- API ラッパー ---

/** 最新 1 セッションを取得（無ければ null） */
export async function fetchLatestSession(): Promise<AdvisorSession | null> {
  const res = await callAPIWithRetry(
    '/advisor/sessions?limit=1',
    {},
    API_CONFIG.timeout.standard,
    'GET',
  );
  const sessions: AdvisorSession[] = res.data;
  return sessions.length > 0 ? sessions[0] : null;
}

/** セッション一覧を更新日時降順で取得 (デフォルト 20 件、最大 50) */
export async function fetchSessions(limit = 20): Promise<AdvisorSession[]> {
  const res = await callAPIWithRetry(
    `/advisor/sessions?limit=${Math.min(limit, 50)}`,
    {},
    API_CONFIG.timeout.standard,
    'GET',
  );
  return (res.data as AdvisorSession[]) ?? [];
}

/** セッションを削除（CASCADE で配下メッセージも消える） */
export async function deleteSession(sessionId: string): Promise<void> {
  await callAPIWithRetry(
    `/advisor/sessions/${sessionId}`,
    {},
    API_CONFIG.timeout.standard,
    'DELETE',
  );
}

/**
 * セッション内メッセージを取得（カーソルベースページネーション）
 * @param sessionId セッション ID
 * @param opts limit: 取得件数 (default 50, max 100), before: 古い側カーソル (メッセージ ID)
 */
export async function fetchMessages(
  sessionId: string,
  opts: { limit?: number; before?: string } = {},
): Promise<MessagesPage> {
  const params = new URLSearchParams();
  if (opts.limit !== undefined) params.set('limit', String(opts.limit));
  if (opts.before) params.set('before', opts.before);
  const qs = params.toString();
  const path = `/advisor/sessions/${sessionId}/messages${qs ? `?${qs}` : ''}`;

  const res = await callAPIWithRetry(path, {}, API_CONFIG.timeout.standard, 'GET');
  return res.data as MessagesPage;
}

/** セッション作成 */
export async function createSession(packId?: string): Promise<AdvisorSession> {
  const res = await callAPIWithRetry(
    '/advisor/sessions',
    { packId: packId || null },
    API_CONFIG.timeout.standard,
    'POST',
  );
  return res.data as AdvisorSession;
}

/** メッセージ保存 */
export async function saveMessage(
  sessionId: string,
  msg: {
    role: 'user' | 'assistant';
    content: string;
    suggestedEdits?: SuggestedEdit[];
    gearRefs?: GearRef[];
  },
): Promise<AdvisorMessageRow> {
  const res = await callAPIWithRetry(
    `/advisor/sessions/${sessionId}/messages`,
    msg,
    API_CONFIG.timeout.standard,
    'POST',
  );
  return res.data as AdvisorMessageRow;
}
