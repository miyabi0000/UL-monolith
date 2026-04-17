/**
 * SSE ストリーミング版アドバイザー API クライアント
 * fetch + ReadableStream で SSE をパース（EventSource は POST 非対応のため不使用）
 */
import { API_CONFIG, getHeaders } from './api.client';
import type { AdvisorMessage, GearAdvisorContext, GearRef, SuggestedEdit } from './llmAdvisor';

export interface StreamCallbacks {
  onToken: (text: string) => void;
  onTool: (name: string, data: GearRef[] | SuggestedEdit[]) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

/**
 * SSE でアドバイザーにストリーミングリクエストを送信
 * フォールバック（JSON応答）にも対応
 */
export async function streamAdvisor(
  conversation: AdvisorMessage[],
  gearContext: GearAdvisorContext,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const url = `${API_CONFIG.baseUrl}/llm/advisor/stream`;
  const headers = await getHeaders();

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ conversation, gearContext }),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error');
    callbacks.onError(new Error(`HTTP ${response.status}: ${text}`));
    return;
  }

  // フォールバック: Content-Type が JSON なら非ストリーミング応答
  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('application/json')) {
    const json = await response.json();
    if (json.success && json.data) {
      callbacks.onToken(json.data.message);
      if (json.data.gearRefs?.length > 0) {
        callbacks.onTool('reference_gear', json.data.gearRefs);
      }
      if (json.data.suggestedEdits?.length > 0) {
        callbacks.onTool('suggest_edits', json.data.suggestedEdits);
      }
      callbacks.onDone();
    } else {
      callbacks.onError(new Error(json.message || 'Unknown error'));
    }
    return;
  }

  // SSE ストリーミング応答
  if (!response.body) {
    callbacks.onError(new Error('No response body'));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    let reading = true;
    while (reading) {
      const { done, value } = await reader.read();
      if (done) { reading = false; continue; }

      buffer += decoder.decode(value, { stream: true });

      // SSE イベントをパース（\n\n で区切り）
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        if (!part.trim()) continue;

        let eventType = '';
        let data = '';

        for (const line of part.split('\n')) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            data = line.slice(6);
          }
        }

        if (!data) continue;

        try {
          const parsed = JSON.parse(data);

          switch (eventType) {
            case 'token':
              callbacks.onToken(parsed.text);
              break;
            case 'tool':
              callbacks.onTool(parsed.name, parsed.data);
              break;
            case 'done':
              callbacks.onDone();
              break;
            case 'error':
              callbacks.onError(new Error(parsed.message));
              break;
          }
        } catch {
          // 不正な JSON は無視
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
