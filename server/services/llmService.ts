import { LLMExtractionResult } from '../models/types.js';
import { openaiClient } from './openaiClient.js';
import { webScrapingService } from './webScrapingService.js';
import { PROMPTS } from './llmPrompts.js';

/**
 * LLM Service - 最小限実装
 */
export class LLMService {

  /**
   * プロンプトからギア情報を抽出
   */
  async extractGearFromPrompt(prompt: string): Promise<LLMExtractionResult> {
    if (!prompt || prompt.trim().length < 3) {
      return this.createFallback('入力が短すぎます');
    }
    
    try {
      const response = await openaiClient.chatCompletion(PROMPTS.EXTRACT_GEAR, prompt.trim());
      const result = this.parseJSON(response);
      
      return {
        name: result.name || 'Unknown Gear',
        brand: result.brand,
        weightGrams: result.weightGrams,
        priceCents: result.priceCents,
        suggestedCategory: result.suggestedCategory || 'Other',
        requiredQuantity: 1,
        ownedQuantity: 0,
        priority: 3,
        season: 'all',
        extractedFields: this.getExtractedFields(result),
        source: 'llm_prompt'
      };
    } catch (error) {
      console.error('Prompt extraction failed:', error);
      return this.createFallback(prompt);
    }
  }

  /**
   * URLからギア情報を抽出
   */
  async extractGearFromUrl(url: string): Promise<LLMExtractionResult> {
    try {
      new URL(url); // URL検証
    } catch {
      return this.createFallback(url);
    }
    
    try {
      // スクレイピングで基本情報取得
      const scrapedData = await webScrapingService.scrapeProductInfo(url);
      
      // LLMで補強（失敗してもスクレイピング結果を返す）
      try {
        const llmPrompt = `以下の情報を検証・補完してください：\n${JSON.stringify(scrapedData)}`;
        const llmResponse = await openaiClient.chatCompletion(PROMPTS.EXTRACT_URL, llmPrompt);
        const llmResult = this.parseJSON(llmResponse);
        
        return {
          name: llmResult.name || scrapedData.name || 'Product from URL',
          brand: llmResult.brand || scrapedData.brand,
          productUrl: url,
          weightGrams: llmResult.weightGrams || scrapedData.weightGrams,
          priceCents: llmResult.priceCents || scrapedData.priceCents,
          suggestedCategory: llmResult.suggestedCategory || scrapedData.suggestedCategory || 'Other',
          requiredQuantity: 1,
          ownedQuantity: 0,
          priority: 3,
          season: 'all',
          extractedFields: this.mergeExtractedFields(scrapedData, llmResult),
          source: 'enhanced'
        };
      } catch (llmError) {
        console.warn('LLM enhancement failed, using scraping results');
        return scrapedData;
      }
    } catch (error) {
      console.error('URL extraction failed:', error);
      return this.createFallback(url);
    }
  }

  /**
   * URL抽出結果をプロンプトで拡張
   */
  async enhanceWithPrompt(urlData: LLMExtractionResult, prompt: string): Promise<LLMExtractionResult> {
    try {
      const enhanceMessage = `${PROMPTS.ENHANCE_PROMPT}\n\n既存データ: ${JSON.stringify(urlData)}\n\n追加情報: ${prompt}`;
      const response = await openaiClient.chatCompletion(PROMPTS.EXTRACT_GEAR, enhanceMessage);
      const result = this.parseJSON(response);
      
      return {
        name: result.name || urlData.name,
        brand: result.brand || urlData.brand,
        productUrl: urlData.productUrl,
        weightGrams: result.weightGrams || urlData.weightGrams,
        priceCents: result.priceCents || urlData.priceCents,
        suggestedCategory: result.suggestedCategory || urlData.suggestedCategory,
        requiredQuantity: 1,
        ownedQuantity: 0,
        priority: 3,
        season: 'all',
        extractedFields: urlData.extractedFields || [],
        source: 'enhanced'
      };
    } catch (error) {
      console.error('Enhancement failed:', error);
      return urlData; // 失敗時は元データを返す
    }
  }

  /**
   * カテゴリ抽出
   */
  async extractCategory(prompt: string): Promise<{ name: string; englishName: string } | null> {
    try {
      const response = await openaiClient.chatCompletion(PROMPTS.EXTRACT_CATEGORY, prompt);
      if (response.toLowerCase().includes('null')) {
        return null;
      }
      const result = this.parseJSON(response);
      return { name: result.name, englishName: result.englishName };
    } catch (error) {
      console.error('Category extraction failed:', error);
      return null;
    }
  }

  /**
   * リスト分析
   */
  async analyzeList(gearList: any[]): Promise<{ summary: string; tips: string[] }> {
    try {
      const listData = JSON.stringify(gearList.slice(0, 10)); // 最初の10件のみ
      const response = await openaiClient.chatCompletion(PROMPTS.ANALYZE_LIST, listData);
      const result = this.parseJSON(response);
      return {
        summary: result.summary || 'リストを分析できませんでした',
        tips: result.tips || ['特に提案はありません']
      };
    } catch (error) {
      console.error('List analysis failed:', error);
      return {
        summary: '分析に失敗しました',
        tips: ['後でもう一度お試しください']
      };
    }
  }

  /**
   * JSON解析
   */
  private parseJSON(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      return {};
    }
  }

  /**
   * 抽出フィールド取得
   */
  private getExtractedFields(result: any): string[] {
    const fields: string[] = [];
    if (result.name) fields.push('name');
    if (result.brand) fields.push('brand');
    if (result.weightGrams) fields.push('weightGrams');
    if (result.priceCents) fields.push('priceCents');
    if (result.suggestedCategory) fields.push('suggestedCategory');
    return fields;
  }

  /**
   * 抽出フィールドマージ
   */
  private mergeExtractedFields(scrapedData: LLMExtractionResult, llmResult: any): string[] {
    return [...new Set([
      ...(scrapedData.extractedFields || []),
      ...this.getExtractedFields(llmResult)
    ])];
  }

  /**
   * フォールバック結果作成
   */
  private createFallback(input: string): LLMExtractionResult {
    return {
      name: input.length > 50 ? input.substring(0, 50) + '...' : input,
      suggestedCategory: 'Other',
      requiredQuantity: 1,
      ownedQuantity: 0,
      priority: 3,
      season: 'all',
      extractedFields: ['name'],
      source: 'fallback'
    };
  }
}

export const llmService = new LLMService();