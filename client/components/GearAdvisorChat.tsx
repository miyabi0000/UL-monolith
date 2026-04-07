import React from 'react';
import { GearAdvisorContext, SuggestedEdit, GearRef } from '../services/llmAdvisor';
import { useAdvisorChat, useAdvisorPanel, SuggestedEditWithState } from '../hooks/useAdvisorChat';
import { useResponsiveSize } from '../hooks/useResponsiveSize';

interface GearAdvisorChatProps {
  isOpen: boolean;
  onClose: () => void;
  gearContext: GearAdvisorContext;
  onApplyEdit: (gearId: string, field: string, value: unknown) => Promise<void>;
  onFocusGear?: (gearId: string) => void;
}

// ==================== 定数 ====================

const FIELD_LABELS: Record<string, string> = {
  weightGrams: 'Weight',
  priceCents: 'Price',
  priority: 'Priority',
  isInKit: 'In Kit',
  weightClass: 'Weight Class',
};

// ==================== ヘルパー ====================

const formatEditValue = (field: string, value: unknown): string => {
  if (field === 'weightGrams') return `${value}g`;
  if (field === 'priceCents' && typeof value === 'number') {
    return `¥${Math.round(value / 100).toLocaleString()}`;
  }
  if (field === 'isInKit') return value ? 'In kit' : 'Not in kit';
  return String(value);
};

// ==================== サブコンポーネント ====================

/** ギア参照チップ: クリックでリスト内の対象行にスクロール */
const GearRefChip: React.FC<{ ref_: GearRef; onClick: (gearId: string) => void }> = ({
  ref_,
  onClick,
}) => (
  <button
    type="button"
    onClick={() => onClick(ref_.gearId)}
    title={`Jump to ${ref_.gearName}`}
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium
               bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200
               border border-gray-200 dark:border-slate-600
               hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
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
    <div className={`p-3 rounded-xl mt-2 shadow-sm border text-xs
                     ${isApplied
                       ? 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                       : 'bg-white dark:bg-slate-800/80 border-gray-200 dark:border-slate-600'}`}>
      <p className="font-semibold mb-1 text-gray-500 dark:text-gray-400">
        Suggestion: {edit.gearName}
      </p>
      <p className="mb-1 text-gray-800 dark:text-gray-200">
        <span className="text-gray-500 dark:text-gray-400">{FIELD_LABELS[edit.field] ?? edit.field}: </span>
        <span className="line-through text-gray-400 dark:text-gray-500">{formatEditValue(edit.field, edit.currentValue)}</span>
        {' → '}
        <span className="font-medium">{formatEditValue(edit.field, edit.suggestedValue)}</span>
      </p>
      <p className="mb-2 text-gray-500 dark:text-gray-400">{edit.reason}</p>
      <button
        disabled={isApplied || isApplying}
        onClick={onApply}
        className={`w-full py-1.5 rounded-lg text-xs font-medium transition-opacity
                    hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed
                    ${isApplied
                      ? 'bg-gray-300 dark:bg-slate-600 text-gray-600 dark:text-gray-300'
                      : 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'}`}
      >
        {isApplied ? 'Applied' : isApplying ? 'Applying…' : 'Apply change'}
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
  const {
    messages,
    input,
    setInput,
    isLoading,
    applyingEdit,
    handleSend,
    handleApplyEdit,
  } = useAdvisorChat(gearContext, onApplyEdit);

  const { messagesEndRef, inputRef } = useAdvisorPanel(isOpen, messages);
  const screenSize = useResponsiveSize();
  const isMobile = screenSize === 'mobile';

  const totalWeightKg = gearContext.weightBreakdown
    ? (gearContext.weightBreakdown.baseWeight / 1000).toFixed(2)
    : null;

  const scopeLabel = gearContext.packName
    ? `Pack: ${gearContext.packName}`
    : `${gearContext.items.length} items`;

  return (
    <>
      {/* モバイル用背景スクリム */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-[39] bg-black/30 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      <div
        className="fixed top-0 right-0 h-full z-40 flex flex-col
                   bg-white/92 dark:bg-slate-900/95 backdrop-blur
                   border-l border-gray-200 dark:border-slate-700
                   shadow-xl
                   transition-transform duration-300 ease-in-out"
        style={{ width: isMobile ? '100%' : '420px', transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0
                      bg-white/80 dark:bg-slate-800/80 backdrop-blur
                      border-b border-gray-200 dark:border-slate-700">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            UL Gear Advisor
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            {scopeLabel}
            {totalWeightKg && ` · Base ${totalWeightKg}kg`}
            {gearContext.ulStatus && ` · ${gearContext.ulStatus.classification}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close advisor"
          className="glass-header-chip h-8 w-8 inline-flex items-center justify-center
                     text-gray-500 dark:text-gray-400
                     hover:bg-white/70 dark:hover:bg-slate-700/60 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <div className={`p-3 text-xs leading-relaxed shadow-sm
                               ${message.role === 'user'
                                 ? 'rounded-2xl rounded-br-sm bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                                 : 'rounded-2xl rounded-bl-sm bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-slate-700'}`}>
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className={`text-[10px] mt-1 opacity-50 select-none
                                 ${message.role === 'user' ? 'text-right' : ''}`}>
                  {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Gear reference chips */}
              {message.gearRefs && message.gearRefs.length > 0 && onFocusGear && (
                <div className="flex flex-wrap gap-1.5 mt-2 px-1">
                  {message.gearRefs.map((ref_) => (
                    <GearRefChip key={ref_.gearId} ref_={ref_} onClick={onFocusGear} />
                  ))}
                </div>
              )}

              {/* Edit suggestion cards */}
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
            <div className="p-3 rounded-2xl rounded-bl-sm flex items-center gap-2
                            bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-400 dark:border-gray-500 border-t-transparent animate-spin" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Analyzing…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className="shrink-0 px-4 py-3
                      bg-white/80 dark:bg-slate-800/80 backdrop-blur
                      border-t border-gray-200 dark:border-slate-700">
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
            placeholder="Ask about your gear… (Shift+Enter for new line)"
            disabled={isLoading}
            rows={2}
            className="flex-1 px-3 py-2 text-xs rounded-lg resize-none
                       bg-white dark:bg-slate-900
                       text-gray-800 dark:text-gray-100
                       border border-gray-200 dark:border-slate-600
                       placeholder:text-gray-400 dark:placeholder:text-gray-500
                       focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-slate-400
                       disabled:opacity-50 transition-all"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-3 py-2 rounded-lg text-xs font-medium self-end
                       bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900
                       hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            Send
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-gray-400 dark:text-gray-500">
          e.g. "How can I reduce my base weight?" · "What's my Big 3 total?"
        </p>
      </div>
      </div>
    </>
  );
};

export default GearAdvisorChat;
