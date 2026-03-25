import React, { useCallback, useEffect, useRef, useState } from 'react';
import { alpha } from '../styles/tokens';
import { callAdvisor, AdvisorMessage, GearAdvisorContext, GearRef, SuggestedEdit } from '../services/llmAdvisor';
import { COLORS, FONT_SCALE, SHADOW, SPACING_SCALE } from '../utils/designSystem';

// ==================== 型定義 ====================

interface GearAdvisorChatProps {
  isOpen: boolean;
  onClose: () => void;
  gearContext: GearAdvisorContext;
  onApplyEdit: (gearId: string, field: string, value: unknown) => Promise<void>;
  /** チャット内のギア参照チップをクリックした際に呼ばれるコールバック */
  onFocusGear?: (gearId: string) => void;
}

interface SuggestedEditWithState extends SuggestedEdit {
  _applied?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedEdits?: SuggestedEditWithState[];
  /** AIが言及したギアの一覧 */
  gearRefs?: GearRef[];
  timestamp: Date;
}

// ==================== 定数 ====================

const INITIAL_MESSAGE: ChatMessage = {
  id: 'init',
  role: 'assistant',
  content: [
    'こんにちは！ULギアアドバイザーです。',
    'ギアリストを読み込みました。以下のことをお手伝いできます：',
    '',
    '• ベースウェイトの改善・軽量化提案',
    '• Big3（バックパック・シェルター・スリーピング）の最適化',
    '• 重量・価格データの修正提案',
    '• 特定ギアへのフォーカス（回答内のギア名をクリック）',
  ].join('\n'),
  timestamp: new Date(),
};

const FIELD_LABELS: Record<string, string> = {
  weightGrams: '重量',
  priceCents: '価格',
  priority: '優先度',
  isInKit: 'キット登録',
  weightClass: '重量クラス',
};

// ==================== ヘルパー ====================

const formatEditValue = (field: string, value: unknown): string => {
  if (field === 'weightGrams') return `${value}g`;
  if (field === 'priceCents' && typeof value === 'number') {
    return `¥${Math.round(value / 100).toLocaleString()}`;
  }
  if (field === 'isInKit') return value ? 'キット登録済み' : '未登録';
  return String(value);
};

// ==================== サブコンポーネント ====================

/** ギア参照チップ（クリックでスクロール・ハイライト） */
const GearRefChip: React.FC<{ ref_: GearRef; onClick: (gearId: string) => void }> = ({
  ref_,
  onClick,
}) => (
  <button
    type="button"
    onClick={() => onClick(ref_.gearId)}
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors hover:opacity-80 cursor-pointer"
    style={{
      backgroundColor: alpha(COLORS.gray[700], 0.1),
      color: COLORS.gray[700],
      border: `1px solid ${alpha(COLORS.gray[700], 0.2)}`,
    }}
    title={`${ref_.gearName} にジャンプ`}
  >
    <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
    {ref_.gearName}
  </button>
);

/** 編集提案カード */
const SuggestedEditCard: React.FC<{
  edit: SuggestedEditWithState;
  editKey: string;
  applyingKey: string | null;
  onApply: () => void;
}> = ({ edit, editKey, applyingKey, onApply }) => {
  const isApplied = edit._applied === true;
  const isApplying = applyingKey === editKey;

  return (
    <div
      className="p-3 rounded-xl mt-2"
      style={{
        backgroundColor: isApplied ? COLORS.gray[100] : COLORS.white,
        border: `1px solid ${isApplied ? COLORS.gray[200] : COLORS.gray[300]}`,
        boxShadow: SHADOW,
      }}
    >
      <p className="text-xs font-semibold mb-1" style={{ color: COLORS.text.secondary }}>
        編集提案: {edit.gearName}
      </p>
      <p className="text-xs mb-1" style={{ color: COLORS.text.primary }}>
        <span style={{ color: COLORS.text.secondary }}>{FIELD_LABELS[edit.field] ?? edit.field}: </span>
        <span style={{ textDecoration: 'line-through', color: COLORS.text.secondary }}>
          {formatEditValue(edit.field, edit.currentValue)}
        </span>
        {' → '}
        <span className="font-medium">{formatEditValue(edit.field, edit.suggestedValue)}</span>
      </p>
      <p className="text-xs mb-2" style={{ color: COLORS.text.secondary }}>{edit.reason}</p>
      <button
        disabled={isApplied || isApplying}
        onClick={onApply}
        className="w-full py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: isApplied ? COLORS.gray[400] : COLORS.gray[700],
          color: COLORS.white,
        }}
      >
        {isApplied ? '適用済み' : isApplying ? '適用中...' : '変更を適用'}
      </button>
    </div>
  );
};

// ==================== メインコンポーネント ====================

const GearAdvisorChat: React.FC<GearAdvisorChatProps> = ({
  isOpen,
  onClose,
  gearContext,
  onApplyEdit,
  onFocusGear,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [applyingEdit, setApplyingEdit] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nextMsgId = useRef(1);

  const createMessageId = useCallback(() => {
    const id = `msg-${Date.now()}-${nextMsgId.current}`;
    nextMsgId.current += 1;
    return id;
  }, []);

  // 新しいメッセージが届いたら最下部にスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // パネルを開いたら入力欄にフォーカス
  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 300);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // initメッセージを除いた会話履歴を送信
      const history: AdvisorMessage[] = [...messages.filter((m) => m.id !== 'init'), userMsg].map(
        (m) => ({ role: m.role, content: m.content })
      );
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
          content: `エラーが発生しました：${error instanceof Error ? error.message : '不明なエラー'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, gearContext, createMessageId]);

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

  const totalWeightKg = gearContext.weightBreakdown
    ? (gearContext.weightBreakdown.baseWeight / 1000).toFixed(2)
    : null;

  const scopeLabel = gearContext.packName
    ? `パック「${gearContext.packName}」`
    : `${gearContext.items.length}アイテム`;

  return (
    <div
      className="fixed top-0 right-0 h-full z-40 flex flex-col transition-transform duration-300 ease-in-out"
      style={{
        width: '420px',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        backgroundColor: COLORS.white,
        boxShadow: `-4px 0 16px -2px ${alpha(COLORS.gray[900], 0.15)}`,
      }}
    >
      {/* ヘッダー */}
      <div
        className="flex justify-between items-center shrink-0"
        style={{
          padding: `${SPACING_SCALE.md}px ${SPACING_SCALE.lg}px`,
          borderBottom: `1px solid ${COLORS.gray[200]}`,
          background: `linear-gradient(135deg, ${COLORS.gray[800]} 0%, ${COLORS.gray[700]} 100%)`,
        }}
      >
        <div>
          <h3 className="font-semibold" style={{ fontSize: `${FONT_SCALE.base}px`, color: COLORS.white }}>
            UL ギアアドバイザー
          </h3>
          <p style={{ fontSize: `${FONT_SCALE.sm}px`, color: alpha(COLORS.white, 0.7), marginTop: '2px' }}>
            {scopeLabel}
            {totalWeightKg && ` • ベース ${totalWeightKg}kg`}
            {gearContext.ulStatus && ` • ${gearContext.ulStatus.classification}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-md transition-opacity hover:opacity-70"
          aria-label="アドバイザーを閉じる"
          style={{ color: COLORS.white }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="max-w-[92%]">
              {/* バブル */}
              <div
                className={`p-3 ${message.role === 'user' ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'}`}
                style={{
                  ...(message.role === 'user'
                    ? { backgroundColor: COLORS.gray[700], color: COLORS.white }
                    : { backgroundColor: COLORS.gray[50], color: COLORS.text.primary }),
                  boxShadow: SHADOW,
                  fontSize: `${FONT_SCALE.sm}px`,
                }}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                <div
                  className="text-xs mt-1 opacity-50 select-none"
                  style={{ color: message.role === 'user' ? COLORS.white : COLORS.text.secondary }}
                >
                  {message.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* ギア参照チップ */}
              {message.gearRefs && message.gearRefs.length > 0 && onFocusGear && (
                <div className="flex flex-wrap gap-1.5 mt-2 px-1">
                  {message.gearRefs.map((ref_) => (
                    <GearRefChip
                      key={ref_.gearId}
                      ref_={ref_}
                      onClick={onFocusGear}
                    />
                  ))}
                </div>
              )}

              {/* 編集提案カード */}
              {message.suggestedEdits && message.suggestedEdits.length > 0 && (
                <div className="mt-1 space-y-1.5">
                  {message.suggestedEdits.map((edit, index) => (
                    <SuggestedEditCard
                      key={`${message.id}-${index}`}
                      edit={edit}
                      editKey={`${message.id}-${index}`}
                      applyingKey={applyingEdit}
                      onApply={() => handleApplyEdit(edit, message.id, index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div
              className="p-3 rounded-2xl rounded-bl-sm flex items-center gap-2"
              style={{ backgroundColor: COLORS.gray[50], boxShadow: SHADOW }}
            >
              <div
                className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: COLORS.gray[500] }}
              />
              <span style={{ fontSize: `${FONT_SCALE.sm}px`, color: COLORS.text.secondary }}>
                分析中...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div
        className="shrink-0"
        style={{
          padding: `${SPACING_SCALE.md}px ${SPACING_SCALE.lg}px`,
          borderTop: `1px solid ${COLORS.gray[200]}`,
          backgroundColor: COLORS.gray[50],
        }}
      >
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="ギアについて質問する... (Shift+Enterで改行)"
            disabled={isLoading}
            rows={2}
            className="flex-1 px-3 py-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all disabled:opacity-50"
            style={{
              backgroundColor: COLORS.white,
              boxShadow: SHADOW,
              color: COLORS.text.primary,
              fontSize: `${FONT_SCALE.sm}px`,
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed self-end"
            style={{
              backgroundColor: COLORS.gray[700],
              color: COLORS.white,
              boxShadow: SHADOW,
              fontSize: `${FONT_SCALE.sm}px`,
            }}
          >
            送信
          </button>
        </div>
        <p className="mt-1.5" style={{ color: COLORS.text.secondary, fontSize: `${FONT_SCALE.xs}px` }}>
          例: 「軽量化のアドバイスをください」「Big3の合計重量は？」
        </p>
      </div>
    </div>
  );
};

export default GearAdvisorChat;
