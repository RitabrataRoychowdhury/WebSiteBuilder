import { LLMService, LLMConfig, LLMResponse, ProviderInfo, ProviderConfig, ErrorType, LLMError } from '../types/llm';
import { RetryHandler } from '../utils/retryHandler';

export abstract class BaseLLMService implements LLMService {
  protected config: ProviderConfig;
  protected defaultLLMConfig: LLMConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.defaultLLMConfig = config.defaultConfig;
  }

  abstract generateCompletion(prompt: string, config?: Partial<LLMConfig>): Promise<LLMResponse>;
  abstract getProviderInfo(): ProviderInfo;
  
  protected abstract makeAPIRequest(prompt: string, config: LLMConfig): Promise<LLMResponse>;

  async generateCompletionWithRetry(prompt: string, config?: Partial<LLMConfig>): Promise<LLMResponse> {
    const finalConfig = { ...this.defaultLLMConfig, ...config };
    
    return RetryHandler.executeWithRetry(
      () => this.makeAPIRequest(prompt, finalConfig),
      { maxAttempts: finalConfig.retryAttempts }
    );
  }

  validateResponse(response: string): boolean {
    if (!response || typeof response !== 'string') {
      return false;
    }

    // Basic validation - non-empty and reasonable length
    if (response.trim().length === 0) {
      return false;
    }

    // Check for common error patterns
    const errorPatterns = [
      /error/i,
      /failed/i,
      /unable to/i,
      /cannot/i,
      /invalid/i
    ];

    // If response is very short and contains error keywords, it's likely invalid
    if (response.length < 50 && errorPatterns.some(pattern => pattern.test(response))) {
      return false;
    }

    return true;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const testPrompt = "Hello, please respond with 'OK'";
      const response = await this.generateCompletion(testPrompt, { 
        maxTokens: 10,
        temperature: 0 
      });
      return this.validateResponse(response.content);
    } catch (error) {
      console.warn(`Health check failed for ${this.config.name}:`, error);
      return false;
    }
  }

  protected handleAPIError(error: any, context: string): never {
    let errorType: ErrorType;
    let message: string;
    let retryable = true;

    if (error.status) {
      switch (error.status) {
        case 401:
        case 403:
          errorType = ErrorType.AUTHENTICATION_ERROR;
          message = `Authentication failed for ${this.config.name}`;
          retryable = false;
          break;
        case 429:
          errorType = ErrorType.API_RATE_LIMIT;
          message = `Rate limit exceeded for ${this.config.name}`;
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorType = ErrorType.PROVIDER_UNAVAILABLE;
          message = `${this.config.name} service unavailable`;
          break;
        default:
          errorType = ErrorType.NETWORK_ERROR;
          message = `API request failed: ${error.status}`;
      }
    } else if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      errorType = ErrorType.TIMEOUT_ERROR;
      message = `Request timeout for ${this.config.name}`;
    } else {
      errorType = ErrorType.NETWORK_ERROR;
      message = `Network error: ${error.message}`;
    }

    throw new LLMError(errorType, `${context}: ${message}`, this.config.name, retryable, error);
  }

  protected createAbortController(timeoutMs: number): AbortController {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeoutMs);
    return controller;
  }
}