// LLM Service Exports
export { BaseLLMService } from '../baseLLMService';
export { OpenRouterService } from '../openRouterService';
export { GeminiLLMService } from '../geminiLLMService';
export { LLMServiceFactory, type ProviderType, type ServiceFactoryConfig } from '../llmServiceFactory';
export { RetryHandler } from '../../utils/retryHandler';

// Re-export types
export * from '../../types/llm';

// Convenience function for quick setup
export async function createLLMService(provider?: ProviderType) {
  return LLMServiceFactory.getServiceWithFallback();
}

// Health check utility
export async function checkProviderHealth() {
  return LLMServiceFactory.getHealthyProviders();
}