import { useCallback, useEffect, useRef, useState } from 'react';
import { callAdvisor, AdvisorMessage, GearAdvisorContext, SuggestedEdit } from '../services/llmAdvisor';
import type { GearRef } from '../services/llmAdvisor';

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

/**
 * アドバイザーチャットの状態管理フック
 */
export const useAdvisorChat = (
  gearContext: GearAdvisorContext,
  onApplyEdit: (gearId: string, field: string, value: unknown) => Promise<void>,
) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createInitialMessage()]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [applyingEdit, setApplyingEdit] = useState<string | null>(null);

  // sendText 内で最新の messages を参照するための ref
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

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
      // ref から最新の messages を取得し、init メッセージを除外
      const history: AdvisorMessage[] = [
        ...messagesRef.current.filter((m) => m.id !== 'init'),
        userMsg,
      ].map((m) => ({ role: m.role, content: m.content }));

      const result = await callAdvisor(history, gearContext);

      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: 'assistant',
          content: result.message,
          suggestedEdits: result.suggestedEdits,
          gearRefs: result.gearRefs,
          timestamp: new Date(),
        },
      ]);
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
  }, [isLoading, gearContext]);

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
