import OpenAI from 'openai';

/**
 * OpenAI Client - シンプルなラッパー
 */
export class OpenAIClient {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('Warning: OPENAI_API_KEY not set - API calls will fail and fallback to mock responses');
      // フォールバック用のダミークライアント
      this.openai = null as any;
    } else {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async chatCompletion(prompt: string, userMessage: string): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.openai) {
      return false;
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5
      });
      return !!completion.choices[0]?.message?.content;
    } catch {
      return false;
    }
  }
}

export const openaiClient = new OpenAIClient();