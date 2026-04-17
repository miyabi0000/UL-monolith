import React, { useState, useRef, useEffect } from 'react';
import {
  extractFromPrompt,
  enhanceUrlDataWithPrompt,
  extractCategoryFromPrompt,
  extractFromUrl,
  APIError,
} from '../services/llmService';
import { useWeightUnit } from '../contexts/WeightUnitContext';
import { formatWeight } from '../utils/weightUnit';
import { useIsMobile } from '../hooks/useResponsiveSize';

/**
 * ChatSidebar — Chat 中心 UX のメインインタフェース
 *
 * 設計方針:
 * - デスクトップは右側 400px 常駐、モバイルは全画面 overlay
 * - URL 貼付・商品名プロンプトで LLM がギア抽出し onGearExtracted でリストへ追加
 * - 入力欄下の Compare アイコンから既存 Compare モードを起動
 * - リストが空なら自動でオープン (InventoryWorkspace 側で制御)
 *
 * 旧 ChatPopup / GearInputModal / UrlBulkImportModal / GearForm を置き換える。
 */

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type PromptType = 'url' | 'add_gear' | 'add_category' | 'url_with_prompt' | 'multiple_urls' | 'general';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onGearExtracted?: (gearData: any) => void;
  onEnterCompareMode?: () => void;
  categories?: any[];
  existingItemCount?: number;
}

const TIME_FMT = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });

/** 初回メッセージ (アイテム有無で文言切替) */
const buildInitialMessage = (hasItems: boolean): ChatMessage => ({
  id: 'initial',
  role: 'assistant',
  content: hasItems
    ? 'How can I help? Paste a URL, describe a product ("Arc\'teryx Beta AR 430g"), or ask to create a category.'
    : '👋 Welcome! Add your first gear by:\n\n• Pasting a product URL (single or multiple)\n• Typing a brand + product name\n  e.g. "Patagonia Houdini 100g"\n• Describing a category\n  e.g. "Shelter category"\n\nI\'ll extract the details and add it to your list.',
  timestamp: new Date(),
});

// URL を複数抽出
const extractMultipleUrls = (text: string): string[] => {
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlRegex) || [];
  return [...new Set(urls)];
};

// ブランド名含有判定
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

// プロンプト分類
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

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onClose,
  onGearExtracted,
  onEnterCompareMode,
  categories = [],
  existingItemCount = 0,
}) => {
  const { unit: weightUnit } = useWeightUnit();
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [buildInitialMessage(existingItemCount > 0)]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // オープン時フォーカス
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

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
            assistantResponse = `Extracted from URL!\n\nProduct: ${extractedData.name}\nBrand: ${extractedData.brand || 'Unknown'}\nWeight: ${extractedData.weightGrams ? formatWeight(extractedData.weightGrams, weightUnit) : 'Estimating...'}\nPrice: ${extractedData.priceCents ? `¥${Math.round(extractedData.priceCents / 100).toLocaleString()}` : 'Estimating...'}\nCategory: ${extractedData.suggestedCategory}\n\nAdded to your list.`;
            shouldExtractGear = true;
            mockGearData = {
              name: extractedData.name,
              brand: extractedData.brand,
              productUrl: currentInput,
              categoryId: matchedCategory?.id,
              requiredQuantity: 1,
              ownedQuantity: 0,
              weightGrams: extractedData.weightGrams,
              priceCents: extractedData.priceCents,
              season: '',
              priority: 3,
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
            assistantResponse = `Gear info extracted!\n\nProduct: ${extractedData.name}\nBrand: ${extractedData.brand || 'Unknown'}\nWeight: ${extractedData.weightGrams ? formatWeight(extractedData.weightGrams, weightUnit) : 'Estimating...'}\nPrice: ${extractedData.priceCents ? `¥${Math.round(extractedData.priceCents / 100).toLocaleString()}` : 'Estimating...'}\nCategory: ${extractedData.suggestedCategory}\n\nAdded to your list.`;
            shouldExtractGear = true;
            mockGearData = {
              name: extractedData.name,
              brand: extractedData.brand,
              productUrl: '',
              categoryId: matchedCategory?.id,
              requiredQuantity: 1,
              ownedQuantity: 0,
              weightGrams: extractedData.weightGrams,
              priceCents: extractedData.priceCents,
              season: '',
              priority: 3,
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
              assistantResponse = `Processed URL with extra info!\n\nProduct: ${enhancedData.name}\nBrand: ${enhancedData.brand}\nWeight: ${formatWeight(enhancedData.weightGrams ?? null, weightUnit)}\nPrice: ¥${Math.round(enhancedData.priceCents! / 100).toLocaleString()}\nCategory: ${enhancedData.suggestedCategory}\n\nAdded to your list.`;
              shouldExtractGear = true;
              mockGearData = {
                name: enhancedData.name,
                brand: enhancedData.brand,
                productUrl: url,
                categoryId: matchedCategory?.id,
                requiredQuantity: 1,
                ownedQuantity: 0,
                weightGrams: enhancedData.weightGrams,
                priceCents: enhancedData.priceCents,
                season: '',
                priority: 3,
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
                assistantResponse += `   Price: ${item.data.priceCents ? `¥${Math.round(item.data.priceCents / 100).toLocaleString()}` : '?'}\n\n`;
              });
              shouldExtractGear = true;
              mockGearData = successResults.map((item) => {
                const matchedCategory = categories.find((cat) => cat.name === item.data.suggestedCategory);
                return {
                  name: item.data.name,
                  brand: item.data.brand,
                  productUrl: item.url,
                  imageUrl: item.data.imageUrl,
                  categoryId: matchedCategory?.id,
                  requiredQuantity: 1,
                  ownedQuantity: 0,
                  weightGrams: item.data.weightGrams,
                  priceCents: item.data.priceCents,
                  season: '',
                  priority: 3,
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

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: assistantResponse, timestamp: new Date() },
      ]);
    } catch (error) {
      const msg = error instanceof APIError
        ? `System error: ${error.message}${error.status ? ` (HTTP ${error.status})` : ''}`
        : `Error: ${error instanceof Error ? error.message : 'unknown'}`;
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: msg, timestamp: new Date() },
      ]);
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

  const handleCompare = () => {
    if (onEnterCompareMode) onEnterCompareMode();
  };

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
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0
                        bg-white dark:bg-gray-800
                        border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Gear Assistant
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {existingItemCount > 0
                ? `${existingItemCount} items in your list`
                : 'Add gear by URL or name'}
            </p>
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

        {/* メッセージ一覧 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[92%] p-3 text-xs leading-relaxed shadow-sm whitespace-pre-wrap
                               ${message.role === 'user'
                                 ? 'rounded-lg rounded-br-sm bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                                 : 'rounded-lg rounded-bl-sm bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700'}`}>
                <div>{message.content}</div>
                <div className={`text-2xs mt-1 opacity-50 select-none
                                 ${message.role === 'user' ? 'text-right' : ''}`}>
                  {TIME_FMT.format(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-end justify-start">
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
          {/* アクションアイコンバー */}
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={handleCompare}
              disabled={!onEnterCompareMode || existingItemCount < 2}
              title={existingItemCount < 2 ? 'Need at least 2 items to compare' : 'Compare items'}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                         bg-gray-50 dark:bg-gray-700
                         text-gray-700 dark:text-gray-200
                         border border-gray-200 dark:border-gray-600
                         hover:bg-gray-100 dark:hover:bg-gray-600
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors"
              aria-label="Enter compare mode"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>Compare</span>
            </button>
          </div>

          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste URL or describe gear… (Shift+Enter for new line)"
              disabled={isLoading}
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
              onClick={handleSend}
              disabled={!inputMessage.trim() || isLoading}
              className="h-control px-4 rounded-lg text-xs font-medium
                         bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900
                         hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed
                         transition-opacity"
            >
              Send
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default ChatSidebar;
