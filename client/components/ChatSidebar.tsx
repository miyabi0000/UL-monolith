import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  extractFromPrompt,
  enhanceUrlDataWithPrompt,
  extractFromUrl,
  APIError,
} from '../services/llmService';
import { useWeightUnit } from '../contexts/WeightUnitContext';
import { formatWeight, formatWeightLarge } from '../utils/weightUnit';
import { formatPrice } from '../utils/formatters';
import { useIsMobile } from '../hooks/useResponsiveSize';
import { useOutsideClick } from '../hooks/useOutsideClick';
import { useAdvisorChat, useAdvisorPanel, SuggestedEditWithState } from '../hooks/useAdvisorChat';
import type { GearAdvisorContext, GearRef } from '../services/llmAdvisor';
import type { AdvisorSession } from '../services/advisorSessionsApi';
import CompactComparisonPanel from './CompactComparisonPanel';

/**
 * ChatSidebar — 1 本化された AI チャットサイドバー
 *
 * Chat は Advisor パイプライン（SSE / DB 永続化 / suggestedEdits / gearRefs）で統一。
 * 入力欄左の「+」から Import gear / Compare を呼び出す。
 * Compare を押すと現在スコープのギアをピックし、チャット内にミニ比較パネルが挿入される。
 */

// ==================== 共通定義 ====================

type InputMode = 'chat' | 'import' | 'compare';

type PromptType = 'url' | 'add_gear' | 'url_with_prompt' | 'multiple_urls' | 'general';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** Import gear: LLM 抽出結果を親にコールバック（親で DB 保存 + 通知） */
  onGearExtracted?: (gearData: any) => void;
  categories?: any[];
  existingItemCount?: number;
  /** Advisor: コンテキスト / 編集 apply / gear ジャンプ */
  advisorContext?: GearAdvisorContext;
  onApplyEdit?: (gearId: string, field: string, value: unknown) => Promise<void>;
  onFocusGear?: (gearId: string) => void;
  /** Import の進捗・エラーを親の通知システムに流すコールバック */
  onNotify?: (type: 'success' | 'error' | 'info', message: string) => void;
  /**
   * FloatingChatInput から届いた初回プロンプト。
   * nonce で同一テキストの連続送信を別イベントとして扱う。
   */
  initialAdvisorPrompt?: { text: string; nonce: number } | null;
  /** initialAdvisorPrompt を消費したら呼ぶ */
  onAdvisorPromptConsumed?: () => void;
}

const TIME_FMT = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });

/** 履歴ドロップダウン用の相対時間表記 */
const formatRelativeTime = (iso: string): string => {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diffSec = Math.max(0, (Date.now() - t) / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d`;
  return new Date(iso).toLocaleDateString();
};

// ==================== Import helpers ====================

const extractMultipleUrls = (text: string): string[] => {
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlRegex) || [];
  return [...new Set(urls)];
};

const BRAND_PATTERNS = [
  "Arc'teryx", 'Patagonia', 'Montbell', 'REI', 'Osprey', 'Deuter', 'Gregory',
  'The North Face', 'Marmot', 'Mountain Hardwear', 'Outdoor Research', 'Black Diamond',
  'Petzl', 'MSR', 'Jetboil', 'Platypus', 'Hydro Flask', 'Nalgene', 'Merrell',
  'Salomon', 'Altra', 'Hoka', 'La Sportiva', 'Scarpa', 'Mammut', 'Rab',
  'Western Mountaineering', 'Big Agnes', 'Sea to Summit', 'Therm-a-Rest', 'NEMO',
  'Zpacks', 'Hyperlite Mountain Gear', 'Gossamer Gear', 'Six Moon Designs',
];
const containsBrand = (prompt: string): boolean =>
  BRAND_PATTERNS.some((brand) => prompt.toLowerCase().includes(brand.toLowerCase()));

const classifyImportPrompt = (prompt: string): PromptType => {
  const urls = extractMultipleUrls(prompt);
  if (urls.length > 1) return 'multiple_urls';
  if (urls.length === 1 && prompt.length > urls[0].length + 10) return 'url_with_prompt';
  if (urls.length === 1 && /^https?:\/\/.+$/.test(prompt.trim())) return 'url';
  if (containsBrand(prompt)) return 'add_gear';
  return 'general';
};

// ==================== Advisor サブコンポーネント ====================

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

const formatEditValue = (field: string, value: unknown, weightUnit: 'g' | 'oz' = 'g'): string => {
  if (field === 'weightGrams' && typeof value === 'number') return formatWeight(value, weightUnit);
  if (field === 'priceCents' && typeof value === 'number') return formatPrice(value);
  if (field === 'isInKit') return value ? 'In kit' : 'Not in kit';
  return String(value);
};

const GearRefChip: React.FC<{ ref_: GearRef; onClick: (gearId: string) => void }> = ({
  ref_,
  onClick,
}) => (
  <button
    type="button"
    onClick={() => onClick(ref_.gearId)}
    title={`Jump to ${ref_.gearName}`}
    className="glass-header-chip h-badge px-2 gap-1 text-xs font-medium"
    style={{ color: 'var(--ink-secondary)' }}
  >
    <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
    {ref_.gearName}
  </button>
);

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
    <div className="card p-3 mt-2 text-xs">
      <p className="font-semibold mb-1" style={{ color: 'var(--ink-muted)' }}>
        Suggestion: {edit.gearName}
      </p>
      <p className="mb-1" style={{ color: 'var(--ink-primary)' }}>
        <span style={{ color: 'var(--ink-muted)' }}>{FIELD_LABELS[edit.field] ?? edit.field}: </span>
        <span className="line-through" style={{ color: 'var(--ink-disabled)' }}>{formatEditValue(edit.field, edit.currentValue, weightUnit)}</span>
        {' → '}
        <span className="font-medium">{formatEditValue(edit.field, edit.suggestedValue, weightUnit)}</span>
      </p>
      <p className="mb-2" style={{ color: 'var(--ink-muted)' }}>{edit.reason}</p>
      {isApplied ? (
        <div className="flex items-center gap-2">
          <span
            className="flex-1 inline-flex items-center justify-center h-badge rounded-badge text-2xs font-medium uppercase tracking-wide"
            style={{ background: 'var(--surface-level-2)', color: 'var(--ink-muted)' }}
          >
            Applied
          </span>
          <button
            type="button"
            disabled={isBusy}
            onClick={onUndo}
            className="btn-secondary btn-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBusy ? 'Undoing…' : 'Undo'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={isBusy}
          onClick={onApply}
          className="btn-primary btn-xs w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isBusy ? 'Applying…' : 'Apply change'}
        </button>
      )}
    </div>
  );
};

// ==================== メインコンポーネント ====================

const FALLBACK_ADVISOR_CONTEXT: GearAdvisorContext = {
  items: [],
  weightBreakdown: null,
  ulStatus: null,
  packName: null,
};

const noopApplyEdit = async () => { /* no-op: onApplyEdit 未指定時の placeholder */ };

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onClose,
  onGearExtracted,
  categories = [],
  existingItemCount = 0,
  advisorContext,
  onApplyEdit,
  onFocusGear,
  onNotify,
  initialAdvisorPrompt,
  onAdvisorPromptConsumed,
}) => {
  const { unit: weightUnit } = useWeightUnit();
  const isMobile = useIsMobile();

  // --- Advisor hook ---
  const advisor = useAdvisorChat(
    advisorContext ?? FALLBACK_ADVISOR_CONTEXT,
    onApplyEdit ?? noopApplyEdit,
  );
  const { messagesEndRef, inputRef } = useAdvisorPanel(isOpen, advisor.messages);
  const advisorLastAssistantId = advisor.messages.filter((m) => m.role === 'assistant').at(-1)?.id;

  // --- 入力モード ---
  const [inputMode, setInputMode] = useState<InputMode>('chat');
  const [importText, setImportText] = useState('');
  const [importBusy, setImportBusy] = useState(false);
  const [compareSelection, setCompareSelection] = useState<Set<string>>(() => new Set());

  // --- + ポップオーバー ---
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(plusMenuRef, () => setPlusMenuOpen(false), plusMenuOpen);

  // --- 履歴ドロップダウン ---
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySessions, setHistorySessions] = useState<AdvisorSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);
  useOutsideClick(historyRef, () => setHistoryOpen(false), historyOpen);

  // advisor オブジェクト全体を依存に取ると毎レンダー再 fetch されてしまうため、
  // 安定参照の listSessions だけを抜き出して依存に置く。
  const advisorListSessions = advisor.listSessions;
  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const list = await advisorListSessions(20);
      setHistorySessions(list);
    } finally {
      setHistoryLoading(false);
    }
  }, [advisorListSessions]);

  // 履歴ドロップダウンを開いたら一覧をフェッチ
  useEffect(() => {
    if (historyOpen) void refreshHistory();
  }, [historyOpen, refreshHistory]);

  // サイドバーが閉じたらモードをリセット
  useEffect(() => {
    if (!isOpen) {
      setPlusMenuOpen(false);
      setHistoryOpen(false);
      setInputMode('chat');
      setImportText('');
      setCompareSelection(new Set());
    }
  }, [isOpen]);

  const gearItemsForCompare = advisorContext?.items ?? [];
  const itemsById = useMemo(() => {
    const map = new Map(gearItemsForCompare.map((item) => [item.id, item]));
    return map;
  }, [gearItemsForCompare]);

  // FloatingChatInput からの初回プロンプトを Advisor に自動送信。
  // nonce で同じテキストの再送も別イベント扱いし、同一 nonce は二重送信しない。
  const lastConsumedNonceRef = useRef<number | null>(null);
  const advisorReady = !!advisorContext && !!onApplyEdit;
  useEffect(() => {
    if (!isOpen || !initialAdvisorPrompt || !advisorReady) return;
    if (lastConsumedNonceRef.current === initialAdvisorPrompt.nonce) return;
    lastConsumedNonceRef.current = initialAdvisorPrompt.nonce;
    void advisor.sendText(initialAdvisorPrompt.text);
    onAdvisorPromptConsumed?.();
  }, [isOpen, initialAdvisorPrompt, advisorReady, advisor, onAdvisorPromptConsumed]);

  // ==================== Import 送信 ====================

  const runImport = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || importBusy) return;
    setImportBusy(true);
    const promptType = classifyImportPrompt(trimmed);
    try {
      if (promptType === 'url') {
        const data = await extractFromUrl(trimmed, categories);
        const matchedCategory = categories.find((cat) => cat.name === data.suggestedCategory);
        onGearExtracted?.({
          name: data.name, brand: data.brand, productUrl: trimmed,
          categoryId: matchedCategory?.id, requiredQuantity: 1, ownedQuantity: 0,
          weightGrams: data.weightGrams, priceCents: data.priceCents,
          season: '', priority: 3,
        });
        onNotify?.('success', `Imported: ${data.name}`);
      } else if (promptType === 'url_with_prompt') {
        const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/);
        if (!urlMatch) {
          onNotify?.('error', 'URL not detected');
          return;
        }
        const url = urlMatch[1];
        const urlData = await extractFromUrl(url, categories);
        const enhanced = await enhanceUrlDataWithPrompt(urlData, trimmed);
        const matchedCategory = categories.find((cat) => cat.name === enhanced.suggestedCategory);
        onGearExtracted?.({
          name: enhanced.name, brand: enhanced.brand, productUrl: url,
          categoryId: matchedCategory?.id, requiredQuantity: 1, ownedQuantity: 0,
          weightGrams: enhanced.weightGrams, priceCents: enhanced.priceCents,
          season: '', priority: 3,
        });
        onNotify?.('success', `Imported: ${enhanced.name}`);
      } else if (promptType === 'multiple_urls') {
        const urls = extractMultipleUrls(trimmed);
        const results = await Promise.allSettled(urls.map((u) => extractFromUrl(u, categories)));
        let okCount = 0;
        results.forEach((r, idx) => {
          if (r.status !== 'fulfilled') return;
          const data = r.value;
          const isFallback = data.source === 'fallback' ||
            !data.name || data.name.includes('Failed') || data.name.includes('Product from');
          if (isFallback) return;
          const matchedCategory = categories.find((cat) => cat.name === data.suggestedCategory);
          onGearExtracted?.({
            name: data.name, brand: data.brand, productUrl: urls[idx],
            imageUrl: data.imageUrl, categoryId: matchedCategory?.id,
            requiredQuantity: 1, ownedQuantity: 0,
            weightGrams: data.weightGrams, priceCents: data.priceCents,
            season: '', priority: 3,
          });
          okCount += 1;
        });
        if (okCount > 0) onNotify?.('success', `Imported ${okCount} item${okCount > 1 ? 's' : ''}`);
        if (okCount < urls.length) onNotify?.('error', `${urls.length - okCount} of ${urls.length} URLs could not be parsed`);
      } else if (promptType === 'add_gear') {
        const data = await extractFromPrompt(trimmed, categories);
        const matchedCategory = categories.find((cat) => cat.name === data.suggestedCategory);
        onGearExtracted?.({
          name: data.name, brand: data.brand, productUrl: '',
          categoryId: matchedCategory?.id, requiredQuantity: 1, ownedQuantity: 0,
          weightGrams: data.weightGrams, priceCents: data.priceCents,
          season: '', priority: 3,
        });
        onNotify?.('success', `Imported: ${data.name}`);
      } else {
        onNotify?.('error', 'Paste a product URL or type "Brand + Product name"');
        return;
      }
      setImportText('');
      setInputMode('chat');
    } catch (err) {
      const msg = err instanceof APIError
        ? err.message
        : err instanceof Error ? err.message : 'Import failed';
      onNotify?.('error', `Import error: ${msg}`);
    } finally {
      setImportBusy(false);
    }
  };

  // ==================== Compare 送信 ====================

  const handleCompareSubmit = () => {
    if (compareSelection.size < 2) return;
    advisor.appendComparison([...compareSelection]);
    setCompareSelection(new Set());
    setInputMode('chat');
  };

  const toggleCompareSelect = (id: string) => {
    setCompareSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  };

  const exitSubMode = () => {
    setInputMode('chat');
    setImportText('');
    setCompareSelection(new Set());
  };

  // ==================== Header 情報 ====================
  const advisorHeaderInfo = useMemo(() => {
    if (!advisorContext) return null;
    const scope = advisorContext.packName
      ? `Pack: ${advisorContext.packName}`
      : `${advisorContext.items.length} items`;
    const base = advisorContext.weightBreakdown
      ? ` · Base ${formatWeightLarge(advisorContext.weightBreakdown.baseWeight, weightUnit)}`
      : '';
    const ul = advisorContext.ulStatus ? ` · ${advisorContext.ulStatus.classification}` : '';
    return `${scope}${base}${ul}`;
  }, [advisorContext, weightUnit]);

  // ==================== Input: キー操作 ====================
  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputMode === 'import') void runImport(importText);
      else advisor.handleSend();
    }
  };

  const canCompare = gearItemsForCompare.length >= 2;

  // ==================== Render ====================
  // 右側スライドイン: デスクトップは 400px 固定、モバイルはフル幅 + backdrop。
  // PacksPage 側で開放時に `paddingRight: 400px` のガターを確保して本体を縮める。
  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-[39] bg-black/30 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className="fixed top-0 right-0 h-full z-40 flex flex-col
                   transition-transform duration-300 ease-in-out"
        style={{
          width: isMobile ? '100%' : '400px',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          background: 'var(--surface-level-0)',
          borderLeft: 'var(--border-default)',
          boxShadow: 'var(--shadow-lg)',
        }}
        aria-label="Gear chat assistant"
      >
        {/* ヘッダー */}
        <div
          className="flex items-center justify-between px-3 py-2 shrink-0"
          style={{ background: 'var(--surface-level-0)', borderBottom: 'var(--border-divider)' }}
        >
          <div
            className="inline-flex items-center h-control px-3 text-sm font-semibold"
            style={{ color: 'var(--ink-primary)' }}
          >
            AI Chat
          </div>
          <div className="flex items-center gap-1">
            {/* History ドロップダウン */}
            <div className="relative" ref={historyRef}>
              <button
                type="button"
                onClick={() => setHistoryOpen((v) => !v)}
                aria-label="Chat history"
                aria-expanded={historyOpen}
                title="History"
                className="icon-btn"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
                </svg>
              </button>
              {historyOpen && (
                <div
                  role="menu"
                  className="card absolute right-0 top-full mt-1 w-72 max-h-[60vh] overflow-y-auto z-20"
                  style={{ borderRadius: 'var(--radius-control)', boxShadow: 'var(--shadow-lg)' }}
                >
                  {/* 新規チャット */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { advisor.startNewSession(); setHistoryOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors"
                    style={{ color: 'var(--ink-primary)', borderBottom: 'var(--border-divider)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-level-1)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <span className="font-medium">+ New chat</span>
                  </button>
                  {historyLoading && (
                    <div className="px-3 py-3 text-xs" style={{ color: 'var(--ink-muted)' }}>
                      Loading…
                    </div>
                  )}
                  {!historyLoading && historySessions.length === 0 && (
                    <div className="px-3 py-3 text-xs" style={{ color: 'var(--ink-muted)' }}>
                      No past sessions yet
                    </div>
                  )}
                  {!historyLoading && historySessions.map((s) => {
                    const active = advisor.currentSessionId === s.id;
                    return (
                      <div
                        key={s.id}
                        role="menuitem"
                        className="group flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors"
                        style={{
                          color: 'var(--ink-primary)',
                          background: active ? 'var(--surface-level-1)' : 'transparent',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-level-1)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = active ? 'var(--surface-level-1)' : 'transparent'; }}
                        onClick={() => { void advisor.loadSession(s.id); setHistoryOpen(false); }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{s.title || 'Untitled'}</div>
                          <div className="text-2xs" style={{ color: 'var(--ink-muted)' }}>
                            {formatRelativeTime(s.updated_at)}
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-label={`Delete ${s.title || 'session'}`}
                          title="Delete"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await advisor.removeSession(s.id);
                            await refreshHistory();
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 inline-flex items-center justify-center rounded-control shrink-0"
                          style={{ color: 'var(--ink-muted)' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-primary)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-muted)'; }}
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close chat"
              className="icon-btn"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* サブヘッダー */}
        <div
          className="px-4 py-2 shrink-0 text-xs"
          style={{ color: 'var(--ink-muted)', borderBottom: 'var(--border-divider)' }}
        >
          {advisorHeaderInfo ?? (existingItemCount > 0
            ? `${existingItemCount} items in your list`
            : 'No gear yet — add with + → Import')}
        </div>

        {/* メッセージ一覧 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {advisor.messages.map((message) => {
            // 比較パネルメッセージ
            if (message.comparison) {
              const items = message.comparison.itemIds
                .map((id) => itemsById.get(id))
                .filter((x): x is NonNullable<typeof x> => !!x);
              if (items.length < 2) return null;
              return (
                <div key={message.id} className="flex justify-start">
                  <div className="max-w-[92%] w-full">
                    <CompactComparisonPanel
                      items={items}
                      weightUnit={weightUnit}
                      onFocusGear={onFocusGear}
                    />
                  </div>
                </div>
              );
            }

            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[92%]">
                  <div
                    className={`has-noise p-3 text-xs leading-relaxed rounded-control ${isUser ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                    data-noise={isUser ? 'control' : undefined}
                    style={isUser
                      ? { background: 'var(--mondrian-black)', color: 'var(--ink-inverse)' }
                      : { background: 'var(--surface-level-1)', color: 'var(--ink-primary)', border: 'var(--border-divider)' }
                    }
                  >
                    <div className="whitespace-pre-wrap">
                      {message.content}
                      {advisor.isStreaming && message.id === advisorLastAssistantId && (
                        <span
                          className="inline-block w-0.5 h-3.5 ml-0.5 animate-pulse align-text-bottom"
                          style={{ background: 'currentColor' }}
                        />
                      )}
                    </div>
                    {message.content && (
                      <div
                        className={`text-2xs mt-1 select-none ${isUser ? 'text-right' : ''}`}
                        style={{ color: isUser ? 'var(--ink-inverse)' : 'var(--ink-muted)', opacity: isUser ? 0.6 : 1 }}
                      >
                        {TIME_FMT.format(message.timestamp)}
                      </div>
                    )}
                  </div>

                  {message.gearRefs && message.gearRefs.length > 0 && onFocusGear && (
                    <div className="flex flex-wrap gap-1.5 mt-2 px-1">
                      {message.gearRefs.map((ref_) => (
                        <GearRefChip key={ref_.gearId} ref_={ref_} onClick={onFocusGear} />
                      ))}
                    </div>
                  )}

                  {message.suggestedEdits && message.suggestedEdits.length > 0 && (
                    <div className="mt-1 space-y-1.5">
                      {message.suggestedEdits.map((edit, index) => (
                        <SuggestedEditCard
                          key={`${message.id}-${index}`}
                          edit={edit}
                          editKey={`${message.id}-${index}`}
                          applyingKey={advisor.applyingEdit}
                          onApply={() => advisor.handleApplyEdit(edit, message.id, index)}
                          onUndo={() => advisor.handleUndoEdit(edit, message.id, index)}
                          weightUnit={weightUnit}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {advisor.isLoading && !advisor.isStreaming && (
            <div className="flex justify-start">
              <div
                className="has-noise p-3 rounded-control rounded-bl-sm flex items-center gap-2"
                style={{ background: 'var(--surface-level-1)', border: 'var(--border-divider)' }}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'var(--ink-muted)', borderTopColor: 'transparent' }}
                />
                <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>Analyzing…</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <div
          className="shrink-0 px-4 py-3"
          style={{ background: 'var(--surface-level-0)', borderTop: 'var(--border-divider)' }}
        >
          {/* Compare picker overlay */}
          {inputMode === 'compare' && (
            <div className="card mb-2 overflow-hidden">
              <div
                className="flex items-center justify-between px-3 h-control text-xs"
                style={{ borderBottom: 'var(--border-divider)' }}
              >
                <span className="font-medium" style={{ color: 'var(--ink-primary)' }}>
                  Select items to compare ({compareSelection.size}/4)
                </span>
                <button
                  type="button"
                  onClick={exitSubMode}
                  className="transition-colors"
                  style={{ color: 'var(--ink-muted)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-primary)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-muted)'; }}
                >
                  Cancel
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {gearItemsForCompare.length === 0 && (
                  <div className="px-3 py-3 text-xs" style={{ color: 'var(--ink-muted)' }}>
                    No items to compare.
                  </div>
                )}
                {gearItemsForCompare.map((item) => {
                  const checked = compareSelection.has(item.id);
                  const atLimit = compareSelection.size >= 4 && !checked;
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer transition-colors
                                  ${atLimit ? 'opacity-40 cursor-not-allowed' : ''}`}
                      style={atLimit ? undefined : { color: 'var(--ink-primary)' }}
                      onMouseEnter={atLimit ? undefined : (e) => { (e.currentTarget as HTMLLabelElement).style.background = 'var(--surface-level-1)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLLabelElement).style.background = 'transparent'; }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={atLimit}
                        onChange={() => toggleCompareSelect(item.id)}
                        className="h-3.5 w-3.5 rounded-control"
                        style={{ accentColor: 'var(--mondrian-black)' }}
                      />
                      <span className="flex-1 truncate">{item.name}</span>
                      <span className="shrink-0 tabular-nums" style={{ color: 'var(--ink-muted)' }}>
                        {typeof item.weightGrams === 'number' ? formatWeight(item.weightGrams, weightUnit) : '—'}
                      </span>
                    </label>
                  );
                })}
              </div>
              <div
                className="px-3 py-2 flex justify-end"
                style={{ borderTop: 'var(--border-divider)' }}
              >
                <button
                  type="button"
                  disabled={compareSelection.size < 2}
                  onClick={handleCompareSubmit}
                  className="btn-primary btn-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Compare ({compareSelection.size})
                </button>
              </div>
            </div>
          )}

          {/* Import mode header */}
          {inputMode === 'import' && (
            <div className="mb-2 flex items-center justify-between text-xs" style={{ color: 'var(--ink-secondary)' }}>
              <span className="font-medium">Import gear — paste URL or describe</span>
              <button
                type="button"
                onClick={exitSubMode}
                style={{ color: 'var(--ink-muted)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-primary)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-muted)'; }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Quick prompts (chat mode only) */}
          {inputMode === 'chat' && (
            <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1 scrollbar-thin">
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp.label}
                  type="button"
                  disabled={advisor.isLoading}
                  onClick={() => advisor.sendText(qp.prompt)}
                  className="glass-header-chip h-control px-3 gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ color: 'var(--ink-secondary)' }}
                >
                  <span>{qp.icon}</span>
                  <span>{qp.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input row — compare mode では入力欄を隠す */}
          {inputMode !== 'compare' && (
            <div className="flex items-end gap-2">
              {/* + ボタン + ポップオーバー */}
              <div className="relative" ref={plusMenuRef}>
                <button
                  type="button"
                  onClick={() => setPlusMenuOpen((v) => !v)}
                  aria-label="Open attach menu"
                  aria-expanded={plusMenuOpen}
                  disabled={importBusy || advisor.isLoading}
                  className="icon-btn disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                {plusMenuOpen && (
                  <div
                    role="menu"
                    className="card absolute bottom-full left-0 mb-1 w-44 overflow-hidden z-10"
                    style={{ borderRadius: 'var(--radius-control)', boxShadow: 'var(--shadow-md)' }}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setInputMode('import'); setPlusMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors"
                      style={{ color: 'var(--ink-primary)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-level-1)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      <span>🔗</span>
                      <span>Import gear</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={!canCompare}
                      onClick={() => { setInputMode('compare'); setPlusMenuOpen(false); }}
                      title={canCompare ? 'Compare gear items' : 'Need at least 2 items to compare'}
                      className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ color: 'var(--ink-primary)' }}
                      onMouseEnter={canCompare ? (e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-level-1)'; } : undefined}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      <span>⚖</span>
                      <span>Compare</span>
                    </button>
                  </div>
                )}
              </div>

              <textarea
                ref={inputRef}
                value={inputMode === 'import' ? importText : advisor.input}
                onChange={(e) => (
                  inputMode === 'import'
                    ? setImportText(e.target.value)
                    : advisor.setInput(e.target.value)
                )}
                onKeyDown={handleChatKeyDown}
                placeholder={inputMode === 'import'
                  ? 'Paste URL or describe gear (Enter to import)'
                  : 'Ask about your gear… (Shift+Enter for new line)'}
                disabled={importBusy || advisor.isLoading}
                rows={2}
                className="flex-1 px-3 py-2 text-xs rounded-control resize-none focus:outline-none disabled:opacity-50"
                style={{
                  background: 'var(--surface-level-0)',
                  color: 'var(--ink-primary)',
                  border: '1px solid var(--stroke-subtle)',
                }}
              />

              <button
                type="button"
                onClick={() => (inputMode === 'import' ? runImport(importText) : advisor.handleSend())}
                disabled={
                  inputMode === 'import'
                    ? (!importText.trim() || importBusy)
                    : (!advisor.input.trim() || advisor.isLoading)
                }
                className="btn-primary h-control px-4 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {inputMode === 'import' ? (importBusy ? 'Importing…' : 'Import') : 'Send'}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default ChatSidebar;
