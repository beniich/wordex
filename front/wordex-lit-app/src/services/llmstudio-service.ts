// front/wordex-lit-app/src/services/llmstudio-service.ts

export interface LLMStudioResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    }
  }>;
}

export class LLMStudioService {
  private static API_URL = "/api/llmstudio/chat/completions";

  static async chat(messages: any[], options: { model?: string, temperature?: number, maxTokens?: number } = {}): Promise<LLMStudioResponse> {
    const response = await fetch(this.API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: options.model || "default",
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1024,
        stream: false,
      })
    });

    if (!response.ok) {
      throw new Error(`LLM Studio API Error: ${response.statusText}`);
    }

    return await response.json();
  }
}
