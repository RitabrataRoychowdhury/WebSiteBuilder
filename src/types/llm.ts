// LLM Service Types and Interfaces

export interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  retryAttempts: number;
  timeout: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  tokensUsed?: number;
  finishReason?: string;
  metadata?: Record<string, any>;
}

export interface ProviderInfo {
  name: string;
  models: string[];
  defaultModel: string;
  maxTokens: number;
  supportsStreaming: boolean;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// Error Types
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

export class LLMError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public provider?: string,
    public retryable: boolean = true,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

// Base LLM Service Interface
export interface LLMService {
  generateCompletion(prompt: string, config?: Partial<LLMConfig>): Promise<LLMResponse>;
  validateResponse(response: string): boolean;
  getProviderInfo(): ProviderInfo;
  isHealthy(): Promise<boolean>;
}

// Provider Configuration
export interface ProviderConfig {
  name: string;
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  defaultConfig: LLMConfig;
}