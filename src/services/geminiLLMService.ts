import { BaseLLMService } from './baseLLMService';
import { LLMConfig, LLMResponse, ProviderInfo, ProviderConfig, ErrorType, LLMError } from '../types/llm';

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig: {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiLLMService extends BaseLLMService {
  private static readonly PROVIDER_INFO: ProviderInfo = {
    name: 'Gemini',
    models: [
      'gemini-2.0-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash'
    ],
    defaultModel: 'gemini-2.0-flash',
    maxTokens: 8192,
    supportsStreaming: false
  };

  constructor(apiKey: string, model?: string) {
    const config: ProviderConfig = {
      name: 'Gemini',
      apiKey,
      baseUrl: `https://generativelanguage.googleapis.com/v1beta/models/${model || GeminiLLMService.PROVIDER_INFO.defaultModel}:generateContent`,
      defaultModel: model || GeminiLLMService.PROVIDER_INFO.defaultModel,
      defaultConfig: {
        model: model || GeminiLLMService.PROVIDER_INFO.defaultModel,
        temperature: 0.7,
        maxTokens: 4000,
        retryAttempts: 3,
        timeout: 30000
      }
    };
    super(config);
  }

  async generateCompletion(prompt: string, config?: Partial<LLMConfig>): Promise<LLMResponse> {
    return this.generateCompletionWithRetry(prompt, config);
  }

  protected async makeAPIRequest(prompt: string, config: LLMConfig): Promise<LLMResponse> {
    const controller = this.createAbortController(config.timeout);
    
    const requestBody: GeminiRequest = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: config.temperature,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: config.maxTokens,
      }
    };

    const url = `${this.config.baseUrl}?key=${this.config.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      if (!response.ok) {
        this.handleAPIError({ status: response.status, statusText: response.statusText }, 'Gemini API request');
      }

      const data: GeminiResponse = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new LLMError(
          ErrorType.INVALID_RESPONSE,
          'No candidates returned from Gemini API',
          this.config.name,
          true
        );
      }

      const candidate = data.candidates[0];
      const content = candidate.content.parts[0].text;

      if (!this.validateResponse(content)) {
        throw new LLMError(
          ErrorType.VALIDATION_ERROR,
          'Generated response failed validation',
          this.config.name,
          true
        );
      }

      return {
        content,
        model: config.model,
        tokensUsed: data.usageMetadata?.totalTokenCount,
        finishReason: candidate.finishReason,
        metadata: {
          promptTokens: data.usageMetadata?.promptTokenCount,
          completionTokens: data.usageMetadata?.candidatesTokenCount
        }
      };

    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      this.handleAPIError(error, 'Gemini API request');
    }
  }

  getProviderInfo(): ProviderInfo {
    return GeminiLLMService.PROVIDER_INFO;
  }

  // Static factory method for easy instantiation
  static create(apiKey?: string, model?: string): GeminiLLMService {
    const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) {
      throw new LLMError(
        ErrorType.AUTHENTICATION_ERROR,
        'Gemini API key is required. Set VITE_GEMINI_API_KEY environment variable.',
        'Gemini',
        false
      );
    }
    return new GeminiLLMService(key, model);
  }
}