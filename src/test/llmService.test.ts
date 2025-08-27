import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenRouterService } from '../services/openRouterService';
import { GeminiLLMService } from '../services/geminiLLMService';
import { LLMServiceFactory } from '../services/llmServiceFactory';
import { RetryHandler } from '../utils/retryHandler';
import { ErrorType, LLMError } from '../types/llm';

// Mock fetch globally
global.fetch = vi.fn();

describe('LLM Service Implementation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    LLMServiceFactory.clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('OpenRouterService', () => {
    it('should create service with API key', () => {
      const service = new OpenRouterService('test-key');
      expect(service).toBeDefined();
      expect(service.getProviderInfo().name).toBe('OpenRouter');
    });

    it('should generate completion successfully', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          id: 'test-id',
          object: 'chat.completion',
          created: Date.now(),
          model: 'anthropic/claude-3.5-sonnet',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello, this is a test response.'
            },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30
          }
        })
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const service = new OpenRouterService('test-key');
      const result = await service.generateCompletion('Test prompt');

      expect(result.content).toBe('Hello, this is a test response.');
      expect(result.model).toBe('anthropic/claude-3.5-sonnet');
      expect(result.tokensUsed).toBe(30);
    });

    it('should handle API errors properly', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const service = new OpenRouterService('invalid-key');
      
      await expect(service.generateCompletion('Test prompt')).rejects.toThrow(LLMError);
    });

    it('should validate responses correctly', () => {
      const service = new OpenRouterService('test-key');
      
      expect(service.validateResponse('Valid response')).toBe(true);
      expect(service.validateResponse('')).toBe(false);
      expect(service.validateResponse('error')).toBe(false);
    });
  });

  describe('GeminiLLMService', () => {
    it('should create service with API key', () => {
      const service = new GeminiLLMService('test-key');
      expect(service).toBeDefined();
      expect(service.getProviderInfo().name).toBe('Gemini');
    });

    it('should generate completion successfully', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: 'Hello, this is a Gemini response.'
              }]
            },
            finishReason: 'STOP'
          }],
          usageMetadata: {
            promptTokenCount: 5,
            candidatesTokenCount: 15,
            totalTokenCount: 20
          }
        })
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const service = new GeminiLLMService('test-key');
      const result = await service.generateCompletion('Test prompt');

      expect(result.content).toBe('Hello, this is a Gemini response.');
      expect(result.tokensUsed).toBe(20);
    });
  });

  describe('LLMServiceFactory', () => {
    it('should configure factory settings', () => {
      LLMServiceFactory.configure({
        primaryProvider: 'gemini',
        fallbackProvider: 'openrouter'
      });

      const config = LLMServiceFactory.getConfig();
      expect(config.primaryProvider).toBe('gemini');
      expect(config.fallbackProvider).toBe('openrouter');
    });

    it('should return available providers', () => {
      const providers = LLMServiceFactory.getAvailableProviders();
      expect(providers).toContain('openrouter');
      expect(providers).toContain('gemini');
    });

    it('should handle provider creation errors', async () => {
      // Mock environment to not have API keys
      vi.stubEnv('VITE_OPENROUTER_API_KEY', '');
      vi.stubEnv('VITE_GEMINI_API_KEY', '');

      await expect(LLMServiceFactory.getService('openrouter')).rejects.toThrow(LLMError);
    });
  });

  describe('RetryHandler', () => {
    it('should retry on retryable errors', async () => {
      let attempts = 0;
      const operation = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Network error');
        }
        return Promise.resolve('success');
      });

      const result = await RetryHandler.executeWithRetry(operation, {
        maxAttempts: 3,
        baseDelay: 10
      });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue(
        new LLMError(ErrorType.AUTHENTICATION_ERROR, 'Auth failed', 'test', false)
      );

      await expect(RetryHandler.executeWithRetry(operation)).rejects.toThrow(LLMError);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect maximum retry attempts', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(RetryHandler.executeWithRetry(operation, {
        maxAttempts: 2,
        baseDelay: 10
      })).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should create LLMError with correct properties', () => {
      const error = new LLMError(
        ErrorType.NETWORK_ERROR,
        'Test error',
        'test-provider',
        true
      );

      expect(error.type).toBe(ErrorType.NETWORK_ERROR);
      expect(error.message).toBe('Test error');
      expect(error.provider).toBe('test-provider');
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('LLMError');
    });
  });
});