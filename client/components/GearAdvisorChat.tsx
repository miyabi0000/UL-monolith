import React from 'react';
import { GearAdvisorContext, GearRef } from '../services/llmAdvisor';
import { useAdvisorChat, useAdvisorPanel, SuggestedEditWithState } from '../hooks/useAdvisorChat';
import { useIsMobile } from '../hooks/useResponsiveSize';
import { useWeightUnit } from '../contexts/WeightUnitContext';
import { formatWeight, formatWeightLarge } from '../utils/weightUnit';

interface GearAdvisorChatProps {
  isOpen: boolean;
  onClose: () => void;
  gearContext: GearAdvisorContext;
  onApplyEdit: (gearId: string, field: string, value: unknown) => Promise<void>;
  onFocusGear?: (gearId: string) => void;
}

// ==================== 定数 ====================

/** クイックプロンプト定義: よくある質問をワンタップで送信 */
const QUICK_PROMPTS = [
  { icon: '⚡', label: 'Reduce base weight', prompt: 'How can I reduce my base weight? Focus on the heaviest items and suggest specific lighter alternatives.' },
  { icon: '📊', label: 'Analyze Big 3', prompt: 'Analyze my Big 3 (backpack, shelter, sleep system). Are they optimized for ultralight hiking?' },
  { icon: '💰', label: 'Budget alternatives', prompt: 'Suggest more affordable alternatives for my most expensive items without significantly increasing weight.' },
  { icon: '🎒', label: '3-day trip', prompt: 'Optimize my gear list for a 3-day backpacking trip. What can I leave behind?' },
] as const;

const FIELD_LABELS: Record<string, string> = {
  weightGrams: 'Weight',
  priceCents: 'Price',
  priority: 'Priority',
  isInKit: 'In Kit',
  weightClass: 'Weight Class',
};

// ==================== ヘルパー ====================

const TIME_FMT = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });

const formatEditValue = (field: string, value: unknown, weightUnit: 'g' | 'oz' = 'g'): string => {
  if (field === 'weightGrams' && typeof value === 'number') return formatWeight(value, weightUnit);
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
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-badge text-xs font-medium
               bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200
               border border-gray-200 dark:border-gray-600
               hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
  >
    <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
    {ref_.gearName}
  </button>
);

/** 編集提案カード（Apply + Undo 対応） */
const SuggestedEditCard: React.FC<{
  edit: SuggestedEditWithState;
  editKey: string;
  applyingKey: string | null;
  onApply: () => void;
  onUndo: () => void;
  weightUnit: 'g' | 'oz';
}> = ({ edit, editKey, applyingKey, onApply, onUndo, weightUnit }) => {
  const isApplied = edit._applied === true;
  const isBusy = applyingKey === editKey;

  return (
    <div className={`p-3 rounded-md mt-2 shadow-sm border text-xs
                     ${isApplied
                       ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                       : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'}`}>
      <p className="font-semibold mb-1 text-gray-500 dark:text-gray-400">
        Suggestion: {edit.gearName}
      </p>
      <p className="mb-1 text-gray-800 dark:text-gray-200">
        <span className="text-gray-500 dark:text-gray-400">{FIELD_LABELS[edit.field] ?? edit.field}: </span>
        <span className="line-through text-gray-400 dark:text-gray-500">{formatEditValue(edit.field, edit.currentValue, weightUnit)}</span>
        {' → '}
        <span className="font-medium">{formatEditValue(edit.field, edit.suggestedValue, weightUnit)}</span>
      </p>
      <p className="mb-2 text-gray-500 dark:text-gray-400">{edit.reason}</p>

      {isApplied ? (
        <div className="flex gap-2">
          <span className="flex-1 py-1.5 rounded-lg text-xs font-medium text-center
                           bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
            Applied
          </span>
          <button
            type="button"
            disabled={isBusy}
            onClick={onUndo}
            className="px-3 py-1.5 rounded-lg text-xs font-medium
                       text-gray-600 dark:text-gray-300
                       border border-gray-300 dark:border-gray-600
                       hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBusy ? 'Undoing…' : 'Undo'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={isBusy}
          onClick={onApply}
          className="w-full py-1.5 rounded-lg text-xs font-medium transition-opacity
                     hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed
                     bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900"
        >
          {isBusy ? 'Applying…' : 'Apply change'}
        </button>
      )}
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
    isStreaming,
    applyingEdit,
    handleSend,
    sendText,
    handleApplyEdit,
    handleUndoEdit,
  } = useAdvisorChat(gearContext, onApplyEdit);

  const { messagesEndRef, inputRef } = useAdvisorPanel(isOpen, messages);
  const isMobile = useIsMobile();
  const { unit: weightUnit } = useWeightUnit();

  const baseWeightLabel = gearContext.weightBreakdown
    ? formatWeightLarge(gearContext.weightBreakdown.baseWeight, weightUnit)
    : null;

  const scopeLabel = gearContext.packName
    ? `Pack: ${gearContext.packName}`
    : `${gearContext.items.length} items`;

  // 最後のアシスタントメッセージID（ストリーミングカーソル表示用）
  const lastAssistantId = messages.filter((m) => m.role === 'assistant').at(-1)?.id;

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-[39] bg-black/30 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      <div
        className="fixed top-0 right-0 h-full z-40 flex flex-col
                   bg-white dark:bg-gray-900
                   border-l border-gray-200 dark:border-gray-700
                   shadow-xl
                   transition-transform duration-300 ease-in-out"
        style={{ width: isMobile ? '100%' : '420px', transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0
                      bg-white dark:bg-gray-800
                      border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            UL Gear Advisor
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {scopeLabel}
            {baseWeightLabel && ` · Base ${baseWeightLabel}`}
            {gearContext.ulStatus && ` · ${gearContext.ulStatus.classification}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close advisor"
          className="glass-header-chip h-8 w-8 inline-flex items-center justify-center
                     text-gray-500 dark:text-gray-400
                     hover:bg-white dark:hover:bg-gray-700 transition-colors"
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
                                 ? 'rounded-lg rounded-br-sm bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                                 : 'rounded-lg rounded-bl-sm bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700'}`}>
                <div className="whitespace-pre-wrap">
                  {message.content}
                  {/* ストリーミング中のブリンクカーソル */}
                  {isStreaming && message.id === lastAssistantId && (
                    <span className="inline-block w-0.5 h-3.5 ml-0.5 bg-gray-500 dark:bg-gray-400 animate-pulse align-text-bottom" />
                  )}
                </div>
                {/* タイムスタンプ（空メッセージのストリーミング中は非表示） */}
                {message.content && (
                  <div className={`text-2xs mt-1 opacity-50 select-none
                                   ${message.role === 'user' ? 'text-right' : ''}`}>
                    {TIME_FMT.format(message.timestamp)}
                  </div>
                )}
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
                      onUndo={() => handleUndoEdit(edit, message.id, index)}
                      weightUnit={weightUnit}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 最初のトークン待ちスピナー（ストリーミング開始前のみ） */}
        {isLoading && !isStreaming && (
          <div className="flex justify-start">
            <div className="p-3 rounded-lg rounded-bl-sm flex items-center gap-2
                            bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-400 dark:border-gray-500 border-t-transparent animate-spin" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Analyzing…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className="shrink-0 px-4 py-3
                      bg-white dark:bg-gray-800
                      border-t border-gray-200 dark:border-gray-700">
        {/* クイックプロンプトボタン */}
        <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1 scrollbar-thin">
          {QUICK_PROMPTS.map((qp) => (
            <button
              key={qp.label}
              type="button"
              disabled={isLoading}
              onClick={() => sendText(qp.prompt)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
                         whitespace-nowrap shrink-0
                         bg-white dark:bg-gray-700
                         text-gray-700 dark:text-gray-200
                         border border-gray-200 dark:border-gray-600
                         hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all"
            >
              <span>{qp.icon}</span>
              <span>{qp.label}</span>
            </button>
          ))}
        </div>
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
                       bg-white dark:bg-gray-900
                       text-gray-800 dark:text-gray-100
                       border border-gray-200 dark:border-gray-600
                       placeholder:text-gray-400 dark:placeholder:text-gray-500
                       focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-400
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
        <p className="mt-1.5 text-2xs text-gray-400 dark:text-gray-500">
          e.g. "How can I reduce my base weight?" · "What's my Big 3 total?"
        </p>
      </div>
      </div>
    </>
  );
};

export default GearAdvisorChat;
