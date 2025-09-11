import { LLMExtractionResult } from '../models/types.js';
import { openaiClient } from './openaiClient.js';
import { PROMPTS, BRAND_PATTERNS, CATEGORY_MAP } from './llmPrompts.js';

/**
 * Server-side LLM Service - 簡略化版
 */
export class LLMService {
  constructor() {
    // OpenAI クライアント初期化は別ファイルで実行
  }

  /**
   * プロンプトからギア情報を抽出
   */
  async extractGearFromPrompt(prompt: string): Promise<LLMExtractionResult> {
    try {
      const response = await openaiClient.chatCompletion(PROMPTS.EXTRACT_GEAR, prompt);
      const result = JSON.parse(response);
      
      return {
        name: result.name || 'Unknown Gear',
        brand: result.brand || undefined,
        weightGrams: result.weightGrams || undefined,
        priceCents: result.priceCents || undefined,
        suggestedCategory: result.suggestedCategory || 'Other',
        confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1)
      };
    } catch (error) {
      return this.fallbackGearExtraction(prompt);
    }
  }

  /**
   * URLからギア情報を抽出
   */
  async extractGearFromUrl(url: string): Promise<LLMExtractionResult> {
    try {
      const response = await openaiClient.chatCompletion(PROMPTS.EXTRACT_URL, url);
      const result = JSON.parse(response);
      
      return {
        name: result.name || 'Product from URL',
        brand: result.brand || undefined,
        weightGrams: result.weightGrams || undefined,
        priceCents: result.priceCents || undefined,
        suggestedCategory: result.suggestedCategory || 'Other',
        confidence: Math.min(Math.max(result.confidence || 0.6, 0), 1)
      };
    } catch (error) {
      return this.fallbackUrlExtraction(url);
    }
  }

  /**
   * URL抽出結果をプロンプト情報で拡張
   */
  async enhanceWithPrompt(
    urlData: LLMExtractionResult, 
    prompt: string
  ): Promise<LLMExtractionResult> {
    try {
      const enhanceMessage = `${PROMPTS.ENHANCE_PROMPT}\n既存: ${JSON.stringify(urlData)}\n追加: ${prompt}`;
      const response = await openaiClient.chatCompletion(PROMPTS.EXTRACT_GEAR, enhanceMessage);
      const result = JSON.parse(response);
      
      return {
        name: result.name || urlData.name,
        brand: result.brand || urlData.brand,
        weightGrams: result.weightGrams || urlData.weightGrams,
        priceCents: result.priceCents || urlData.priceCents,
        suggestedCategory: result.suggestedCategory || urlData.suggestedCategory,
        confidence: Math.max(result.confidence || urlData.confidence, urlData.confidence)
      };
    } catch (error) {
      return this.fallbackEnhancement(urlData, prompt);
    }
  }

  /**
   * カテゴリ名を抽出・正規化
   */
  async extractCategory(prompt: string): Promise<{ name: string; englishName: string } | null> {
    try {
      const response = await openaiClient.chatCompletion(PROMPTS.EXTRACT_CATEGORY, prompt);
      if (response.toLowerCase().includes('null')) {
        return null;
      }
      const result = JSON.parse(response);
      return { name: result.name, englishName: result.englishName };
    } catch (error) {
      return this.fallbackCategoryExtraction(prompt);
    }
  }

  /**
   * ギアリスト分析
   */
  async analyzeGearList(gearItems: any[]): Promise<{ summary: string; tips: string[] }> {
    try {
      const response = await openaiClient.chatCompletion(PROMPTS.ANALYZE_LIST, JSON.stringify(gearItems));
      const result = JSON.parse(response);
      return {
        summary: result.summary || 'ギアリストの分析を完了しました',
        tips: result.tips || ['軽量化を検討してください']
      };
    } catch (error) {
      return this.fallbackAnalysis(gearItems);
    }
  }

  /**
   * API Health Check
   */
  async checkHealth(): Promise<{ isHealthy: boolean; message?: string }> {
    try {
      const isHealthy = await openaiClient.healthCheck();
      return {
        isHealthy,
        message: isHealthy ? 'LLM service is operational' : 'LLM service is down'
      };
    } catch (error) {
      return {
        isHealthy: false,
        message: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }

  // フォールバック関数群
  private fallbackGearExtraction(prompt: string): LLMExtractionResult {
    const brandPattern = new RegExp(`(${BRAND_PATTERNS.join('|')})`, 'i');
    const brandMatch = prompt.match(brandPattern);
    
    return {
      name: prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt,
      brand: brandMatch ? brandMatch[1] : undefined,
      weightGrams: undefined,
      priceCents: undefined,
      suggestedCategory: 'Other',
      confidence: 0.3
    };
  }

  private fallbackUrlExtraction(url: string): LLMExtractionResult {
    const domain = new URL(url).hostname;
    const brandMapping: Record<string, string> = {
      'arcteryx.com': 'Arc\'teryx',
      'patagonia.com': 'Patagonia',
      'montbell.jp': 'Montbell',
      'rei.com': 'REI',
      'amazon.com': 'Amazon'
    };
    
    const brand = Object.entries(brandMapping).find(([d]) => domain.includes(d))?.[1];
    
    return {
      name: 'Product from URL',
      brand: brand || undefined,
      weightGrams: undefined,
      priceCents: undefined,
      suggestedCategory: 'Other',
      confidence: 0.4
    };
  }

  private fallbackEnhancement(urlData: LLMExtractionResult, prompt: string): LLMExtractionResult {
    const enhanced = { ...urlData };
    
    const weightMatch = prompt.match(/(\d+)\s*g/i);
    if (weightMatch) {
      enhanced.weightGrams = parseInt(weightMatch[1]);
      enhanced.confidence = Math.min(enhanced.confidence + 0.2, 1.0);
    }
    
    const priceMatch = prompt.match(/(\d+)\s*円/i);
    if (priceMatch) {
      enhanced.priceCents = parseInt(priceMatch[1]) * 100;
      enhanced.confidence = Math.min(enhanced.confidence + 0.2, 1.0);
    }
    
    return enhanced;
  }

  private fallbackCategoryExtraction(prompt: string): { name: string; englishName: string } | null {
    for (const [key, value] of Object.entries(CATEGORY_MAP)) {
      if (prompt.includes(key)) {
        return value;
      }
    }
    return null;
  }

  private fallbackAnalysis(gearItems: any[]): { summary: string; tips: string[] } {
    const totalWeight = gearItems.reduce((sum, item) => 
      sum + ((item.weightGrams || 0) * (item.requiredQuantity || 1)), 0);
    const itemCount = gearItems.length;
    const missingItems = gearItems.filter(item => 
      (item.requiredQuantity || 1) > (item.ownedQuantity || 0)).length;

    return {
      summary: `総重量: ${totalWeight}g (${itemCount}アイテム) | 不足: ${missingItems}アイテム`,
      tips: [
        totalWeight > 10000 ? '10kg超過 - 軽量化を検討' : '良い重量バランス',
        missingItems > 0 ? `${missingItems}アイテムが不足` : '必要なアイテムは揃っています',
        itemCount < 10 ? '基本アイテムの追加を検討' : '十分なアイテム数'
      ].filter(tip => tip.length > 0)
    };
  }
}

export const llmService = new LLMService();
