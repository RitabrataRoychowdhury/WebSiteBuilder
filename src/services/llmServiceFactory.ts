import { LLMService, ErrorType, LLMError } from '../types/llm';
import { OpenRouterService } from './openRouterService';
import { GeminiLLMService } from './geminiLLMService';

export type ProviderType = 'openrouter' | 'gemini';

export interface ServiceFactoryConfig {
  primaryProvider?: ProviderType;
  fallbackProvider?: ProviderType;
  enableFallback?: boolean;
}

export class LLMServiceFactory {
  private static services: Map<ProviderType, LLMService> = new Map();
  private static config: ServiceFactoryConfig = {
    primaryProvider: 'openrouter',
    fallbackProvider: 'gemini',
    enableFallback: true
  };

  static configure(config: Partial<ServiceFactoryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  static async getService(provider?: ProviderType): Promise<LLMService> {
    const targetProvider = provider || this.config.primaryProvider || 'openrouter';
    
    // Return cached service if available
    if (this.services.has(targetProvider)) {
      const service = this.services.get(targetProvider)!;
      
      // Check if service is healthy
      if (await service.isHealthy()) {
        return service;
      } else {
        // Remove unhealthy service from cache
        this.services.delete(targetProvider);
      }
    }

    // Create new service instance
    const service = this.createService(targetProvider);
    
    // Verify service is healthy before caching
    if (await service.isHealthy()) {
      this.services.set(targetProvider, service);
      return service;
    }

    // If primary service is unhealthy and fallback is enabled, try fallback
    if (this.config.enableFallback && targetProvider === this.config.primaryProvider && this.config.fallbackProvider) {
      console.warn(`Primary provider ${targetProvider} is unhealthy, trying fallback ${this.config.fallbackProvider}`);
      return this.getService(this.config.fallbackProvider);
    }

    throw new LLMError(
      ErrorType.PROVIDER_UNAVAILABLE,
      `Provider ${targetProvider} is not available`,
      targetProvider,
      false
    );
  }

  static async getServiceWithFallback(): Promise<LLMService> {
    try {
      return await this.getService();
    } catch (error) {
      if (this.config.enableFallback && this.config.fallbackProvider) {
        console.warn('Primary provider failed, using fallback:', error);
        return await this.getService(this.config.fallbackProvider);
      }
      throw error;
    }
  }

  private static createService(provider: ProviderType): LLMService {
    try {
      switch (provider) {
        case 'openrouter':
          return OpenRouterService.create();
        case 'gemini':
          return GeminiLLMService.create();
        default:
          throw new LLMError(
            ErrorType.VALIDATION_ERROR,
            `Unknown provider: ${provider}`,
            provider,
            false
          );
      }
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      throw new LLMError(
        ErrorType.CONFIGURATION_ERROR,
        `Failed to create LLM service for ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider,
        false,
        error instanceof Error ? error : undefined
      );
    }
  }

  static getSupportedProviders(): ProviderType[] {
    return ['openrouter', 'gemini'];
  }

  static isProviderSupported(provider: string): provider is ProviderType {
    return this.getSupportedProviders().includes(provider as ProviderType);
  }

  static getAvailableProviders(): ProviderType[] {
    return ['openrouter', 'gemini'];
  }

  static async getHealthyProviders(): Promise<ProviderType[]> {
    const providers = this.getAvailableProviders();
    const healthyProviders: ProviderType[] = [];

    for (const provider of providers) {
      try {
        const service = this.createService(provider);
        if (await service.isHealthy()) {
          healthyProviders.push(provider);
        }
      } catch (error) {
        console.warn(`Provider ${provider} is not available:`, error);
      }
    }

    return healthyProviders;
  }

  static clearCache(): void {
    this.services.clear();
  }

  static getConfig(): ServiceFactoryConfig {
    return { ...this.config };
  }
}