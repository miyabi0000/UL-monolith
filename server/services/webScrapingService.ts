import axios from 'axios';
import * as cheerio from 'cheerio';
import { LLMExtractionResult } from '../models/types.js';

/**
 * 汎用Web Scraping Service - ベストプラクティス準拠
 */
export class WebScrapingService {
  private readonly defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none'
  };

  private readonly requestConfig = {
    timeout: 10000,
    maxRedirects: 5,
    validateStatus: (status: number) => status < 400,
    headers: this.defaultHeaders
  };

  /**
   * URLからHTMLを安全に取得
   */
  async fetchHTML(url: string): Promise<string> {
    try {
      // URL検証
      new URL(url);
      
      const response = await axios.get(url, this.requestConfig);
      
      if (typeof response.data !== 'string') {
        throw new Error('Response is not HTML text');
      }
      
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number }; message?: string };
        throw new Error(`HTTP ${axiosError.response?.status || 'Unknown'}: ${axiosError.message || 'Request failed'}`);
      }
      throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * HTMLから構造化データを抽出
   */
  extractStructuredData(html: string, url: string): LLMExtractionResult {
    const $ = cheerio.load(html);
    
    // メタデータ優先抽出
    const structured = this.extractMetadata($);
    
    // フォールバック: HTML要素から抽出
    const fallback = this.extractFromElements($, url);
    
    // 結果をマージ
    return {
      name: structured.name || fallback.name || 'Unknown Product',
      brand: structured.brand || fallback.brand,
      priceCents: structured.priceCents || fallback.priceCents,
      weightGrams: structured.weightGrams || fallback.weightGrams,
      suggestedCategory: fallback.suggestedCategory || 'Other',
      confidence: this.calculateConfidence(structured, fallback),
      extractedFields: [],
      source: 'web_scraping'
    };
  }

  /**
   * 構造化データ（JSON-LD、OpenGraph等）を抽出
   */
  private extractMetadata($: cheerio.Root): Partial<LLMExtractionResult> {
    const result: Partial<LLMExtractionResult> = {};
    
    // JSON-LD構造化データ
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const jsonData = JSON.parse($(el).html() || '{}');
        if (jsonData['@type'] === 'Product') {
          result.name = jsonData.name;
          result.brand = jsonData.brand?.name;
          result.priceCents = jsonData.offers?.price ? Math.round(parseFloat(jsonData.offers.price) * 100) : undefined;
        }
      } catch {
        // JSON解析エラーは無視
      }
    });
    
    // OpenGraph / meta tags
    result.name = result.name || $('meta[property="og:title"]').attr('content');
    result.priceCents = result.priceCents || this.parsePrice($('meta[property="product:price:amount"]').attr('content'));
    
    return result;
  }

  /**
   * HTML要素から抽出（フォールバック）
   */
  private extractFromElements($: cheerio.Root, url: string): Partial<LLMExtractionResult> {
    return {
      name: this.extractName($),
      brand: this.extractBrand($, url),
      priceCents: this.extractPrice($),
      weightGrams: this.extractWeight($),
      suggestedCategory: this.extractCategory($)
    };
  }

  /**
   * 製品名抽出（優先順位付き）
   */
  private extractName($: cheerio.Root): string | undefined {
    const selectors = [
      'h1[itemprop="name"]',
      '[data-testid*="product-title"]',
      '.product-title',
      '.product-name',
      'h1',
      'title'
    ];
    
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (this.isValidProductName(text)) {
        return selector === 'title' ? this.cleanTitle(text) : text;
      }
    }
  }

  /**
   * ブランド抽出
   */
  private extractBrand($: cheerio.Root, url: string): string | undefined {
    // ドメインベース判定
    const domainBrand = this.getBrandFromDomain(url);
    if (domainBrand) return domainBrand;
    
    // HTML要素から抽出
    const selectors = [
      '[itemprop="brand"]',
      '.product-brand',
      '.brand-name',
      '[data-brand]'
    ];
    
    for (const selector of selectors) {
      const brand = $(selector).first().text().trim();
      if (brand && brand.length > 1 && brand.length < 50) {
        return brand;
      }
    }
  }

  /**
   * 価格抽出
   */
  private extractPrice($: cheerio.Root): number | undefined {
    const selectors = [
      '[itemprop="price"]',
      '.price-current',
      '.price',
      '.product-price'
    ];
    
    for (const selector of selectors) {
      const priceText = $(selector).first().text().trim();
      const price = this.parsePrice(priceText);
      if (price) return price;
    }
  }

  /**
   * 重量抽出
   */
  private extractWeight($: cheerio.Root): number | undefined {
    const text = $.html() || '';
    
    // より精密な重量パターン
    const patterns = [
      /weight[:\s]*(\d+(?:\.\d+)?)\s*(kg|g)/gi,
      /重量[:\s]*(\d+(?:\.\d+)?)\s*(kg|g|キロ|グラム)/gi,
      /(\d+(?:\.\d+)?)\s*(kg|g)\b/gi
    ];
    
    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        return unit.includes('k') ? Math.round(value * 1000) : Math.round(value);
      }
    }
  }

  /**
   * カテゴリ抽出
   */
  private extractCategory($: cheerio.Root): string {
    const text = ($.html() || '').toLowerCase();
    
    // より具体的なキーワードを優先して判定
    if (/backpack|pack|bag|rucksack|daypack|ザック|リュック|バッグ|バックパック|デイパック/.test(text)) {
      return 'Backpack';
    }
    if (/jacket|shirt|pants|vest|wear|clothing|ジャケット|ウェア|服|シャツ|パンツ|ベスト/.test(text)) {
      return 'Clothing';
    }
    if (/stove|burner|pot|pan|cook|バーナー|調理|クッカー|ストーブ|コンロ/.test(text)) {
      return 'Cooking';
    }
    if (/headlamp|light|safety|first.?aid|救急|安全|ライト|ヘッドランプ/.test(text)) {
      return 'Safety';
    }
    if (/tent|shelter|tarp|bivy|テント|シェルター|タープ|ビビィ/.test(text)) {
      return 'Shelter';
    }
    
    return 'Other';
  }

  /**
   * ユーティリティメソッド群
   */
  private isValidProductName(text: string): boolean {
    return Boolean(text && text.length > 3 && text.length < 200 && !/^(home|shop|store)$/i.test(text));
  }

  private cleanTitle(title: string): string {
    return title.split(/[|•-]/)[0].trim();
  }

  private getBrandFromDomain(url: string): string | undefined {
    const domain = new URL(url).hostname.toLowerCase();
    const brandMap: Record<string, string> = {
      'arcteryx.com': 'Arc\'teryx',
      'patagonia.com': 'Patagonia',
      'patagonia.jp': 'Patagonia',
      'montbell.jp': 'Montbell',
      'montbell.com': 'Montbell',
      'rei.com': 'REI',
      'thenorthface.com': 'The North Face'
    };
    
    const found = Object.entries(brandMap).find(([key]) => domain.includes(key));
    return found ? found[1] : undefined;
  }

  private parsePrice(priceText?: string): number | undefined {
    if (!priceText) return undefined;
    
    const cleaned = priceText.replace(/[,\s]/g, '');
    const match = cleaned.match(/(\d+(?:\.\d{2})?)/);
    
    return match ? Math.round(parseFloat(match[1]) * 100) : undefined;
  }

  private calculateConfidence(structured: Partial<LLMExtractionResult>, fallback: Partial<LLMExtractionResult>): number {
    let score = 0.1;
    
    // 構造化データがある場合は高得点
    if (structured.name) score += 0.4;
    else if (fallback.name && fallback.name !== 'Unknown Product') score += 0.3;
    
    if (structured.brand || fallback.brand) score += 0.2;
    if (structured.priceCents || fallback.priceCents) score += 0.2;
    if (fallback.weightGrams) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * メインエントリーポイント - ギアリスト対応版
   */
  async scrapeProductInfo(url: string): Promise<LLMExtractionResult> {
    try {
      const html = await this.fetchHTML(url);
      const rawResult = this.extractStructuredData(html, url);
      
      // ギアリスト登録用にデフォルト値を設定
      return this.enhanceWithDefaults(rawResult, url);
    } catch (error) {
      console.error(`Scraping failed for ${url}:`, error);
      return this.createFallbackResult(url);
    }
  }

  /**
   * デフォルト値でギアリスト対応
   */
  private enhanceWithDefaults(info: LLMExtractionResult, url: string): LLMExtractionResult {
    const extractedFields: string[] = [];
    
    // 実際に抽出できたフィールドを記録
    if (info.name && info.name !== 'Unknown Product') extractedFields.push('name');
    if (info.brand) extractedFields.push('brand');
    if (info.weightGrams) extractedFields.push('weightGrams');
    if (info.priceCents) extractedFields.push('priceCents');
    if (info.suggestedCategory && info.suggestedCategory !== 'Other') extractedFields.push('suggestedCategory');

    return {
      // 抽出された情報
      name: info.name || 'Unknown Product',
      brand: info.brand,
      productUrl: url,
      weightGrams: info.weightGrams,
      priceCents: info.priceCents,
      suggestedCategory: info.suggestedCategory || 'Other',
      
      // ギアリスト用デフォルト値
      requiredQuantity: 1,
      ownedQuantity: 0,
      priority: 3, // 中程度の優先度
      season: 'all',
      
      // メタデータ
      confidence: info.confidence || 0.5,
      extractedFields,
      source: 'web_scraping'
    };
  }

  /**
   * フォールバック結果
   */
  private createFallbackResult(url: string): LLMExtractionResult {
    const domain = new URL(url).hostname;
    let brand: string | undefined;
    
    if (domain.includes('arcteryx')) brand = 'Arc\'teryx';
    else if (domain.includes('patagonia')) brand = 'Patagonia';
    else if (domain.includes('montbell')) brand = 'Montbell';
    else if (domain.includes('thenorthface')) brand = 'The North Face';
    
    return {
      name: 'Failed to Extract Product Info',
      brand,
      productUrl: url,
      suggestedCategory: 'Other',
      requiredQuantity: 1,
      ownedQuantity: 0,
      priority: 3,
      season: 'all',
      confidence: 0.1,
      extractedFields: brand ? ['brand'] : [],
      source: 'fallback'
    };
  }
}

export const webScrapingService = new WebScrapingService();