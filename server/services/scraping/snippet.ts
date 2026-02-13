import * as cheerio from 'cheerio';

/**
 * LLMに渡すHTMLスニペット抽出
 * ページ全体ではなく、製品情報が含まれやすい領域のみ抽出して数KBに制限
 */

const MAX_SNIPPET_BYTES = 4096;

/** HTMLから製品情報スニペットを抽出（純粋関数） */
export function extractSnippets(html: string): string {
  const $ = cheerio.load(html);
  const parts: string[] = [];

  // 1. title + h1
  const title = $('title').text().trim();
  if (title) parts.push(`[title] ${title}`);
  const h1 = $('h1').first().text().trim();
  if (h1 && h1 !== title) parts.push(`[h1] ${h1}`);

  // 2. スペック表（table / dl）
  const specSelectors = [
    '#productDetails_techSpec_section_1',  // Amazon
    '#prodDetails',                         // Amazon
    '[class*="spec"] table',
    '[class*="detail"] table',
    'table',
    'dl',
  ];
  for (const sel of specSelectors) {
    const text = $(sel).first().text().replace(/\s+/g, ' ').trim();
    if (text && text.length > 20 && text.length < 2000) {
      parts.push(`[spec] ${text.slice(0, 1500)}`);
      break;
    }
  }

  // 3. 箇条書き（feature bullets）
  const bulletSelectors = [
    '#feature-bullets li',    // Amazon
    '[class*="feature"] li',
    '.product-description li',
    '[class*="spec"] li',
  ];
  for (const sel of bulletSelectors) {
    const items = $(sel).map((_, el) => $(el).text().trim()).get().filter(t => t.length > 5);
    if (items.length > 0) {
      parts.push(`[bullets] ${items.slice(0, 10).join(' / ')}`);
      break;
    }
  }

  // 4. 製品説明の冒頭
  const descSelectors = [
    '#productDescription',
    '.product-description',
    '[class*="description"]',
    '[itemprop="description"]',
  ];
  for (const sel of descSelectors) {
    const text = $(sel).first().text().replace(/\s+/g, ' ').trim();
    if (text && text.length > 30) {
      parts.push(`[desc] ${text.slice(0, 800)}`);
      break;
    }
  }

  // バイト数制限（比率ベースで一発カット）
  const result = parts.join('\n');
  const byteLen = Buffer.byteLength(result, 'utf8');
  if (byteLen <= MAX_SNIPPET_BYTES) return result;

  const ratio = MAX_SNIPPET_BYTES / byteLen;
  return result.slice(0, Math.floor(result.length * ratio));
}
