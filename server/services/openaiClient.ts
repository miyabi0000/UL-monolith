import OpenAI from 'openai';
import type { ChatCompletion, ChatCompletionChunk, ChatCompletionTool } from 'openai/resources/chat/completions';
import type { Stream } from 'openai/streaming';

/**
 * シンプルなOpenAI Client
 */
export class OpenAIClient {
  private openai: OpenAI | null;
  private readonly defaultModel = 'gpt-4o';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('[OpenAI] API key not configured - LLM features will use fallback responses');
      this.openai = null;
    } else {
      this.openai = new OpenAI({ apiKey });
      console.log('[OpenAI] Client initialized successfully');
    }
  }

  /**
   * チャット完了API呼び出し（シングルターン）
   */
  async chatCompletion(systemPrompt: string, userMessage: string): Promise<string> {
    if (!this.openai) {
      console.warn('[OpenAI] API key not configured, using fallback response');
      throw new Error('OpenAI client not available');
    }

    const completion = await this.openai.chat.completions.create({
      model: this.defaultModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return content;
  }

  /**
   * JSON mode での抽出系呼び出し
   *
   * OpenAI の `response_format: { type: 'json_object' }` を強制して、
   * 返り値が必ず parseable な JSON object になることを保証する。
   * system prompt に "JSON" の文字を含める必要があるため、JSON mode の
   * 利用には呼び出し側プロンプトで明示的に JSON で返す指示を入れること。
   *
   * @param systemPrompt JSON 返却指示を含む system prompt
   * @param userMessage 入力テキスト
   * @param options.model モデル上書き。未指定時はデフォルト (gpt-4o)
   * @param options.maxTokens 最大トークン数。デフォルト 800
   * @param options.temperature 温度。デフォルト 0.1 (抽出タスク向け)
   * @returns パース済み JSON オブジェクト
   */
  async chatCompletionJson<T = unknown>(
    systemPrompt: string,
    userMessage: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    } = {},
  ): Promise<T> {
    if (!this.openai) {
      throw new Error('OpenAI client not available');
    }

    const completion = await this.openai.chat.completions.create({
      model: options.model ?? this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: options.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? 800,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // JSON mode では必ず JSON が返るが、念のため try-catch
    try {
      return JSON.parse(content) as T;
    } catch (err) {
      throw new Error(`Failed to parse JSON response: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * マルチターン会話API呼び出し
   * @param systemPrompt システムプロンプト
   * @param messages 会話履歴（user/assistantの交互メッセージ）
   * @param maxTokens レスポンスの最大トークン数
   */
  async chatWithHistory(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    maxTokens = 1500
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI client not available');
    }

    const completion = await this.openai.chat.completions.create({
      model: this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return content;
  }

  /**
   * ツール付きチャート完了API呼び出し（Function Calling）
   */
  async chatWithTools(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    tools: ChatCompletionTool[],
    maxTokens = 1500,
  ): Promise<ChatCompletion> {
    if (!this.openai) {
      throw new Error('OpenAI client not available');
    }

    return this.openai.chat.completions.create({
      model: this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      tools,
      tool_choice: 'auto',
      parallel_tool_calls: true,
      temperature: 0.3,
      max_tokens: maxTokens,
    });
  }

  /**
   * ツール付きストリーミングAPI呼び出し（SSE用）
   */
  chatWithToolsStream(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    tools: ChatCompletionTool[],
    maxTokens = 1500,
  ): Promise<Stream<ChatCompletionChunk>> {
    if (!this.openai) {
      throw new Error('OpenAI client not available');
    }

    return this.openai.chat.completions.create({
      model: this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      tools,
      tool_choice: 'auto',
      parallel_tool_calls: true,
      temperature: 0.3,
      max_tokens: maxTokens,
      stream: true,
    });
  }

  /**
   * ヘルスチェック
   */
  async healthCheck(): Promise<boolean> {
    if (!this.openai) {
      return false;
    }

    try {
      await this.chatCompletion('You are a test.', 'Say OK');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 利用可能かどうか
   */
  isAvailable(): boolean {
    return this.openai !== null;
  }

  /**
   * 使用モデル名
   */
  getModel(): string {
    return this.defaultModel;
  }
}

export const openaiClient = new OpenAIClient();
