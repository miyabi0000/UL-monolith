import { useCallback, useEffect, useRef, useState } from 'react';
import { callAdvisor, AdvisorMessage, GearAdvisorContext, SuggestedEdit } from '../services/llmAdvisor';
import type { GearRef } from '../services/llmAdvisor';
import { useAuth } from '../utils/AuthContext';
import {
  fetchLatestSession,
  fetchMessages,
  createSession,
  saveMessage,
  type AdvisorMessageRow,
} from '../services/advisorSessionsApi';

export interface SuggestedEditWithState extends SuggestedEdit {
  _applied?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedEdits?: SuggestedEditWithState[];
  gearRefs?: GearRef[];
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
 */
export const useAdvisorChat = (
  gearContext: GearAdvisorContext,
  onApplyEdit: (gearId: string, field: string, value: unknown) => Promise<void>,
) => {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createInitialMessage()]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [applyingEdit, setApplyingEdit] = useState<string | null>(null);

  // セッション ID（Lazy 作成: 最初のメッセージ送信時に作成）
  const sessionIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  // sendText 内で最新の messages を参照するための ref
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // --- 初期化: 認証済みなら最新セッションを復元 ---
  useEffect(() => {
    if (!isAuthenticated) {
      // ログアウト遷移: セッションをリセット
      if (initializedRef.current) {
        sessionIdRef.current = null;
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
        if (!session) return; // セッションなし → lazy 作成待ち

        const serverMessages = await fetchMessages(session.id);
        if (serverMessages.length === 0) return;

        sessionIdRef.current = session.id;
        setMessages([
          createInitialMessage(),
          ...serverMessages.map(fromServerMessage),
        ]);
      } catch (err) {
        console.error('[Advisor] セッション復元エラー:', err);
        // 復元失敗時は initial greeting のまま
      }
    };

    void restore();
  }, [isAuthenticated]);

  /** 指定テキストを送信する内部関数 */
  const sendText = useCallback(async (text: string) => {
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 認証済みで未作成なら Lazy にセッション作成
      if (isAuthenticated && !sessionIdRef.current) {
        try {
          const session = await createSession();
          sessionIdRef.current = session.id;
        } catch (err) {
          console.error('[Advisor] セッション作成失敗:', err);
          // 失敗してもチャット自体は続行（次回送信時にリトライ）
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

      const result = await callAdvisor(history, gearContext);

      const assistantMsg: ChatMessage = {
        id: createMessageId(),
        role: 'assistant',
        content: result.message,
        suggestedEdits: result.suggestedEdits,
        gearRefs: result.gearRefs,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // アシスタントメッセージを DB に保存 (fire-and-forget)
      if (isAuthenticated && sessionIdRef.current) {
        void saveMessage(sessionIdRef.current, {
          role: 'assistant',
          content: result.message,
          suggestedEdits: result.suggestedEdits,
          gearRefs: result.gearRefs,
        }).catch((err) => console.error('[Advisor] メッセージ保存失敗:', err));
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: 'assistant',
          content: `Something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, gearContext, isAuthenticated]);

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
                    i === editIndex ? { ...e, _applied: true } : e
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

  return {
    messages,
    input,
    setInput,
    isLoading,
    applyingEdit,
    handleSend,
    sendText,
    handleApplyEdit,
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
