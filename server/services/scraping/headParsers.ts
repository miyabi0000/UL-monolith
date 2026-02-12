import * as cheerio from 'cheerio';

/**
 * JSON-LD / OGP 抽出を1箇所に集約するモジュール
 * 既存の scrapingHelpers.extractJsonLd と webScrapingService.extractJsonLdData の重複を解消
 */

// ==================== 型定義 ====================

export interface OgpData {
  title?: string;
  image?: string;
  imageSecure?: string;
  twitterImage?: string;
  brand?: string;
}

// ==================== JSON-LD ====================

/**
 * JSON-LD構造化データを抽出
 * ページ内の最初の application/ld+json スクリプトをパースして返す
 */
export function extractJsonLd($: cheerio.Root): Record<string, unknown> | null {
  try {
    const jsonLdScript = $('script[type="application/ld+json"]').html();
    if (jsonLdScript) {
      return JSON.parse(jsonLdScript);
    }
  } catch {
    // パース失敗
  }
  return null;
}

// ==================== OGP ====================

/**
 * OGP（Open Graph Protocol）メタタグを一括抽出
 * og:title, og:image, og:brand, twitter:image 等をまとめて返す
 */
export function extractOgp($: cheerio.Root): OgpData {
  return {
    title: $('meta[property="og:title"]').attr('content') || undefined,
    image: $('meta[property="og:image"]').attr('content') || undefined,
    imageSecure: $('meta[property="og:image:secure_url"]').attr('content') || undefined,
    twitterImage: $('meta[name="twitter:image"]').attr('content') || undefined,
    brand: $('meta[property="og:brand"]').attr('content') || undefined,
  };
}
