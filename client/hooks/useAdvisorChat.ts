import { useCallback, useEffect, useRef, useState } from 'react';
import type { AdvisorMessage, GearAdvisorContext, SuggestedEdit, GearRef } from '../services/llmAdvisor';
import { streamAdvisor } from '../services/llmAdvisorStream';
import { useAuth } from '../utils/AuthContext';
import {
  fetchLatestSession,
  fetchMessages,
  createSession,
  saveMessage,
  fetchSessions,
  deleteSession,
  type AdvisorMessageRow,
  type AdvisorSession,
} from '../services/advisorSessionsApi';

export interface SuggestedEditWithState extends SuggestedEdit {
  _applied?: boolean;
  _previousValue?: unknown;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedEdits?: SuggestedEditWithState[];
  gearRefs?: GearRef[];
  /** ＋メニューの Compare から挿入されるローカル比較パネル。DB 保存はしない */
  comparison?: { itemIds: string[] };
  timestamp: Date;
}

const createInitialMessage = (): ChatMessage => ({
  id: 'init',
  role: 'assistant',
  content: [
    'Hi! I\'m your UL Gear Advisor.',
    'Your gear list is loaded. I can help you with:',
    '',
    '• Base weight analysis & weight savings',
    '• Big 3 (pack, shelter, sleep system) optimization',
    '• Weight & price data correction suggestions',
    '• Click a gear chip below any reply to jump to that item',
  ].join('\n'),
  timestamp: new Date(),
});

let msgCounter = 0;
const createMessageId = () => `msg-${Date.now()}-${++msgCounter}`;

/** サーバーの MessageRow → ChatMessage に変換 */
const fromServerMessage = (row: AdvisorMessageRow): ChatMessage => ({
  id: row.id,
  role: row.role,
  content: row.content,
  suggestedEdits: row.suggestedEdits ?? undefined,
  gearRefs: row.gearRefs ?? undefined,
  timestamp: new Date(row.createdAt),
});

/**
 * アドバイザーチャットの状態管理フック
 * 認証済みの場合は DB に会話を永続化。未認証時は従来の useState のみ。
 * SSE ストリーミングでトークンを逐次表示。
 */
export const useAdvisorChat = (
  gearContext: GearAdvisorContext,
  onApplyEdit: (gearId: string, field: string, value: unknown) => Promise<void>,
) => {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createInitialMessage()]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [applyingEdit, setApplyingEdit] = useState<string | null>(null);

  // セッション ID（Lazy 作成: 最初のメッセージ送信時に作成）
  // ref は sendText 等の closure から最新値を読むため、state は UI 表示・履歴ハイライト用。
  const sessionIdRef = useRef<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const updateSessionId = useCallback((id: string | null) => {
    sessionIdRef.current = id;
    setCurrentSessionId(id);
  }, []);
  const initializedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // sendText 内で最新の messages を参照するための ref
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // --- 初期化: 認証済みなら最新セッションを復元 ---
  useEffect(() => {
    if (!isAuthenticated) {
      if (initializedRef.current) {
        updateSessionId(null);
        setMessages([createInitialMessage()]);
        initializedRef.current = false;
      }
      return;
    }

    if (initializedRef.current) return;
    initializedRef.current = true;

    const restore = async () => {
      try {
        const session = await fetchLatestSession();
        if (!session) return;

        // サーバーは最新→古い順 (DESC) で返すため、表示用に逆順 (ASC) に並べる
        const page = await fetchMessages(session.id, { limit: 50 });
        if (page.messages.length === 0) return;

        updateSessionId(session.id);
        const ordered = [...page.messages].reverse().map(fromServerMessage);
        setMessages([createInitialMessage(), ...ordered]);
      } catch (err) {
        console.error('[Advisor] セッション復元エラー:', err);
      }
    };

    void restore();
  }, [isAuthenticated, updateSessionId]);

  // ストリーミング中断（パネルclose / unmount 時）
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  /** 指定テキストを送信する内部関数（SSEストリーミング） */
  const sendText = useCallback(async (text: string) => {
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    const assistantMsgId = createMessageId();

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setIsStreaming(false);

    try {
      // 認証済みで未作成なら Lazy にセッション作成
      if (isAuthenticated && !sessionIdRef.current) {
        try {
          const session = await createSession();
          updateSessionId(session.id);
        } catch (err) {
          console.error('[Advisor] セッション作成失敗:', err);
        }
      }

      // ユーザーメッセージを DB に保存 (fire-and-forget)
      if (isAuthenticated && sessionIdRef.current) {
        void saveMessage(sessionIdRef.current, {
          role: 'user',
          content: text,
        }).catch((err) => console.error('[Advisor] メッセージ保存失敗:', err));
      }

      // ref から最新の messages を取得し、init メッセージを除外
      const history: AdvisorMessage[] = [
        ...messagesRef.current.filter((m) => m.id !== 'init'),
        userMsg,
      ].map((m) => ({ role: m.role, content: m.content }));

      // プレースホルダーメッセージを追加
      setMessages((prev) => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }]);

      // トークンバッチ用バッファ（rAF で描画頻度を最適化）
      let tokenBuffer = '';
      let rafId: number | null = null;
      const flushTokens = () => {
        if (!tokenBuffer) return;
        const batch = tokenBuffer;
        tokenBuffer = '';
        setMessages((prev) =>
          prev.map((m) => m.id === assistantMsgId ? { ...m, content: m.content + batch } : m)
        );
      };

      // AbortController
      abortRef.current = new AbortController();

      await streamAdvisor(history, gearContext, {
        onToken: (tokenText) => {
          if (!isStreaming) setIsStreaming(true);
          tokenBuffer += tokenText;
          if (rafId === null) {
            rafId = requestAnimationFrame(() => {
              flushTokens();
              rafId = null;
            });
          }
        },
        onTool: (name, data) => {
          // バッファ内の残りトークンをフラッシュ
          if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
          flushTokens();

          if (name === 'reference_gear') {
            setMessages((prev) =>
              prev.map((m) => m.id === assistantMsgId
                ? { ...m, gearRefs: [...(m.gearRefs ?? []), ...(data as GearRef[])] }
                : m
              )
            );
          } else if (name === 'suggest_edits') {
            setMessages((prev) =>
              prev.map((m) => m.id === assistantMsgId
                ? { ...m, suggestedEdits: [...(m.suggestedEdits ?? []), ...(data as SuggestedEditWithState[])] }
                : m
              )
            );
          }
        },
        onDone: () => {
          // 残りトークンフラッシュ
          if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
          flushTokens();

          // DB に保存 (fire-and-forget)
          if (isAuthenticated && sessionIdRef.current) {
            setMessages((prev) => {
              const finalMsg = prev.find((m) => m.id === assistantMsgId);
              if (finalMsg) {
                void saveMessage(sessionIdRef.current!, {
                  role: 'assistant',
                  content: finalMsg.content,
                  suggestedEdits: finalMsg.suggestedEdits,
                  gearRefs: finalMsg.gearRefs,
                }).catch((err) => console.error('[Advisor] メッセージ保存失敗:', err));
              }
              return prev;
            });
          }
        },
        onError: (err) => {
          if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
          setMessages((prev) =>
            prev.map((m) => m.id === assistantMsgId
              ? { ...m, content: m.content || `Something went wrong: ${err.message}` }
              : m
            )
          );
        },
      }, abortRef.current.signal);
    } catch (error) {
      // AbortError は無視（ユーザーによるキャンセル）
      if (error instanceof DOMException && error.name === 'AbortError') return;

      setMessages((prev) => {
        const hasPlaceholder = prev.some((m) => m.id === assistantMsgId);
        if (hasPlaceholder) {
          return prev.map((m) => m.id === assistantMsgId
            ? { ...m, content: `Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}` }
            : m
          );
        }
        return [...prev, {
          id: createMessageId(),
          role: 'assistant',
          content: `Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
        }];
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [isLoading, gearContext, isAuthenticated, updateSessionId]);

  /** 現在の入力欄テキストを送信 */
  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (trimmed) sendText(trimmed);
  }, [input, sendText]);

  const handleApplyEdit = useCallback(
    async (edit: SuggestedEdit, messageId: string, editIndex: number) => {
      const key = `${messageId}-${editIndex}`;
      setApplyingEdit(key);
      try {
        await onApplyEdit(edit.gearId, edit.field, edit.suggestedValue);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId && msg.suggestedEdits
              ? {
                  ...msg,
                  suggestedEdits: msg.suggestedEdits.map((e, i) =>
                    i === editIndex ? { ...e, _applied: true, _previousValue: e.currentValue } : e
                  ),
                }
              : msg
          )
        );
      } finally {
        setApplyingEdit(null);
      }
    },
    [onApplyEdit]
  );

  const handleUndoEdit = useCallback(
    async (edit: SuggestedEditWithState, messageId: string, editIndex: number) => {
      if (!edit._applied || edit._previousValue === undefined) return;
      const key = `${messageId}-${editIndex}`;
      setApplyingEdit(key);
      try {
        await onApplyEdit(edit.gearId, edit.field, edit._previousValue);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId && msg.suggestedEdits
              ? {
                  ...msg,
                  suggestedEdits: msg.suggestedEdits.map((e, i) =>
                    i === editIndex ? { ...e, _applied: false, _previousValue: undefined } : e
                  ),
                }
              : msg
          )
        );
      } finally {
        setApplyingEdit(null);
      }
    },
    [onApplyEdit]
  );

  /**
   * ＋メニュー Compare から呼ばれ、チャット末尾にローカル比較パネルを 1 件差し込む。
   * DB 保存は行わない（リロード後は消える想定）。
   */
  const appendComparison = useCallback((itemIds: string[]) => {
    if (itemIds.length < 2) return;
    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId(),
        role: 'assistant',
        content: '',
        comparison: { itemIds },
        timestamp: new Date(),
      },
    ]);
  }, []);

  /**
   * 過去セッションをロードしてチャット画面に展開する。
   * 既存の messages を入れ替え、以後の send は対象セッションへ追記される。
   */
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      // サーバーは最新→古い順 (DESC) で返すため、表示用に逆順 (ASC) に並べる
      const page = await fetchMessages(sessionId, { limit: 50 });
      updateSessionId(sessionId);
      const ordered = [...page.messages].reverse().map(fromServerMessage);
      setMessages([createInitialMessage(), ...ordered]);
    } catch (err) {
      console.error('[Advisor] セッション読込エラー:', err);
    }
  }, [updateSessionId]);

  /** 新しい会話を開始する。次の送信時に Lazy で session が作成される */
  const startNewSession = useCallback(() => {
    updateSessionId(null);
    setMessages([createInitialMessage()]);
  }, [updateSessionId]);

  /** 履歴ドロップダウン用: セッション一覧を取得 */
  const listSessions = useCallback(async (limit = 20): Promise<AdvisorSession[]> => {
    if (!isAuthenticated) return [];
    try {
      return await fetchSessions(limit);
    } catch (err) {
      console.error('[Advisor] セッション一覧取得エラー:', err);
      return [];
    }
  }, [isAuthenticated]);

  /** 履歴ドロップダウン用: セッション削除 (現在表示中なら新規へ切替) */
  const removeSession = useCallback(async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      if (sessionIdRef.current === sessionId) {
        updateSessionId(null);
        setMessages([createInitialMessage()]);
      }
    } catch (err) {
      console.error('[Advisor] セッション削除エラー:', err);
    }
  }, [updateSessionId]);

  return {
    messages,
    input,
    setInput,
    isLoading,
    isStreaming,
    applyingEdit,
    handleSend,
    sendText,
    handleApplyEdit,
    handleUndoEdit,
    appendComparison,
    currentSessionId,
    loadSession,
    startNewSession,
    listSessions,
    removeSession,
  };
};

/**
 * チャットパネルのスクロール・フォーカス管理フック
 */
export const useAdvisorPanel = (isOpen: boolean, messages: ChatMessage[]) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 300);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  return { messagesEndRef, inputRef };
};
