import axios from 'axios';
import * as cheerio from 'cheerio';
import { LLMExtractionResult } from '../models/types.js';
import { amazonScraper } from './amazonScraper.js';
import { normalizeBrand, extractBrandFromText, getBrandFromDomain } from '../utils/brandUtils.js';
import { guessCategory } from '../utils/scrapingHelpers.js';

/**
 * 汎用Web Scraping Service - 最小限実装
 */
export class WebScrapingService {
  private readonly headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };

  /**
   * メインエントリーポイント
   */
  async scrapeProductInfo(url: string): Promise<LLMExtractionResult> {
    try {
      // Amazon専用処理
      if (url.includes('amazon.')) {
        return await amazonScraper.scrapeAmazonProduct(url);
      }

      // 汎用スクレイピング
      const html = await this.fetchHTML(url);
      const result = this.extractBasicInfo(html, url);

      // If extraction found at least an image, keep it even if other fields failed
      if (result.imageUrl || result.extractedFields.length > 0) {
        return result;
      }

      // Complete failure - return fallback with URL
      return this.createFallback(url);
    } catch (error) {
      console.error(`Scraping failed for ${url}:`, error);
      return this.createFallback(url);
    }
  }

  /**
   * HTML取得
   */
  private async fetchHTML(url: string): Promise<string> {
    const response = await axios.get(url, {
      headers: this.headers,
      timeout: 10000
    });
    return response.data as string;
  }

  /**
   * 基本情報抽出（強化版）
   */
  private extractBasicInfo(html: string, url: string): LLMExtractionResult {
    const $ = cheerio.load(html);
    const extractedFields: string[] = [];

    // 製品名（強化版）
    const name = this.extractName($);
    if (name) extractedFields.push('name');

    // ブランド（強化版）
    const brand = this.extractBrand($, url, name);
    if (brand) extractedFields.push('brand');

    // 価格（強化版）
    const priceCents = this.extractPrice($);
    if (priceCents) extractedFields.push('priceCents');

    // 重量（新規）
    const weightGrams = this.extractWeight($);
    if (weightGrams) extractedFields.push('weightGrams');

    // 画像URL
    const imageUrl = this.extractImage($, url);
    if (imageUrl) extractedFields.push('imageUrl');

    // カテゴリ
    const suggestedCategory = this.guessCategoryFromPage(name || '', $);

    return {
      name: name || 'Unknown Product',
      brand: brand ? normalizeBrand(brand) : undefined,
      productUrl: url,
      imageUrl,
      weightGrams,
      priceCents,
      suggestedCategory,
      requiredQuantity: 1,
      ownedQuantity: 0,
      priority: 3,
      season: 'all',
      extractedFields,
      source: 'web_scraping'
    };
  }

  /**
   * 製品名抽出（強化版）
   */
  private extractName($: cheerio.Root): string | undefined {
    // JSON-LD構造化データから取得
    const jsonLd = this.extractJsonLdData($);
    if (jsonLd?.name && typeof jsonLd.name === 'string') {
      return jsonLd.name;
    }

    // OGタグから取得
    const ogTitle = $('meta[property="og:title"]').attr('content');
    if (ogTitle && ogTitle.length > 3 && ogTitle.length < 200) {
      return this.cleanTitle(ogTitle);
    }

    // HTML要素から取得
    const selectors = [
      'h1',
      '.product-title',
      '.product-name',
      '[class*="product"][class*="title"]',
      '[class*="productTitle"]',
      'title'
    ];
    
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 3 && text.length < 300) {
        return selector === 'title' ? this.cleanTitle(text) : text;
      }
    }
  }

  /**
   * ブランド抽出（統合版）
   */
  private extractBrand($: cheerio.Root, url: string, name?: string): string | undefined {
    // JSON-LD構造化データから取得
    const jsonLd = this.extractJsonLdData($);
    if (jsonLd?.brand) {
      const brandName = typeof jsonLd.brand === 'string' ? jsonLd.brand : jsonLd.brand?.name;
      if (brandName) return brandName;
    }

    // ドメインから判定
    const domainBrand = getBrandFromDomain(url);
    if (domainBrand) return domainBrand;

    // HTML要素から取得
    const selectors = [
      '[itemprop="brand"]',
      '.brand-name',
      '.product-brand',
      '[class*="brand"]',
      'meta[property="og:brand"]'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      const brand = element.attr('content') || element.text().trim();
      if (brand && brand.length > 1 && brand.length < 50) {
        return brand;
      }
    }

    // 製品名から抽出
    if (name) {
      return extractBrandFromText(name);
    }
  }

  /**
   * 価格抽出（強化版）
   */
  private extractPrice($: cheerio.Root): number | undefined {
    // JSON-LD構造化データから取得
    const jsonLd = this.extractJsonLdData($);
    if (jsonLd?.offers?.price || jsonLd?.price) {
      const price = jsonLd.offers?.price || jsonLd.price;
      const numPrice = typeof price === 'string' ? parseFloat(price) : price;
      if (numPrice) {
        return Math.round(numPrice * 100);
      }
    }

    // HTML要素から取得
    const selectors = [
      '.price',
      '.product-price',
      '[itemprop="price"]',
      '[class*="price"]',
      'meta[property="product:price:amount"]'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      const priceText = element.attr('content') || element.text().trim();
      
      // 価格パターン: ¥3,850 / $38.50 / 3850円
      const match = priceText.match(/[¥\$]?\s*([0-9,]+(?:\.[0-9]{1,2})?)/);
      if (match) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        return Math.round(value * 100);
      }
    }
  }

  /**
   * 重量抽出（強化版）
   */
  private extractWeight($: cheerio.Root): number | undefined {
    // より広範囲から重量を検索
    const searchSelectors = [
      '.product-description',
      '[class*="description"]',
      '[class*="spec"]',
      '[class*="detail"]',
      '[class*="info"]',
      '.product-detail',
      '.product-info',
      'table',
      'dl',
      'ul li',  // リスト項目
      '.accordion',  // アコーディオンメニュー
      '[role="tabpanel"]',  // タブコンテンツ
      'body'  // 最後の手段：ページ全体
    ];

    for (const selector of searchSelectors) {
      const text = $(selector).text();
      const weight = this.extractWeightFromText(text);
      if (weight) return weight;
    }
  }

  /**
   * JSON-LD構造化データ取得（キャッシュ）
   */
  private extractJsonLdData($: cheerio.Root): any | null {
    try {
      const jsonLdScript = $('script[type="application/ld+json"]').html();
      if (jsonLdScript) {
        return JSON.parse(jsonLdScript);
      }
    } catch (e) {
      // パース失敗
    }
    return null;
  }

  /**
   * テキストから重量を抽出
   */
  private extractWeightFromText(text: string): number | undefined {
    const patterns = [
      /重量[:\s]*(\d+(?:\.\d+)?)\s*(kg|g|グラム|キログラム)/i,
      /weight[:\s]*(\d+(?:\.\d+)?)\s*(kg|g|lbs|pounds|oz|ounce)/i,
      /(\d+(?:\.\d+)?)\s*(kg|g|グラム|キログラム)(?!\d)/i,
      /(\d+(?:\.\d+)?)\s*(oz|ounce)(?!\d)/i
    ];

    const lowerText = text.toLowerCase();
    for (const pattern of patterns) {
      const match = lowerText.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        
        if (unit.includes('k')) return Math.round(value * 1000);
        if (unit.includes('lb') || unit.includes('pound')) return Math.round(value * 453.592);
        if (unit.includes('oz') || unit.includes('ounce')) return Math.round(value * 28.3495);
        return Math.round(value);
      }
    }
  }

  /**
   * 画像URL抽出（強化版）
   */
  private extractImage($: cheerio.Root, baseUrl: string): string | undefined {
    // JSON-LD構造化データから取得
    const jsonLd = this.extractJsonLdData($);
    if (jsonLd?.image) {
      const imageUrl = Array.isArray(jsonLd.image) ? jsonLd.image[0] : jsonLd.image;
      if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
        return imageUrl;
      }
    }

    // OGタグ・メタタグから取得
    const metaSelectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'meta[property="og:image:secure_url"]'
    ];

    for (const selector of metaSelectors) {
      const src = $(selector).attr('content');
      if (src) {
        return this.normalizeUrl(src, baseUrl);
      }
    }

    // HTML要素から取得
    const imageSelectors = [
      '.product-image img',
      '.main-image img',
      '[itemprop="image"]',
      '[class*="product"][class*="image"] img',
      'img[alt*="product"]',
      'img[alt*="商品"]',
      'img[data-src]',
      'img[data-lazy]'
    ];

    for (const selector of imageSelectors) {
      const element = $(selector).first();
      const src = element.attr('data-src') || element.attr('data-lazy') || element.attr('src');
      
      if (src) {
        const normalized = this.normalizeUrl(src, baseUrl);
        if (normalized) return normalized;
      }
    }
  }

  /**
   * URL正規化（相対パス対応）
   */
  private normalizeUrl(src: string, baseUrl: string): string | undefined {
    if (!src) return undefined;

    if (src.startsWith('http')) {
      return src;
    } else if (src.startsWith('//')) {
      return 'https:' + src;
    } else if (src.startsWith('/')) {
      try {
        const url = new URL(baseUrl);
        return `${url.protocol}//${url.host}${src}`;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * カテゴリ推測（強化版）
   */
  private guessCategoryFromPage(name: string, $: cheerio.Root): string {
    // より関連性の高いテキストを優先
    const title = $('h1').text();
    const breadcrumbs = $('[class*="breadcrumb"]').text();
    const category = $('[class*="category"]').text();
    const description = $('.product-description').first().text().substring(0, 500);
    
    const combinedText = [name, title, breadcrumbs, category, description].join(' ');
    return guessCategory(combinedText);
  }

  /**
   * タイトルクリーニング
   */
  private cleanTitle(title: string): string {
    return title
      .replace(/\s*[-|]\s*(通販|販売|Amazon|楽天).*$/i, '')
      .replace(/【.*?】/g, '')
      .trim();
  }

  /**
   * フォールバック（URL保持）
   */
  private createFallback(url: string): LLMExtractionResult {
    // Try to extract domain name for better UX
    let domainName = 'Unknown Product';
    try {
      const urlObj = new URL(url);
      domainName = urlObj.hostname.replace('www.', '').split('.')[0];
      domainName = domainName.charAt(0).toUpperCase() + domainName.slice(1) + ' Product';
    } catch {
      // Keep default if URL parsing fails
    }

    return {
      name: domainName,
      productUrl: url,
      suggestedCategory: 'Other',
      requiredQuantity: 1,
      ownedQuantity: 0,
      priority: 3,
      season: 'all',
      extractedFields: [],
      source: 'fallback',
      confidence: 0.2
    };
  }
}

export const webScrapingService = new WebScrapingService();