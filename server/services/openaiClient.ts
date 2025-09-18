import OpenAI from 'openai';

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
   * チャット完了API呼び出し
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