import { LLMExtractionResult } from '../models/types.js';
import { openaiClient } from './openaiClient.js';
import { PROMPTS } from './llmPrompts.js';
import { webScrapingService } from './webScrapingService.js';

/**
 * LLM Service - シンプル版
 */
export class LLMService {

  /**
   * プロンプトからギア情報を抽出
   */
  async extractGearFromPrompt(prompt: string): Promise<LLMExtractionResult> {
    try {
      const response = await openaiClient.chatCompletion(PROMPTS.EXTRACT_GEAR, prompt);
      const result = this.parseJSON(response);
      
      // 抽出されたフィールドを記録
      const extractedFields: string[] = [];
      if (result.name) extractedFields.push('name');
      if (result.brand) extractedFields.push('brand');
      if (result.weightGrams) extractedFields.push('weightGrams');
      if (result.priceCents) extractedFields.push('priceCents');
      if (result.suggestedCategory) extractedFields.push('suggestedCategory');
      
      return {
        // 抽出された情報
        name: result.name || 'Unknown Gear',
        brand: result.brand || undefined,
        weightGrams: result.weightGrams || undefined,
        priceCents: result.priceCents || undefined,
        suggestedCategory: result.suggestedCategory || 'Other',
        
        // ギアリスト用デフォルト値
        requiredQuantity: 1,
        ownedQuantity: 0,
        priority: 3,
        season: 'all',
        
        // メタデータ
        confidence: this.clampConfidence(result.confidence || 0.5),
        extractedFields,
        source: 'llm_prompt'
      };
    } catch (error) {
      console.error('Prompt extraction failed:', error);
      return this.createFallbackResult(prompt);
    }
  }

  /**
   * URLからギア情報を抽出
   */
  async extractGearFromUrl(url: string): Promise<LLMExtractionResult> {
    try {
      // Webスクレイピングで基本情報取得
      const scrapedData = await webScrapingService.scrapeProductInfo(url);
      
      // LLMで補強（失敗してもスクレイピング結果を返す）
      try {
        const llmPrompt = `以下の情報を検証・補完してください：\n${JSON.stringify(scrapedData)}`;
        const llmResponse = await openaiClient.chatCompletion(PROMPTS.EXTRACT_URL, llmPrompt);
        const llmResult = this.parseJSON(llmResponse);
        
        // 最終的な抽出フィールドをマージ
        const finalExtractedFields = [...new Set([
          ...(scrapedData.extractedFields || []),
          ...(llmResult.name ? ['name'] : []),
          ...(llmResult.brand ? ['brand'] : []),
          ...(llmResult.weightGrams ? ['weightGrams'] : []),
          ...(llmResult.priceCents ? ['priceCents'] : [])
        ])];

        return {
          name: llmResult.name || scrapedData.name || 'Product from URL',
          brand: llmResult.brand || scrapedData.brand,
          productUrl: url,
          weightGrams: llmResult.weightGrams || scrapedData.weightGrams,
          priceCents: llmResult.priceCents || scrapedData.priceCents,
          suggestedCategory: llmResult.suggestedCategory || scrapedData.suggestedCategory || 'Other',
          requiredQuantity: scrapedData.requiredQuantity || 1,
          ownedQuantity: scrapedData.ownedQuantity || 0,
          priority: scrapedData.priority || 3,
          season: scrapedData.season || 'all',
          confidence: Math.max(this.clampConfidence(llmResult.confidence), scrapedData.confidence || 0.3),
          extractedFields: finalExtractedFields,
          source: 'enhanced'
        };
      } catch (llmError) {
        console.warn('LLM enhancement failed, using scraping results');
        return scrapedData;
      }
    } catch (error) {
      console.error('URL extraction failed:', error);
      return this.createUrlFallback(url);
    }
  }

  /**
   * URL抽出結果をプロンプトで拡張
   */
  async enhanceWithPrompt(urlData: LLMExtractionResult, prompt: string): Promise<LLMExtractionResult> {
    try {
      const enhanceMessage = `既存データ: ${JSON.stringify(urlData)}\n追加情報: ${prompt}`;
      const response = await openaiClient.chatCompletion(PROMPTS.EXTRACT_GEAR, enhanceMessage);
      const result = this.parseJSON(response);
      
      return {
        name: result.name || urlData.name,
        brand: result.brand || urlData.brand,
        weightGrams: result.weightGrams || urlData.weightGrams,
        priceCents: result.priceCents || urlData.priceCents,
        suggestedCategory: result.suggestedCategory || urlData.suggestedCategory,
        confidence: Math.max(this.clampConfidence(result.confidence), urlData.confidence || 0.5),
        extractedFields: urlData.extractedFields || [],
        source: 'enhanced'
      };
    } catch (error) {
      console.error('Enhancement failed:', error);
      return this.enhanceFallback(urlData, prompt);
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
   * ヘルスチェック
   */
  async checkHealth(): Promise<{ isHealthy: boolean; message?: string }> {
    try {
      const isHealthy = await openaiClient.healthCheck();
      return {
        isHealthy,
        message: isHealthy ? 'LLM service operational' : 'LLM service unavailable'
      };
    } catch (error) {
      return {
        isHealthy: false,
        message: 'Health check failed'
      };
    }
  }

  // ヘルパーメソッド
  private parseJSON(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch {
      return {};
    }
  }

  private clampConfidence(value: number): number {
    return Math.min(Math.max(value || 0, 0), 1);
  }

  private createFallbackResult(prompt: string): LLMExtractionResult {
    return {
      name: prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt,
      suggestedCategory: 'Other',
      requiredQuantity: 1,
      ownedQuantity: 0,
      priority: 3,
      season: 'all',
      confidence: 0.2,
      extractedFields: ['name'],
      source: 'fallback'
    };
  }

  private createUrlFallback(url: string): LLMExtractionResult {
    const domain = new URL(url).hostname;
    let brand: string | undefined;
    
    if (domain.includes('arcteryx')) brand = 'Arc\'teryx';
    else if (domain.includes('patagonia')) brand = 'Patagonia';
    else if (domain.includes('montbell')) brand = 'Montbell';
    
    return {
      name: 'Product from URL',
      brand,
      productUrl: url,
      suggestedCategory: 'Other',
      requiredQuantity: 1,
      ownedQuantity: 0,
      priority: 3,
      season: 'all',
      confidence: 0.3,
      extractedFields: brand ? ['brand'] : [],
      source: 'fallback'
    };
  }

  private enhanceFallback(urlData: LLMExtractionResult, prompt: string): LLMExtractionResult {
    const enhanced = { ...urlData };
    
    // 重量の抽出
    const weightMatch = prompt.match(/(\d+)\s*g/i);
    if (weightMatch) {
      enhanced.weightGrams = parseInt(weightMatch[1]);
      enhanced.confidence = Math.min((enhanced.confidence || 0) + 0.2, 1.0);
    }
    
    // 価格の抽出
    const priceMatch = prompt.match(/(\d+)\s*円/i);
    if (priceMatch) {
      enhanced.priceCents = parseInt(priceMatch[1]) * 100;
      enhanced.confidence = Math.min((enhanced.confidence || 0) + 0.2, 1.0);
    }
    
    return enhanced;
  }

}

export const llmService = new LLMService();