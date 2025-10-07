import axios from 'axios';
import * as cheerio from 'cheerio';
import { LLMExtractionResult } from '../models/types.js';
import { amazonScraper } from './amazonScraper.js';
import { normalizeBrand, extractBrandFromText, getBrandFromDomain } from '../utils/brandUtils.js';

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
      return this.extractBasicInfo(html, url);
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
   * 基本情報抽出
   */
  private extractBasicInfo(html: string, url: string): LLMExtractionResult {
    const $ = cheerio.load(html);

    // 製品名
    const name = this.extractName($);

    // ブランド
    const brand = getBrandFromDomain(url) ||
                  this.extractBrandFromHTML($) ||
                  (name ? extractBrandFromText(name) : undefined);

    // 価格
    const priceCents = this.extractPrice($);

    // 画像URL
    const imageUrl = this.extractImage($, url);

    // カテゴリ
    const suggestedCategory = this.guessCategory(name || '', $);

    return {
      name: name || 'Unknown Product',
      brand: brand ? normalizeBrand(brand) : undefined,
      productUrl: url,
      imageUrl,
      priceCents,
      suggestedCategory,
      requiredQuantity: 1,
      ownedQuantity: 0,
      priority: 3,
      season: 'all',
      extractedFields: [
        ...(name ? ['name'] : []),
        ...(brand ? ['brand'] : []),
        ...(priceCents ? ['priceCents'] : []),
        ...(imageUrl ? ['imageUrl'] : [])
      ],
      source: 'web_scraping'
    };
  }

  /**
   * 製品名抽出
   */
  private extractName($: cheerio.Root): string | undefined {
    const selectors = ['h1', '.product-title', '.product-name', 'title'];
    
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 3 && text.length < 200) {
        return selector === 'title' ? this.cleanTitle(text) : text;
      }
    }
  }

  /**
   * ブランド抽出
   */
  private extractBrandFromHTML($: cheerio.Root): string | undefined {
    const selectors = ['[itemprop="brand"]', '.brand-name', '.product-brand'];
    
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
    const selectors = ['.price', '.product-price', '[itemprop="price"]'];

    for (const selector of selectors) {
      const priceText = $(selector).first().text().trim();
      const match = priceText.match(/[\d,]+/);
      if (match) {
        return parseInt(match[0].replace(/,/g, '')) * 100; // セント変換
      }
    }
  }

  /**
   * 画像URL抽出
   */
  private extractImage($: cheerio.Root, baseUrl: string): string | undefined {
    const selectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      '.product-image img',
      '.main-image img',
      '[itemprop="image"]',
      'img[alt*="product"]',
      'img[alt*="商品"]'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      const src = element.attr('content') || element.attr('src');

      if (src && src.startsWith('http')) {
        return src;
      } else if (src && src.startsWith('/')) {
        // 相対パスを絶対パスに変換
        try {
          const url = new URL(baseUrl);
          return `${url.protocol}//${url.host}${src}`;
        } catch {
          return undefined;
        }
      }
    }
    return undefined;
  }

  /**
   * カテゴリ推測
   */
  private guessCategory(name: string, $: cheerio.Root): string {
    const text = (name + ' ' + $('body').text()).toLowerCase();
    
    if (/テント|tent|タープ|tarp/.test(text)) return 'Shelter';
    if (/ジャケット|jacket|パンツ|pants/.test(text)) return 'Clothing';
    if (/ストーブ|stove|クッカー|cooker/.test(text)) return 'Cooking';
    if (/ライト|light|救急|first.?aid/.test(text)) return 'Safety';
    if (/リュック|backpack|バックパック|ザック/.test(text)) return 'Backpack';
    
    return 'Other';
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
   * フォールバック
   */
  private createFallback(url: string): LLMExtractionResult {
    return {
      name: 'Failed to Extract',
      productUrl: url,
      suggestedCategory: 'Other',
      requiredQuantity: 1,
      ownedQuantity: 0,
      priority: 3,
      season: 'all',
      extractedFields: [],
      source: 'fallback'
    };
  }
}

export const webScrapingService = new WebScrapingService();