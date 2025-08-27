import { BaseLLMService } from './baseLLMService';
import { LLMConfig, LLMResponse, ProviderInfo, ProviderConfig, ErrorType, LLMError } from '../types/llm';

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterService extends BaseLLMService {
  private static readonly PROVIDER_INFO: ProviderInfo = {
    name: 'OpenRouter',
    models: [
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'google/gemini-pro-1.5',
      'meta-llama/llama-3.1-405b-instruct'
    ],
    defaultModel: 'anthropic/claude-3.5-sonnet',
    maxTokens: 200000,
    supportsStreaming: true
  };

  constructor(apiKey: string, baseUrl?: string) {
    const config: ProviderConfig = {
      name: 'OpenRouter',
      apiKey,
      baseUrl: baseUrl || 'https://openrouter.ai/api/v1/chat/completions',
      defaultModel: OpenRouterService.PROVIDER_INFO.defaultModel,
      defaultConfig: {
        model: OpenRouterService.PROVIDER_INFO.defaultModel,
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
    
    const requestBody: OpenRouterRequest = {
      model: config.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens
    };

    try {
      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'LLM Workflow System'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      if (!response.ok) {
        this.handleAPIError({ status: response.status, statusText: response.statusText }, 'OpenRouter API request');
      }

      const data: OpenRouterResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new LLMError(
          ErrorType.INVALID_RESPONSE,
          'No choices returned from OpenRouter API',
          this.config.name,
          true
        );
      }

      const choice = data.choices[0];
      const content = choice.message.content;

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
        model: data.model,
        tokensUsed: data.usage?.total_tokens,
        finishReason: choice.finish_reason,
        metadata: {
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          id: data.id
        }
      };

    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      this.handleAPIError(error, 'OpenRouter API request');
    }
  }

  getProviderInfo(): ProviderInfo {
    return OpenRouterService.PROVIDER_INFO;
  }

  // Static factory method for easy instantiation
  static create(apiKey?: string): OpenRouterService {
    const key = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!key) {
      throw new LLMError(
        ErrorType.AUTHENTICATION_ERROR,
        'OpenRouter API key is required. Set VITE_OPENROUTER_API_KEY environment variable.',
        'OpenRouter',
        false
      );
    }
    return new OpenRouterService(key);
  }
}