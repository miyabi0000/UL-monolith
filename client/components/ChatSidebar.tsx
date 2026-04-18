import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  extractFromPrompt,
  enhanceUrlDataWithPrompt,
  extractCategoryFromPrompt,
  extractFromUrl,
  APIError,
} from '../services/llmService';
import { useWeightUnit } from '../contexts/WeightUnitContext';
import { formatWeight, formatWeightLarge } from '../utils/weightUnit';
import { formatPrice } from '../utils/formatters';
import { useIsMobile } from '../hooks/useResponsiveSize';
import { useAdvisorChat, useAdvisorPanel, SuggestedEditWithState } from '../hooks/useAdvisorChat';
import type { GearAdvisorContext, GearRef } from '../services/llmAdvisor';

/**
 * ChatSidebar — Chat 中心 UX の統合サイドバー
 *
 * 2 モードを tabs で切替:
 * - **Add**: URL 貼付 or ブランド+商品名で LLM 抽出 → ギアリストに追加
 * - **Advisor**: 装備最適化の対話（base weight 削減、Big 3 分析、編集提案+Undo）
 *
 * 旧 ChatPopup / GearForm / GearInputModal / UrlBulkImportModal / GearAdvisorChat を
 * ここに集約。AppDock / ProfileHeader のトグルボタンは 1 つに統一される。
 */

// ==================== 共通定義 ====================

type ChatMode = 'add' | 'advisor';

interface AddChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type PromptType = 'url' | 'add_gear' | 'add_category' | 'url_with_prompt' | 'multiple_urls' | 'general';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** Add モード: LLM 抽出結果を親にコールバック */
  onGearExtracted?: (gearData: any) => void;
  categories?: any[];
  existingItemCount?: number;
  /** Advisor モード: コンテキスト / 編集 apply / gear ジャンプ */
  advisorContext?: GearAdvisorContext;
  onApplyEdit?: (gearId: string, field: string, value: unknown) => Promise<void>;
  onFocusGear?: (gearId: string) => void;
}

const TIME_FMT = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });

// ==================== Add モードのヘルパー ====================

const buildInitialAddMessage = (hasItems: boolean): AddChatMessage => ({
  id: 'initial-add',
  role: 'assistant',
  content: hasItems
    ? 'Paste a URL, describe a product ("Arc\'teryx Beta AR"), or ask to create a category. I will extract the details and add it to your list.'
    : '👋 Welcome! Add your first gear by:\n\n• Pasting a product URL (single or multiple)\n• Typing a brand + product name\n  e.g. "Patagonia Houdini 100g"\n• Describing a category\n  e.g. "Shelter category"\n\nI will extract the details and add it to your list.',
  timestamp: new Date(),
});

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

const classifyPrompt = (prompt: string): PromptType => {
  const urls = extractMultipleUrls(prompt);
  const lowerPrompt = prompt.toLowerCase();
  if (urls.length > 1) return 'multiple_urls';
  if (urls.length === 1 && prompt.length > urls[0].length + 10) return 'url_with_prompt';
  if (urls.length === 1 && /^https?:\/\/.+$/.test(prompt.trim())) return 'url';
  if (lowerPrompt.includes('category') || lowerPrompt.includes('カテゴリ')) return 'add_category';
  if (containsBrand(prompt)) return 'add_gear';
  return 'general';
};

// ==================== Advisor モードのサブコンポーネント ====================

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
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
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

const FALLBACK_ADVISOR_CONTEXT: GearAdvisorContext = {
  items: [],
  weightBreakdown: null,
  ulStatus: null,
  packName: null,
};

const noopApplyEdit = async () => { /* no-op: Advisor mode 不要時の placeholder */ };

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onClose,
  onGearExtracted,
  categories = [],
  existingItemCount = 0,
  advisorContext,
  onApplyEdit,
  onFocusGear,
}) => {
  const { unit: weightUnit } = useWeightUnit();
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<ChatMode>('add');

  // --- Add モード ローカル state ---
  const [addMessages, setAddMessages] = useState<AddChatMessage[]>(() => [
    buildInitialAddMessage(existingItemCount > 0),
  ]);
  const [addInput, setAddInput] = useState('');
  const [addIsLoading, setAddIsLoading] = useState(false);
  const addMessagesEndRef = useRef<HTMLDivElement>(null);
  const addInputRef = useRef<HTMLTextAreaElement>(null);

  // existingItemCount は非同期で後からロードされるため、ユーザーがまだ
  // 発話していない（初回メッセージ 1 件だけの）状態であれば welcome 文言を
  // items 数に追従させる。
  useEffect(() => {
    setAddMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'initial-add') {
        return [buildInitialAddMessage(existingItemCount > 0)];
      }
      return prev;
    });
  }, [existingItemCount]);

  // --- Advisor モード hook （常に呼び出す：hook 順序安定のため） ---
  const advisor = useAdvisorChat(
    advisorContext ?? FALLBACK_ADVISOR_CONTEXT,
    onApplyEdit ?? noopApplyEdit,
  );
  const { messagesEndRef: advisorMessagesEndRef, inputRef: advisorInputRef } =
    useAdvisorPanel(isOpen && mode === 'advisor', advisor.messages);

  const isAdvisorAvailable = !!advisorContext && !!onApplyEdit;

  // Add モード: 自動スクロール + オープン時フォーカス
  useEffect(() => {
    if (mode === 'add') {
      addMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [addMessages, mode]);

  useEffect(() => {
    if (isOpen && mode === 'add') {
      setTimeout(() => addInputRef.current?.focus(), 150);
    }
  }, [isOpen, mode]);

  // ==================== Add モード: 送信処理 ====================
  const handleAddSend = async () => {
    if (!addInput.trim() || addIsLoading) return;

    const userMessage: AddChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: addInput.trim(),
      timestamp: new Date(),
    };
    setAddMessages((prev) => [...prev, userMessage]);
    const currentInput = addInput.trim();
    setAddInput('');
    setAddIsLoading(true);

    try {
      let assistantResponse = '';
      let shouldExtractGear = false;
      let mockGearData: any = null;
      const promptType = classifyPrompt(currentInput);

      switch (promptType) {
        case 'url':
          try {
            const extractedData = await extractFromUrl(currentInput, categories);
            const matchedCategory = categories.find((cat) => cat.name === extractedData.suggestedCategory);
            assistantResponse = `Extracted from URL!\n\nProduct: ${extractedData.name}\nBrand: ${extractedData.brand || 'Unknown'}\nWeight: ${extractedData.weightGrams ? formatWeight(extractedData.weightGrams, weightUnit) : 'Estimating...'}\nPrice: ${extractedData.priceCents ? formatPrice(extractedData.priceCents) : 'Estimating...'}\nCategory: ${extractedData.suggestedCategory}\n\nAdded to your list.`;
            shouldExtractGear = true;
            mockGearData = {
              name: extractedData.name, brand: extractedData.brand, productUrl: currentInput,
              categoryId: matchedCategory?.id, requiredQuantity: 1, ownedQuantity: 0,
              weightGrams: extractedData.weightGrams, priceCents: extractedData.priceCents,
              season: '', priority: 3,
            };
          } catch (error) {
            assistantResponse = error instanceof APIError
              ? `URL parse error: ${error.message}`
              : `URL parse error: ${error instanceof Error ? error.message : 'Failed to extract'}`;
          }
          break;

        case 'add_gear':
          try {
            const extractedData = await extractFromPrompt(currentInput, categories);
            const matchedCategory = categories.find((cat) => cat.name === extractedData.suggestedCategory);
            assistantResponse = `Gear info extracted!\n\nProduct: ${extractedData.name}\nBrand: ${extractedData.brand || 'Unknown'}\nWeight: ${extractedData.weightGrams ? formatWeight(extractedData.weightGrams, weightUnit) : 'Estimating...'}\nPrice: ${extractedData.priceCents ? formatPrice(extractedData.priceCents) : 'Estimating...'}\nCategory: ${extractedData.suggestedCategory}\n\nAdded to your list.`;
            shouldExtractGear = true;
            mockGearData = {
              name: extractedData.name, brand: extractedData.brand, productUrl: '',
              categoryId: matchedCategory?.id, requiredQuantity: 1, ownedQuantity: 0,
              weightGrams: extractedData.weightGrams, priceCents: extractedData.priceCents,
              season: '', priority: 3,
            };
          } catch (error) {
            assistantResponse = error instanceof APIError
              ? `Extraction error: ${error.message}`
              : `Extraction error: ${error instanceof Error ? error.message : 'Please use "Brand + Product" format.'}`;
          }
          break;

        case 'add_category':
          try {
            const categoryData = await extractCategoryFromPrompt(currentInput);
            assistantResponse = categoryData
              ? `Category created!\n\nCategory: ${categoryData.englishName}\nJapanese: ${categoryData.name}`
              : 'Could not identify category. Example: "Shelter category"';
          } catch (error) {
            assistantResponse = error instanceof APIError
              ? `Category error: ${error.message}`
              : `Category error: ${error instanceof Error ? error.message : 'Failed to create'}`;
          }
          break;

        case 'url_with_prompt':
          try {
            const urlMatch = currentInput.match(/(https?:\/\/[^\s]+)/);
            if (urlMatch) {
              const url = urlMatch[1];
              const urlData = await extractFromUrl(url, categories);
              const enhancedData = await enhanceUrlDataWithPrompt(urlData, currentInput);
              const matchedCategory = categories.find((cat) => cat.name === enhancedData.suggestedCategory);
              assistantResponse = `Processed URL with extra info!\n\nProduct: ${enhancedData.name}\nBrand: ${enhancedData.brand}\nWeight: ${formatWeight(enhancedData.weightGrams ?? null, weightUnit)}\nPrice: ${formatPrice(enhancedData.priceCents)}\nCategory: ${enhancedData.suggestedCategory}\n\nAdded to your list.`;
              shouldExtractGear = true;
              mockGearData = {
                name: enhancedData.name, brand: enhancedData.brand, productUrl: url,
                categoryId: matchedCategory?.id, requiredQuantity: 1, ownedQuantity: 0,
                weightGrams: enhancedData.weightGrams, priceCents: enhancedData.priceCents,
                season: '', priority: 3,
              };
            } else {
              assistantResponse = 'URL not detected. Example: "https://… + 230g"';
            }
          } catch (error) {
            assistantResponse = error instanceof APIError
              ? `URL+info error: ${error.message}`
              : `URL+info error: ${error instanceof Error ? error.message : 'Failed to process'}`;
          }
          break;

        case 'multiple_urls':
          try {
            const urls = extractMultipleUrls(currentInput);
            assistantResponse = `${urls.length} URLs detected. Processing in parallel...\n\n`;
            const results = await Promise.allSettled(urls.map((url) => extractFromUrl(url, categories)));
            const successResults: any[] = [];
            const failedUrls: string[] = [];
            results.forEach((result, index) => {
              if (result.status === 'fulfilled') {
                const data = result.value;
                const isFallback = data.source === 'fallback' ||
                  !data.name || data.name.includes('Failed') || data.name.includes('Product from');
                if (!isFallback) successResults.push({ url: urls[index], data });
                else failedUrls.push(urls[index]);
              } else {
                failedUrls.push(urls[index]);
              }
            });
            if (successResults.length > 0) {
              assistantResponse += `✅ Success: ${successResults.length} items\n\n`;
              successResults.forEach((item, idx) => {
                assistantResponse += `${idx + 1}. ${item.data.name}\n`;
                assistantResponse += `   Brand: ${item.data.brand || 'Unknown'}\n`;
                assistantResponse += `   Weight: ${item.data.weightGrams ? formatWeight(item.data.weightGrams, weightUnit) : '?'}\n`;
                assistantResponse += `   Price: ${item.data.priceCents ? formatPrice(item.data.priceCents) : '?'}\n\n`;
              });
              shouldExtractGear = true;
              mockGearData = successResults.map((item) => {
                const matchedCategory = categories.find((cat) => cat.name === item.data.suggestedCategory);
                return {
                  name: item.data.name, brand: item.data.brand, productUrl: item.url,
                  imageUrl: item.data.imageUrl, categoryId: matchedCategory?.id,
                  requiredQuantity: 1, ownedQuantity: 0,
                  weightGrams: item.data.weightGrams, priceCents: item.data.priceCents,
                  season: '', priority: 3,
                };
              });
            }
            if (failedUrls.length > 0) {
              assistantResponse += `\n❌ Failed: ${failedUrls.length}\n`;
              failedUrls.forEach((url, idx) => {
                assistantResponse += `  ${idx + 1}. ${url.substring(0, 50)}...\n`;
              });
            }
            assistantResponse += `\n${successResults.length} items added.`;
          } catch (error) {
            assistantResponse = error instanceof APIError
              ? `Batch error: ${error.message}`
              : `Batch error: ${error instanceof Error ? error.message : 'Unexpected error'}`;
          }
          break;

        default:
          assistantResponse =
            'Tell me more:\n\n• "Brand + Product name" (e.g. "Arc\'teryx Beta AR")\n• Paste a product URL\n• "Shelter category" to create a category';
          break;
      }

      if (shouldExtractGear && mockGearData && onGearExtracted) {
        if (Array.isArray(mockGearData)) {
          mockGearData.forEach((gear) => onGearExtracted(gear));
        } else {
          onGearExtracted(mockGearData);
        }
      }

      setAddMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: assistantResponse, timestamp: new Date() },
      ]);
    } catch (error) {
      const msg = error instanceof APIError
        ? `System error: ${error.message}${error.status ? ` (HTTP ${error.status})` : ''}`
        : `Error: ${error instanceof Error ? error.message : 'unknown'}`;
      setAddMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: msg, timestamp: new Date() },
      ]);
    } finally {
      setAddIsLoading(false);
    }
  };

  const handleAddKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddSend();
    }
  };

  // ==================== Advisor モード: ヘッダー情報 ====================
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

  const advisorLastAssistantId = advisor.messages.filter((m) => m.role === 'assistant').at(-1)?.id;

  // ==================== Render ====================
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
                   bg-white dark:bg-gray-900
                   border-l border-gray-200 dark:border-gray-700
                   shadow-xl
                   transition-transform duration-300 ease-in-out"
        style={{
          width: isMobile ? '100%' : '400px',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
        aria-label="Gear chat assistant"
      >
        {/* ヘッダー: mode tabs + close */}
        <div className="flex items-center justify-between px-3 py-2 shrink-0
                        bg-white dark:bg-gray-800
                        border-b border-gray-200 dark:border-gray-700">
          <div role="tablist" aria-label="Chat mode" className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-gray-100 dark:bg-gray-700">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'add'}
              onClick={() => setMode('add')}
              className={`px-3 h-8 inline-flex items-center rounded text-xs font-semibold transition-colors
                          ${mode === 'add'
                            ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100'}`}
            >
              Add
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'advisor'}
              disabled={!isAdvisorAvailable}
              onClick={() => setMode('advisor')}
              title={!isAdvisorAvailable ? 'Advisor requires gear context' : 'Optimization advisor'}
              className={`px-3 h-8 inline-flex items-center rounded text-xs font-semibold transition-colors
                          disabled:opacity-40 disabled:cursor-not-allowed
                          ${mode === 'advisor'
                            ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100'}`}
            >
              Advisor
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md
                       text-gray-500 dark:text-gray-400
                       hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* サブヘッダー: mode 別のコンテキスト情報 */}
        {mode === 'advisor' && advisorHeaderInfo && (
          <div className="px-4 py-2 shrink-0 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
            {advisorHeaderInfo}
          </div>
        )}
        {mode === 'add' && (
          <div className="px-4 py-2 shrink-0 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
            {existingItemCount > 0 ? `${existingItemCount} items in your list` : 'Add gear by URL or name'}
          </div>
        )}

        {/* メッセージ一覧 */}
        {mode === 'add' ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {addMessages.map((message) => (
              <div
                key={message.id}
                className={`flex items-end ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[92%] p-3 text-xs leading-relaxed shadow-sm whitespace-pre-wrap
                                 ${message.role === 'user'
                                   ? 'rounded-lg rounded-br-sm bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                                   : 'rounded-lg rounded-bl-sm bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700'}`}>
                  <div>{message.content}</div>
                  <div className={`text-2xs mt-1 opacity-50 select-none ${message.role === 'user' ? 'text-right' : ''}`}>
                    {TIME_FMT.format(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            {addIsLoading && (
              <div className="flex items-end justify-start">
                <div className="p-3 rounded-lg rounded-bl-sm flex items-center gap-2
                                bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-400 dark:border-gray-500 border-t-transparent animate-spin" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Analyzing…</span>
                </div>
              </div>
            )}
            <div ref={addMessagesEndRef} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {advisor.messages.map((message) => (
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
                      {advisor.isStreaming && message.id === advisorLastAssistantId && (
                        <span className="inline-block w-0.5 h-3.5 ml-0.5 bg-gray-500 dark:bg-gray-400 animate-pulse align-text-bottom" />
                      )}
                    </div>
                    {message.content && (
                      <div className={`text-2xs mt-1 opacity-50 select-none ${message.role === 'user' ? 'text-right' : ''}`}>
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
            ))}
            {advisor.isLoading && !advisor.isStreaming && (
              <div className="flex justify-start">
                <div className="p-3 rounded-lg rounded-bl-sm flex items-center gap-2
                                bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-400 dark:border-gray-500 border-t-transparent animate-spin" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Analyzing…</span>
                </div>
              </div>
            )}
            <div ref={advisorMessagesEndRef} />
          </div>
        )}

        {/* 入力エリア */}
        <div className="shrink-0 px-4 py-3
                        bg-white dark:bg-gray-800
                        border-t border-gray-200 dark:border-gray-700">
          {mode === 'add' ? (
            <>
              <div className="flex items-end gap-2">
                <textarea
                  ref={addInputRef}
                  value={addInput}
                  onChange={(e) => setAddInput(e.target.value)}
                  onKeyDown={handleAddKeyDown}
                  placeholder="Paste URL or describe gear… (Shift+Enter for new line)"
                  disabled={addIsLoading}
                  rows={2}
                  className="flex-1 px-3 py-2 text-xs rounded-lg resize-none
                             bg-white dark:bg-gray-900
                             text-gray-800 dark:text-gray-100
                             border border-gray-200 dark:border-gray-600
                             focus:outline-none focus:ring-2 focus:ring-gray-400
                             disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleAddSend}
                  disabled={!addInput.trim() || addIsLoading}
                  className="h-9 px-4 rounded-lg text-xs font-medium
                             bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900
                             hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed
                             transition-opacity"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Advisor クイックプロンプト */}
              <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1 scrollbar-thin">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    type="button"
                    disabled={advisor.isLoading}
                    onClick={() => advisor.sendText(qp.prompt)}
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
              <div className="flex items-end gap-2">
                <textarea
                  ref={advisorInputRef}
                  value={advisor.input}
                  onChange={(e) => advisor.setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      advisor.handleSend();
                    }
                  }}
                  placeholder="Ask about your gear… (Shift+Enter for new line)"
                  disabled={advisor.isLoading}
                  rows={2}
                  className="flex-1 px-3 py-2 text-xs rounded-lg resize-none
                             bg-white dark:bg-gray-900
                             text-gray-800 dark:text-gray-100
                             border border-gray-200 dark:border-gray-600
                             focus:outline-none focus:ring-2 focus:ring-gray-400
                             disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={advisor.handleSend}
                  disabled={!advisor.input.trim() || advisor.isLoading}
                  className="h-9 px-4 rounded-lg text-xs font-medium
                             bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900
                             hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed
                             transition-opacity"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default ChatSidebar;
