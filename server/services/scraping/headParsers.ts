import * as cheerio from 'cheerio';

/**
 * JSON-LD / OGP 抽出の集約モジュール
 */

export interface OgpData {
  title?: string;
  image?: string;
  imageSecure?: string;
  twitterImage?: string;
  brand?: string;
}

/** JSON-LD構造化データを抽出 */
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

/** OGPメタタグを一括抽出 */
export function extractOgp($: cheerio.Root): OgpData {
  return {
    title: $('meta[property="og:title"]').attr('content') || undefined,
    image: $('meta[property="og:image"]').attr('content') || undefined,
    imageSecure: $('meta[property="og:image:secure_url"]').attr('content') || undefined,
    twitterImage: $('meta[name="twitter:image"]').attr('content') || undefined,
    brand: $('meta[property="og:brand"]').attr('content') || undefined,
  };
}
