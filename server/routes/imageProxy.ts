import { Router, Request, Response } from 'express';
import axios from 'axios';
import { assertSafeExternalUrl } from '../utils/ssrfGuard.js';
import { logger } from '../utils/logger.js';

const router = Router();

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const FETCH_TIMEOUT_MS = 10000;

/**
 * 画像プロキシエンドポイント
 * 外部画像URLをプロキシしてCORS問題を回避。
 * SSRF 対策として http(s) プロトコル限定、プライベート IP 拒否、
 * リダイレクト禁止、content-type 検証、サイズ上限を適用する。
 */
router.get('/proxy', async (req: Request, res: Response) => {
  const rawUrl = req.query.url;
  if (typeof rawUrl !== 'string' || rawUrl.length === 0) {
    return res.status(400).json({ success: false, message: 'Image URL is required' });
  }
  if (rawUrl.length > 2048) {
    return res.status(400).json({ success: false, message: 'URL is too long' });
  }

  let safeUrl: URL;
  try {
    safeUrl = await assertSafeExternalUrl(rawUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'URL validation failed';
    return res.status(400).json({ success: false, message });
  }

  try {
    const response = await axios.get(safeUrl.toString(), {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*',
      },
      timeout: FETCH_TIMEOUT_MS,
      maxRedirects: 0,
      maxContentLength: MAX_IMAGE_BYTES,
      validateStatus: status => status >= 200 && status < 300,
    });

    const contentType = String(response.headers['content-type'] || '');
    if (!contentType.startsWith('image/')) {
      return res.status(415).json({ success: false, message: 'Resource is not an image' });
    }

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(response.data);
  } catch (error) {
    logger.error({ err: error }, 'Image proxy error:');
    res.status(502).json({ success: false, message: 'Failed to fetch image' });
  }
});

export default router;
