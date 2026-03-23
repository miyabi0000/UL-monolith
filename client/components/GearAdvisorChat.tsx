import React, { useState, useRef, useEffect } from 'react';
import { callAdvisor, AdvisorMessage, SuggestedEdit, GearAdvisorContext } from '../services/llmAdvisor';
import { COLORS, SHADOW, FONT_SCALE, SPACING_SCALE } from '../utils/designSystem';
import { alpha } from '../styles/tokens';

interface GearAdvisorChatProps {
  isOpen: boolean;
  onClose: () => void;
  gearContext: GearAdvisorContext;
  onApplyEdit: (gearId: string, field: string, value: any) => Promise<void>;
}

interface SuggestedEditWithState extends SuggestedEdit {
  _applied?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedEdits?: SuggestedEditWithState[];
  timestamp: Date;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'init',
  role: 'assistant',
  content: `こんにちは！ULギアアドバイザーです。\n\nあなたのギアリストを読み込みました。以下のことをお手伝いできます：\n\n**分析・アドバイス**\n• ベースウェイトの改善ポイント\n• Big3（バックパック・シェルター・スリーピング）の最適化\n• 軽量化のための代替ギア提案\n\n**ギア編集提案**\n• 重量・価格データの修正提案\n• キット登録状態の最適化\n\n何でも聞いてください！`,
  timestamp: new Date()
};

const FIELD_LABELS: Record<string, string> = {
  weightGrams: '重量 (g)',
  priceCents: '価格 (cents)',
  priority: '優先度',
  isInKit: 'キット登録',
  weightClass: '重量クラス',
};

const GearAdvisorChat: React.FC<GearAdvisorChatProps> = ({
  isOpen,
  onClose,
  gearContext,
  onApplyEdit,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [applyingEdit, setApplyingEdit] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nextMessageIdRef = useRef(1);

  const createMessageId = () => {
    const id = `msg-${Date.now()}-${nextMessageIdRef.current}`;
    nextMessageIdRef.current += 1;
    return id;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isOpen || !inputRef.current) {
      return;
    }

    const timer = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 会話履歴（initメッセージ除く）をAPIに渡す
      const history: AdvisorMessage[] = [...messages.filter(m => m.id !== 'init'), userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const result = await callAdvisor(history, gearContext);

      const assistantMsg: ChatMessage = {
        id: createMessageId(),
        role: 'assistant',
        content: result.message,
        suggestedEdits: result.suggestedEdits,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      const errMsg: ChatMessage = {
        id: createMessageId(),
        role: 'assistant',
        content: `エラーが発生しました：${error instanceof Error ? error.message : '不明なエラー'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApplyEdit = async (edit: SuggestedEdit, messageId: string, editIndex: number) => {
    const key = `${messageId}-${editIndex}`;
    setApplyingEdit(key);
    try {
      await onApplyEdit(edit.gearId, edit.field, edit.suggestedValue);
      // 適用済みとしてマーク（メッセージを更新）
      setMessages(prev =>
        prev.map(msg =>
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
  };

  const formatValue = (field: string, value: any): string => {
    if (field === 'weightGrams') return `${value}g`;
    if (field === 'priceCents') return `¥${Math.round(value / 100).toLocaleString()}`;
    if (field === 'isInKit') return value ? 'キット登録済み' : '未登録';
    return String(value);
  };

  if (!isOpen) return null;

  const totalWeightKg = gearContext.weightBreakdown
    ? (gearContext.weightBreakdown.baseWeight / 1000).toFixed(2)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* オーバーレイ */}
      <div
        className="flex-1 bg-black bg-opacity-20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* アドバイザーパネル */}
      <div
        className="w-[480px] flex flex-col animate-in slide-in-from-right duration-200 ease-out"
        style={{
          backgroundColor: COLORS.white,
          boxShadow: `-4px 0 6px -1px ${alpha(COLORS.gray[900], 0.1)}`,
        }}
      >
        {/* ヘッダー */}
        <div
          className="flex justify-between items-center"
          style={{
            padding: `${SPACING_SCALE.md}px ${SPACING_SCALE.lg}px`,
            borderBottom: `1px solid ${COLORS.gray[200]}`,
            background: `linear-gradient(135deg, ${COLORS.gray[800]} 0%, ${COLORS.gray[700]} 100%)`,
          }}
        >
          <div>
            <h3
              className="font-semibold"
              style={{ fontSize: `${FONT_SCALE.base}px`, color: COLORS.white }}
            >
              UL ギアアドバイザー
            </h3>
            <p style={{ fontSize: `${FONT_SCALE.sm}px`, color: alpha(COLORS.white, 0.75), marginTop: '2px' }}>
              {gearContext.items.length}アイテム
              {totalWeightKg && ` • ベース ${totalWeightKg}kg`}
              {gearContext.ulStatus && ` • ${gearContext.ulStatus.classification}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md transition-opacity hover:opacity-70"
            style={{ color: COLORS.white, fontSize: `${FONT_SCALE.lg}px` }}
          >
            ✕
          </button>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] ${message.role === 'user' ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md'}`}
              >
                {/* メッセージ本文 */}
                <div
                  className="p-3"
                  style={{
                    ...(message.role === 'user'
                      ? { backgroundColor: COLORS.gray[700], color: COLORS.white }
                      : { backgroundColor: COLORS.gray[50], color: COLORS.text.primary }),
                    borderRadius: 'inherit',
                    boxShadow: SHADOW,
                    fontSize: `${FONT_SCALE.sm}px`,
                  }}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </div>
                  <div
                    className="text-xs mt-1 opacity-60"
                    style={{ color: message.role === 'user' ? COLORS.white : COLORS.text.secondary }}
                  >
                    {message.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* 編集提案カード */}
                {message.suggestedEdits && message.suggestedEdits.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.suggestedEdits.map((edit, index) => {
                      const key = `${message.id}-${index}`;
                      const isApplied = edit._applied === true;
                      return (
                        <div
                          key={key}
                          className="p-3 rounded-xl"
                          style={{
                            backgroundColor: isApplied ? COLORS.gray[100] : COLORS.white,
                            border: `1px solid ${isApplied ? COLORS.gray[200] : COLORS.gray[300]}`,
                            boxShadow: SHADOW,
                          }}
                        >
                          <div
                            className="text-xs font-semibold mb-1"
                            style={{ color: COLORS.text.secondary }}
                          >
                            編集提案: {edit.gearName}
                          </div>
                          <div
                            className="text-xs mb-2"
                            style={{ color: COLORS.text.primary }}
                          >
                            <span style={{ color: COLORS.text.secondary }}>
                              {FIELD_LABELS[edit.field] || edit.field}:
                            </span>{' '}
                            <span style={{ textDecoration: 'line-through', color: COLORS.text.secondary }}>
                              {formatValue(edit.field, edit.currentValue)}
                            </span>
                            {' → '}
                            <span className="font-medium">
                              {formatValue(edit.field, edit.suggestedValue)}
                            </span>
                          </div>
                          <div
                            className="text-xs mb-2"
                            style={{ color: COLORS.text.secondary }}
                          >
                            {edit.reason}
                          </div>
                          <button
                            disabled={isApplied || applyingEdit === key}
                            onClick={() => handleApplyEdit(edit, message.id, index)}
                            className="w-full py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              backgroundColor: isApplied ? COLORS.gray[400] : COLORS.gray[700],
                              color: COLORS.white,
                            }}
                          >
                            {isApplied ? '適用済み' : applyingEdit === key ? '適用中...' : '変更を適用'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div
                className="p-3 rounded-2xl rounded-bl-md"
                style={{ backgroundColor: COLORS.gray[50], boxShadow: SHADOW }}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full"
                    style={{ borderColor: COLORS.gray[600] }}
                  />
                  <span style={{ fontSize: `${FONT_SCALE.sm}px`, color: COLORS.text.secondary }}>
                    分析中...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <div
          style={{
            padding: `${SPACING_SCALE.md}px ${SPACING_SCALE.lg}px`,
            borderTop: `1px solid ${COLORS.gray[200]}`,
            backgroundColor: COLORS.gray[50],
          }}
        >
          <div className="flex space-x-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ギアについて質問する... (Shift+Enterで改行)"
              disabled={isLoading}
              rows={2}
              className="flex-1 px-3 py-2 rounded-lg resize-none focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
              style={{
                backgroundColor: COLORS.white,
                boxShadow: SHADOW,
                color: COLORS.text.primary,
                fontSize: `${FONT_SCALE.sm}px`,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed self-end"
              style={{
                backgroundColor: COLORS.gray[700],
                boxShadow: SHADOW,
                fontSize: `${FONT_SCALE.sm}px`,
              }}
            >
              送信
            </button>
          </div>
          <p
            className="mt-2"
            style={{ color: COLORS.text.secondary, fontSize: `${FONT_SCALE.xs}px` }}
          >
            例: 「軽量化のアドバイスをください」「Big3の合計重量は？」
          </p>
        </div>
      </div>
    </div>
  );
};

export default GearAdvisorChat;
